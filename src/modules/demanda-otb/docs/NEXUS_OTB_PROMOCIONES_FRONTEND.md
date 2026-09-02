> ⚠️ **Documento externo / temporal — NO pertenece a InsightCore-AI-Engine.** Plan de
> frontend para la vista Promociones del módulo OTB de **NEXUS** (Vue 3 + TypeScript) —
> complementa `NEXUS_OTB_ENDPOINT_PROMOCIONES.md` (el contrato de los 3 endpoints que
> consume) y `NEXUS_OTB_PLAN_FRONTEND.md` (donde esta vista está listada como stub sin
> construir). Se dejó en la raíz de este repo (ajeno) solo como staging temporal.
> **Bórralo de aquí una vez lo copies a tu proyecto real.**

# Vista Promociones — Frontend (Vue 3 + TypeScript)

> Fuente de la verdad visual: el bloque `<div id="view-promociones">` +
> `filtrarPromoSku`, `guardarPromo`, `cargarPromos`, `borrarPromo` de
> `demanda_otb_dashboard.html` en InsightCore-AI-Engine.

---

## 1. Flujo de la pantalla (igual que el original, solo re-mapeado a componentes Vue)

```
1. Usuario escribe en el buscador (código o nombre) ──► GET /catalogo/{negocio}?q=...
                                                          (reusa el endpoint del Catálogo,
                                                           con debounce ~220ms)
2. Elige un SKU de la lista de resultados             ──► queda "seleccionado" en el store
3. Escribe el % de levantamiento (ej. 50 = +50%)
4. Ve "Aplica a: <mes siguiente>" (informativo, calculado o devuelto por el backend)
5. Clic "Guardar promoción"                            ──► POST /promociones/{negocio}
   → respuesta inmediata: "antes: X uds → después: Y uds (+50%)"
6. La tabla "Promociones activas" se refresca           ──► GET /promociones/{negocio}
7. Botón 🗑️ en una fila de la tabla                     ──► DELETE /promociones/{negocio}/{kp}/{ke}
```

Como ya se decidió que esta vista es **autocontenida** (`NEXUS_OTB_ENDPOINT_PROMOCIONES.md`
§3, Opción A) — nada de esto invalida caché de `/sku` ni `/agregado`. El único estado que
cambia al guardar/borrar es la propia tabla de promociones activas.

---

## 2. Componentes

```
views/
  PromocionesView.vue        orquesta los 3 componentes de abajo + el store

components/promociones/
  PromoSearchInput.vue        input de texto + lista de resultados (reusa /catalogo?q=)
  PromoForm.vue                % de levantamiento + "Aplica a: <mes>" + botón Guardar +
                                resultado inline (antes → después)
  PromoActiveTable.vue         tabla de promociones activas + botón eliminar por fila

stores/
  usePromocionesStore.ts       skuSeleccionado, upliftPct, promoActivas[], mesObjetivo
```

### `PromoSearchInput.vue`
- Input de texto con `useDebouncedFilter.ts` (ya existe del módulo Catálogo).
- Llama `GET /catalogo/{negocio}?q=...&limite=50` (el mismo límite chico que usa el
  original para este buscador — no necesitas los 300 del catálogo completo aquí).
- Al elegir un resultado: `usePromocionesStore.skuSeleccionado = { keyProducto, keyEmpresa, codigo, nombre }`.
- Enter en el input con un solo resultado visible = seleccionarlo directo (mismo atajo
  que el original, `promoEnter()`).

### `PromoForm.vue`
- Input numérico `upliftPct` (validar > 0 antes de habilitar "Guardar").
- Texto informativo "Aplica a: {mesObjetivo}" — si el backend no lo manda de antemano,
  este componente puede calcularlo localmente (mes siguiente al actual) solo para
  mostrarlo antes de guardar; el valor real que cuenta es el que devuelve el `POST`.
- Al guardar: `POST /promociones/{negocio}` con `{ keyProducto, keyEmpresa, upliftPct }`.
  - Éxito: mostrar `"{antes} uds → {despues} uds (+{upliftPct}%)"`, refrescar
    `PromoActiveTable`.
  - Error 400 (sin proyección para ese mes): mostrar el mensaje tal cual devuelva el
    backend, no inventar uno nuevo en el frontend.

### `PromoActiveTable.vue`
- `GET /promociones/{negocio}` al montar la vista y después de cada guardar/borrar.
- Columnas: SKU, Empresa, Mes, %, Antes, Después, [🗑️].
- Borrar: `DELETE /promociones/{negocio}/{keyProducto}/{keyEmpresa}` → refresca la lista.
  Sin confirmación extra necesaria (acción reversible: se puede volver a crear la promo).

---

## 3. Qué NO portar del original

- **Nada de recalcular antes/después en el cliente.** El original tampoco lo hace — el
  `antes`/`despues` siempre viene calculado del backend (`registrar_promocion` y
  `listar_promociones` lo devuelven ya resuelto). Mantén esa misma disciplina: el
  frontend solo pinta lo que la API le da, cero aritmética de negocio en Vue.
- **Nada de manejo de archivo JSON local** (`ajustes.json`) — eso era una limitación de
  arquitectura del original (proceso Python único), no aplica a NEXUS en absoluto.

## 4. Pendiente de definir

- ¿El buscador de `PromoSearchInput.vue` limita a `limite=50` como el original, o usas
  el mismo componente `ProductSelect.vue` del Catálogo con un límite distinto? Reusar
  componente ahorra código; el original usa un input+lista más simple (sin `<select>`)
  porque no necesita mostrar 300 opciones a la vez, solo confirmar 1 coincidencia.
