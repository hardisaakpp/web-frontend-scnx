> ⚠️ **Documento externo / temporal — NO pertenece a InsightCore-AI-Engine.** Plan de
> frontend para el módulo OTB de **NEXUS** (Vue 3 + TypeScript). Complementa
> `NEXUS_OTB_PLAN_BACKEND.md` y `NEXUS_OTB_CONTRATO_API.md`, los otros dos documentos de
> este mismo trabajo — este no reemplaza a ninguno, se lee junto con ellos. Se dejó en la
> raíz de este repo (ajeno) solo como staging temporal. **Bórralo de aquí una vez lo
> copies a tu proyecto real.**

# Plan de Frontend — Módulo OTB (NEXUS, Vue 3 + TypeScript)

> Stack: Vue 3 + Composition API + `<script setup lang="ts">`, dentro de la arquitectura
> ya definida de NEXUS (esta parte del proyecto sí tiene convenciones existentes, a
> diferencia del backend que partió en libertad total). Todo lo de abajo se adapta a esas
> convenciones si chocan con algo — no al revés.

---

## 1. Navegación: 4 vistas, no 3

Decisión tomada el 2026-08-26 (ver `NEXUS_OTB_CONTRATO_API.md` §0.1): el dashboard
original mete "SKU" y "Nivel1/2/3" como tabs *dentro* de una pantalla Dashboard; en NEXUS
se separan en ítems de navegación de primer nivel, consistentes con el resto del sidebar:

```
Sidebar:
  📈 Catálogo      → /demanda-otb/catalogo
  🧊 Niveles       → /demanda-otb/niveles
  🏷️ Promociones   → /demanda-otb/promociones   (pantalla deshabilitada/oculta hasta
                                                   que se resuelva el alcance, §7 del plan)
  📦 OTB           → /demanda-otb/otb
```

Se reusa el prefijo de ruta `demanda-otb` porque ya existe en NEXUS (la URL del iframe
actual es `scnexus-front/demanda-otb/roland`) — mantiene la coherencia con lo que ya
conocen los usuarios, aunque el contenido detrás cambie de HTML-servido-por-Python a
Vue-consumiendo-la-API-propia.

### El costo de separar: el salto SKU → categoría completa

El toggle original dejaba pasar de "veo el SKU X" a "veo toda la categoría de X" con un
clic, sin perder filtros. Con 4 vistas separadas eso se resuelve con **deep-link por
query params**, no con estado compartido en memoria (así funciona bien también si alguien
llega directo a la URL, o la comparte):

```
Desde ProductInfoCard.vue (vista Catálogo), botón "Ver categoría completa":
  router.push({
    path: '/demanda-otb/niveles',
    query: { campo: 'Nivel3', valor: producto.nivel3, marca: producto.marca }
  })

En NivelesView.vue, onMounted():
  si vienen query.campo/query.valor → preseleccionar el nodo y disparar /agregado
```

No hace falta ningún endpoint nuevo para esto — `/agregado` ya acepta `campo`/`valor`/
`marca` (ver `NEXUS_OTB_CONTRATO_API.md`).

---

## 2. Estructura de carpetas

```
src/modules/demanda-otb/
  api/
    demandaOtbApi.ts       cliente tipado (Axios/fetch), un archivo o uno por vista
    types.ts                tipos generados o escritos a mano desde los DTOs del backend
  stores/                   Pinia
    useCatalogoStore.ts      filtros + resultados paginados + producto seleccionado
    useNivelesStore.ts       nodo/marca seleccionados + datos de /agregado, /genero, /marca-comercial
    useOtbStore.ts           rows, filtros de columna (Set por campo), orden, cobertura editable
    usePromocionesStore.ts   (stub, sin conectar hasta que se resuelva el alcance)
  composables/
    useOtbCalculations.ts    ⚠️ replica EXACTA de otbCalc/otbEfectivo/otbReclas del HTML
                              original: el front recalcula Inv.Final/OTB/semáforo en vivo
                              cuando el usuario edita "Cobertura Deseada", SIN pegarle al
                              backend — usa `matriz`/`otbParams` que ya vienen en /otb
    usePlotlyChart.ts        wrapper del gráfico (o ECharts, ver §5)
    useDebouncedFilter.ts    debounce ~220ms para inputs de texto (código/nombre/SKU)
  views/
    CatalogoView.vue
    NivelesView.vue
    PromocionesView.vue      (deshabilitada, ver §1)
    OtbView.vue
  components/
    catalogo/
      FilterBar.vue           Código, Nombre, Marca, Nivel1/2/3, Género, Confianza
      ProductSelect.vue       dropdown con "Mostrando N de TOTAL"
      ProductInfoCard.vue     ficha del producto (chips) + botón deep-link a Niveles
      DemandChart.vue         compartido con Niveles (mismo componente, distinta fuente)
    niveles/
      NivelSelector.vue       selector de nodo (Nivel1/2/3/Marca) + filtro de marca
      GeneroBreakdownPanel.vue     solo aparece si el nodo es Nivel3
      MarcaComercialBreakdownPanel.vue
    otb/
      OtbFilterBar.vue         mes, marca, colección, marca comercial, origen, flags, buscador
      OtbTable.vue
      MultiSelectColumnFilter.vue   filtros en cascada tipo Excel/Power BI (Set por columna)
      EditableCoverageCell.vue      input de Cobertura Deseada, dispara useOtbCalculations
      OtbSkuDrilldownRow.vue        fila expandida al hacer clic en [+]
      ExportButton.vue         (deshabilitado, fuera de alcance por ahora)
    promociones/               (stub, sin construir aún)
    shared/
      ThemeToggle.vue           solo si NEXUS no tiene ya uno global
```

---

## 3. Mapeo vista → endpoints (resumen, detalle completo en `NEXUS_OTB_CONTRATO_API.md`)

| Vista | Endpoints | Estado backend (2026-08-26) |
|---|---|---|
| Catálogo | `GET /catalogo`, `GET /sku` | `/catalogo` listo · `/sku` pendiente confirmar `Historico` |
| Niveles | `GET /niveles`, `GET /agregado`, `GET /genero`, `GET /marca-comercial` | `/niveles` listo · `/agregado` (sin filtro) pendiente Domain layer · género/marca-comercial bloqueados |
| Promociones | (3 endpoints, ver contrato) | Fuera de alcance — no conectar el store todavía |
| OTB | `GET /otb`, `GET /otb/skus`, `POST /otb/export` | `/otb` (sin filtro) y `/otb/skus` **ya listos y verificados con datos reales** |

**Consecuencia práctica para el orden de construcción del frontend**: aunque OTB es
visualmente la última pestaña del sidebar, es la vista con **menos bloqueos de backend**
ahora mismo — tiene sentido empezar el frontend por ahí si quieres ver algo funcionando
de punta a punta lo antes posible, en vez de seguir el orden visual del sidebar.

---

## 4. Qué copiar tal cual del HTML de referencia (está bien resuelto)

- **Filtros en cascada** con `Set` por columna y recálculo de opciones disponibles según
  los otros filtros activos — el patrón estilo Power BI de la tabla OTB.
- **Debounce** de 220-300ms en búsqueda de texto.
- **Cero roundtrips al backend al editar Cobertura Deseada** — todo el recálculo de
  semáforo/Inv.Final/OTB es cliente (`useOtbCalculations.ts`), usando `matriz` y
  `otbParams` que vienen una sola vez en la respuesta de `/otb`.

## 5. Qué mejorar respecto al original

- **Tipado end-to-end**: nada de concatenar HTML a mano (`esc()` + strings) — con Vue es
  el template + `v-for`, sin el riesgo de XSS del original.
- **Componentizar la tabla OTB**: en el HTML es un único archivo de +2000 líneas; acá
  queda partida en piezas testeables (`OtbTable.vue`, `MultiSelectColumnFilter.vue`, etc.)
- **`DemandChart.vue` compartido** entre Catálogo y Niveles — el original duplica lógica
  de renderizado de Plotly entre el modo SKU y el modo agregado; acá es un solo
  componente parametrizado por la fuente de datos.

---

## 6. Gráfico: Plotly vs. alternativa

El original usa Plotly directo (`<script src="/static/vendor/plotly.min.js">` + llamadas
imperativas a `Plotly.newPlot`). Para Vue hay dos caminos razonables:

- **Mantener Plotly**, envuelto en `usePlotlyChart.ts` (un composable que llama
  `Plotly.newPlot`/`Plotly.purge` en `onMounted`/`onUnmounted`/`watch`). Menor riesgo:
  réplica más fiel del comportamiento ya validado (hover, doble línea proyección con
  patrón de guiones, bandas punteadas).
- **ECharts** si NEXUS ya lo usa en otros módulos (consistencia visual/bundle compartido).

No hay una respuesta única aquí — depende de si NEXUS ya tiene una librería de gráficos
estándar. Si no la tiene, me inclino por mantener Plotly para este módulo específico: es
el que ya está probado contra este caso de uso exacto (dos líneas con distinto trazo,
bandas de confianza, marcadores de tránsito).

---

## 7. Pendiente de definir (no bloquea empezar)

1. ¿NEXUS genera tipos TypeScript desde el Swagger del backend (NSwag/openapi-typescript),
   o se escriben los DTOs a mano en `types.ts`? Con Swagger ya corriendo (lo vimos en tus
   pestañas del navegador), generar tipos automáticos evita que front y back se
   desincronicen — recomendado si el tooling de NEXUS lo soporta.
2. ¿Vue Router usa rutas anidadas bajo un layout `DemandaOtbLayout.vue` con el sidebar
   propio (Catálogo/Niveles/Promociones/OTB), o el sidebar ya es global de NEXUS y estas
   4 solo se agregan como ítems más? Afecta si `NavSidebar` de este módulo es un
   componente nuevo o una extensión del que ya existe.
3. Librería de gráficos (§6) — pendiente de confirmar si hay un estándar ya adoptado en
   NEXUS.
