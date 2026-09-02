> ⚠️ **Documento externo / temporal — NO pertenece a InsightCore-AI-Engine.** Reporte de
> un bug encontrado en el frontend del módulo OTB de **NEXUS** — para el/la desarrolladora
> de frontend. Complementa `NEXUS_OTB_ENDPOINT_OTB.md` §5 (donde ya estaba documentada la
> fórmula correcta) y `NEXUS_OTB_PLAN_FRONTEND.md` (`useOtbCalculations.ts`). Se dejó en
> la raíz de este repo (ajeno) solo como staging temporal. **Bórralo de aquí una vez lo
> copies a tu proyecto real.**

# Bug — "Inv. Final Planificado" usa `ventasTotal` en vez de `ventasPlanificada`

**Estado**: 🔴 confirmado con aritmética exacta, no es una sospecha — reproducible al
100%. **Dónde vive**: el cálculo cliente-side de Inv. Final / OTB (el equivalente de
`useOtbCalculations.ts` / `otbCalc()`), en la vista OTB.

---

## 1. El síntoma

En la vista OTB, la columna **"Inv. Final Planificado"** no coincide con el valor que
muestra el dashboard original de BI para el mismo nodo, mismo mes, misma Cobertura
Deseada (90 días, sin editar).

## 2. Caso de reproducción (Nivel3=CARAMELO, negocio=ROLAND, mes=2026-08)

Backend (ya confirmado correcto — `GET /api/v1/otb/ROLAND?fecha=2026-08`):
```json
{
  "ventasPlanificada": 40,
  "min80": 30, "max80": 66,
  "catNuevo": 19,
  "ventasTotal": 59
}
```

| | Cobertura | Inv. Final mostrado |
|---|---|---|
| BI (original) | 90 | **120** |
| NEXUS (actual) | 90 | **177.0** ❌ |

## 3. La prueba aritmética — por qué es 100% seguro que es esto y no otra cosa

Fórmula (modo Regular): `Inv. Final = Cobertura × (Ventas / 30)`

```
90 × (ventasPlanificada / 30) = 90 × (40/30) = 120.0   ← coincide EXACTO con BI
90 × (ventasTotal      / 30) = 90 × (59/30) = 177.0   ← coincide EXACTO con lo que
                                                          muestra NEXUS ahora mismo
```

Los dos resultados calzan al decimal exacto contra los dos valores observados. El
frontend está usando `ventasTotal` (reposición + catálogo nuevo) donde debería usar
`ventasPlanificada` (solo reposición).

## 4. Por qué es así en el original — el catálogo nuevo NUNCA entra a esta fórmula

```js
// dashboard original — otbCalc()
function otbInvFinal(ventas, cob) {
  return otbTipo === 'pico' ? cob * ((ventas / 3) / 30) : cob * (ventas / 30);
}
function otbCalc(r) {
  const inv = otbInvFinal(r.ventas, r.cobertura);   // r.ventas = Ventas Planificada, NUNCA r.ventas_total
  return { inv: inv, otb: inv + r.ventas - r.stock - r.transito };
}
```

`r.ventas` en el original es literalmente el campo "Ventas Planificada" (reposición de
SKUs existentes) — **nunca** el total con catálogo nuevo. Es una decisión de negocio
explícita: el catálogo nuevo es una **estimación** de productos que todavía no existen,
se muestra como columna informativa en la tabla, pero no participa del cálculo de
inventario/compra (Inv. Final, OTB) en ningún lado del sistema original.

## 5. Impacto — también afecta la columna OTB

Mismo origen del bug, mismo arreglo necesario:

```
Con el bug (ventasTotal):    177 + 59 - 74 - 0 = 162
Correcto (ventasPlanificada): 120 + 40 - 74 - 0 = 86   ← esto es lo que BI muestra (OTB=86)
```

Si el bug está en el helper compartido (`otbCalc`/equivalente), corrige las dos columnas
a la vez — es el mismo cálculo.

---

## 6. El fix

En el composable de cálculo (`useOtbCalculations.ts` o donde viva tu `otbCalc`
equivalente): cambiar el input de la fórmula de `ventasTotal` a `ventasPlanificada`.
**No es un cambio de fórmula, es un cambio de qué variable se le pasa.**

```ts
// ANTES (bug)
function otbInvFinal(row: OtbRow, cobertura: number): number {
  const ventas = row.ventasTotal;   // ❌
  ...
}

// DESPUÉS (fix)
function otbInvFinal(row: OtbRow, cobertura: number): number {
  const ventas = row.ventasPlanificada;   // ✅ igual que el original
  ...
}
```

## 7. Caso de prueba para verificar el fix (golden test)

Con `ventasPlanificada=40`, `cobertura=90`, `stockInicial=74`, `transito=0`, modo Regular:

```
Inv. Final esperado = 120
OTB esperado         = 86
```

Si cambian estos tres inputs, la fórmula sigue siendo la misma — solo usa este caso
como referencia rápida para confirmar que el fix quedó bien antes de seguir con el resto
de filas/nodos.
