> 📤 **Documento de frontend → backend.** Pedido de cambio para `api-demanda-otb`
> (InsightCore-AI-Engine), sobre `POST /otb/{negocio}/export`. Escrito desde el frontend
> (NEXUS/scnexus-front) — quien lleve el backend debe copiarlo a su repo y puede borrarlo
> de acá una vez implementado.
>
> **Actualizado 2026-09-03:** revisión del contrato original — ya no es una lista de
> strings, ahora es una lista de objetos (Nivel3 + Género + Pedido editado). El motivo:
> un mismo Nivel3 tiene varias filas por Género (ver ejemplo abajo, "PANTUFLA" con
> Caballero/Dama/Niña/Niño/No aplica), cada una con su propio Pedido editable en pantalla —
> filtrar solo por Nivel3 (string) no alcanza para saber qué Pedido va con qué Género.

# Export OTB — filtro adicional "varios Nivel 3 + Género, con Pedido editado"

## 1. Qué se pide

Hoy `ExportarOtbRequest.Nivel3` es `string?` (un solo valor, filtro "grueso" que recorta
qué nodos van al Excel — ver el comentario ya existente en `ExportarOtbRequest.cs`).

Se pide agregar un **campo nuevo, independiente**, que acepte varias filas puntuales
(Nivel3 + Género), cada una con el valor de Pedido que el usuario haya editado en pantalla
para esa fila:

```csharp
public record ExportarOtbRequest(
    string Fecha,
    string TipoMes,
    string? Nivel1,
    string? Nivel2,
    string? Nivel3,
    IReadOnlyCollection<Nivel3MultipleItem>? Nivel3Multiple,   // ← NUEVO
    string? Coleccion,
    string? MarcaProveedor,
    string? Origen,
    string? Descontinuado,
    string? Repocision,
    string? Inactivo,
    string? Sku);

public record Nivel3MultipleItem(string Nivel3, string? Genero, decimal Pedido);
```

**No se toca `Nivel3` existente** — sigue funcionando igual que hoy (filtro grueso de un
solo valor, sin Pedido). `Nivel3Multiple` es un filtro adicional que se combina en AND con
todo lo demás (en la práctica el frontend no manda ambos a la vez).

`Genero` es opcional en cada ítem — el frontend lo omite solo si la fila no tiene género
(`null`); en la práctica casi siempre viene (incluye el valor "No aplica" como género
válido, no como ausencia de género).

## 2. Semántica

- `Nivel3Multiple` nulo o vacío → **sin cambios de comportamiento**, el Excel sale igual
  que hoy (default).
- `Nivel3Multiple` con 1+ ítems → el Excel solo incluye nodos cuya combinación
  `(Nivel3, Género)` esté en esa lista (match exacto por ambos campos cuando `Genero` viene;
  si un ítem llega sin `Genero`, matchea por Nivel3 solo, cualquier género).
- El campo `Pedido` de cada ítem es el valor que el usuario editó en pantalla para esa fila
  específica — reemplaza el `Pedido` que normalmente calcula/devuelve BI para ese nodo en el
  Excel exportado (por eso viaja en el request: es un dato editado client-side, no algo que
  el backend recalcule).

## 3. Dónde aplicarlo (mismos 2 puntos donde hoy se aplica `Nivel3`)

**`OtbQueryService.FiltrarPorNivel`** — filtra las filas ya resueltas antes de armar el
Excel, y donde hace match también debe sobrescribir el `Pedido` de la fila con el editado:

```csharp
private static IReadOnlyList<NodoFilaDto> FiltrarPorNivel(
    IReadOnlyList<NodoFilaDto> rows, string? nivel1, string? nivel2, string? nivel3,
    IReadOnlyCollection<Nivel3MultipleItem>? nivel3Multiple)   // ← NUEVO parámetro
{
    if (string.IsNullOrWhiteSpace(nivel1) && string.IsNullOrWhiteSpace(nivel2)
        && string.IsNullOrWhiteSpace(nivel3) && (nivel3Multiple is null || nivel3Multiple.Count == 0))
    {
        return rows;
    }

    var filtradas = rows
        .Where(r => string.IsNullOrWhiteSpace(nivel1) || r.Nivel1 == nivel1)
        .Where(r => string.IsNullOrWhiteSpace(nivel2) || r.Nivel2 == nivel2)
        .Where(r => string.IsNullOrWhiteSpace(nivel3) || r.Nivel3 == nivel3);

    if (nivel3Multiple is not { Count: > 0 })
    {
        return filtradas.ToList();
    }

    // Match por (Nivel3, Género) si el ítem trae Género; solo por Nivel3 si no lo trae.
    // Y se sobrescribe Pedido con el valor editado del ítem que hizo match.
    return filtradas
        .Select(r =>
        {
            var item = nivel3Multiple.FirstOrDefault(m =>
                m.Nivel3 == r.Nivel3 && (m.Genero == null || string.Equals(m.Genero, r.Genero, StringComparison.OrdinalIgnoreCase)));
            return item is null ? null : r with { Pedido = item.Pedido };
        })
        .Where(r => r is not null)
        .Select(r => r!)
        .ToList();
}
```

**`OtbQueryService.FiltrarProyeccionParaExport`** — filtra los SKUs del drill-down para
que coincidan con los mismos nodos filtrados arriba (si no se toca acá, el Excel mostraría
nodos recortados pero con SKUs de nodos que ya no deberían estar). Acá solo importa el
`Nivel3` de cada ítem (no hay Género/Pedido a nivel de Proyeccion):

```csharp
private static IQueryable<Proyeccion> FiltrarProyeccionParaExport(
    IQueryable<Proyeccion> query, string? nivel1, string? nivel2, string? nivel3,
    IReadOnlyCollection<Nivel3MultipleItem>? nivel3Multiple, string? sku)   // ← NUEVO parámetro
{
    if (!string.IsNullOrWhiteSpace(nivel1)) query = query.Where(p => p.Nivel1 == nivel1);
    if (!string.IsNullOrWhiteSpace(nivel2)) query = query.Where(p => p.Nivel2 == nivel2);
    if (!string.IsNullOrWhiteSpace(nivel3)) query = query.Where(p => p.Nivel3 == nivel3);
    if (nivel3Multiple is { Count: > 0 })
    {
        var nivel3s = nivel3Multiple.Select(m => m.Nivel3).Distinct().ToList();
        query = query.Where(p => p.Nivel3 != null && nivel3s.Contains(p.Nivel3));
    }
    // ... resto del método (filtro por sku) sin cambios
}
```

Y actualizar las dos llamadas en `ExportarAsync` para pasar `request.Nivel3Multiple`.

## 4. Contrato JSON (lo que el frontend va a mandar)

Caso con género (lo normal — mismo Nivel3, varias filas de Género, cada una con su Pedido
editado en pantalla):

```json
POST /api/v1/otb/ROLAND/export
{
  "fecha": "2026-08",
  "tipoMes": "regular",
  "nivel3Multiple": [
    {"nivel3": "PANTUFLA", "genero": "CABALLERO", "pedido": 120},
    {"nivel3": "PANTUFLA", "genero": "DAMA", "pedido": 340},
    {"nivel3": "PANTUFLA", "genero": "NIÑA", "pedido": 90}
  ]
}
```

Caso sin género (fila sin distinción de género — el frontend omite la clave):

```json
{"nivel3": "ejemplo", "pedido": 10}
```

Cuando el usuario no marca ningún checkbox, el campo `nivel3Multiple` simplemente no se
manda (igual que los demás filtros opcionales hoy).

## 5. Caso de prueba sugerido

Con el ejemplo de PANTUFLA de arriba (3 géneros marcados, 2 sin marcar de los 5 que existen
para ese Nivel3): el Excel debe traer únicamente esas 3 combinaciones Nivel3+Género (no las
otras 2 de Caballero/Dama/Niña... digo, no las de Niño/No aplica que quedaron sin marcar), y
el Pedido de cada una debe ser el editado (120/340/90), no el que devuelve BI originalmente.
Verificar contra `GET /otb/ROLAND?fecha=2026-08` filtrado manualmente por Nivel3=PANTUFLA
para confirmar que las otras 2 filas (sin marcar) efectivamente no aparecen en el Excel.
