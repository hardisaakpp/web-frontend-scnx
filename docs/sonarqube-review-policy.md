# Política de revisión de hallazgos de SonarQube

Contrato para resolver issues de SonarQube en este repositorio. Aplica tanto a Claude Code como a cualquier persona del equipo que corrija issues de Sonar.

> Adaptado de `mba3-consultas/docs/sonarqube-review-policy.md` (fuente original, donde también
> se documentan los patrones recurrentes de otros repos recurrentes: `api-middleware-sap`,
> `scnexus-core`). Al encontrar aquí un patrón nuevo que se repita, documentarlo en la sección 6
> de este archivo; si el patrón es genérico (no específico de Vue/TS) considerar avisarlo también
> en `mba3-consultas` para que el resto de apps se beneficien.

## 1. Alcance permitido (lo único que se puede tocar)

- Solo se aplican cambios que correspondan a un **issue concreto reportado por SonarQube** (Code Smell, Bug, Vulnerability, Security Hotspot o Duplication), citando la regla exacta (ej. `typescript:S3776`, `Web:S6819`, etc.).
- Cambios típicos permitidos: reducir complejidad ciclomática, eliminar código muerto/no usado, renombrar variables poco claras, eliminar duplicación, corregir *code smells* de estilo, ajustar manejo de recursos, simplificar condicionales sin cambiar su resultado lógico.
- Nada que no tenga un issue asociado se toca, aunque "de paso" se vea algo mejorable.

## 2. Prohibiciones explícitas

- **Nunca modificar lógica de negocio**: reglas de cálculo, condiciones que afecten el resultado, validaciones de negocio, umbrales, flujos de decisión.
- **Nunca cambiar el comportamiento observable**: mismo input debe producir el mismo output antes y después del cambio.
- **Nunca modificar firmas públicas** (props/emits de componentes, endpoints, contratos de request/response) sin aprobación explícita del usuario.
- **Nunca alterar tests para que "pasen"** ocultando el problema real (cambiar aserciones, comentar tests que fallan, aumentar timeouts para maquillar un fallo).
- **Nunca tocar configuración de infraestructura/despliegue** (CI/CD, variables de entorno, Dockerfiles) salvo que el issue sea explícitamente sobre eso.
- **No borrar código "por sospecha de no uso"** sin verificar referencias reales en todo el repo.

## 3. Zona gris — detenerse y preguntar antes de aplicar

Hay reglas de Sonar que *parecen* de estilo pero pueden cambiar comportamiento. Requieren aprobación explícita antes de aplicarse:

- Cambios en manejo de excepciones (`try/catch`, tipos de error capturados).
- Cambios en comparaciones (`==`/`===`, `||`/`??`, coerciones de tipo).
- Reordenar condiciones con evaluación de cortocircuito.
- Cualquier "Security Hotspot" que implique cambiar validación de entradas o lógica de autenticación/autorización.
- Cualquier refactor que cruce más de un módulo o límites de capas (ej. de vista a store/composable).

## 4. Cuándo NO modificar código (issues cosméticos sin impacto funcional)

Si el hallazgo es puramente de estilo/convención y corregirlo:

- no aporta ningún beneficio funcional, y
- requiere tocar código que funciona intencionalmente así, o implica un cambio innecesariamente amplio (muchos callers, muchos archivos),

→ no modificar el código. En su lugar, indicar cómo silenciarlo desde la interfaz de SonarQube (marcar como "Won't Fix" / "False Positive") o ajustando la configuración del análisis de Sonar, explicando el motivo.

## 5. Proceso de trabajo obligatorio

1. Un issue de SonarQube = un cambio, en un commit separado y descriptivo (`fix(sonar): S3776 - reduce cognitive complexity en X`).
2. Ejecutar los tests existentes (`npx vue-tsc --noEmit`, `npx vitest run`) **antes y después** de cada cambio. Si no hay tests para ese código, avisar antes de tocarlo.
3. Trabajar siempre en una rama separada (nunca directo a `main`); el usuario revisa el diff antes de mergear.
4. Documentar cada cambio: regla resuelta, archivo, línea, y una frase de qué se hizo.

## 6. Patrones recurrentes en este repo (frontend Vue 3 + TS + Tailwind)

Hallazgos específicos del análisis de Sonar sobre `web-scnexus` (repo `scnexus-front`), detectados al resolver 56 issues del módulo `mba3-consultas` (PR 397, 2026-08-31). Evitarlos proactivamente al escribir código nuevo, no solo al corregir el issue existente:

- **Falso positivo de `S1135` ("TODO" comment) en comentarios en español**: la regla busca la subcadena literal `todo` sin distinguir mayúsculas ni límites de palabra, así que matchea falsamente palabras españolas como "**todo**s los filtros...", "necesitan **todo** el ancho...". Antes de tocar código por este issue, leer el comentario completo: si no hay una tarea pendiente real, marcar el issue como **False Positive** vía API/UI con ese motivo, no editar el comentario.
- **Falso positivo de `Web:ItemTagNotWithinContainerTagCheck`/reglas de estructura HTML similares cuando el elemento vive dentro de un componente de librería** (ej. `<li>` dentro de `<ComboboxOptions>` de `@headlessui/vue`): el analizador estático de Sonar solo ve el `<template>` fuente, no el HTML que el componente renderiza en runtime (que sí es válido, ej. un `<ul>` real). Verificar qué renderiza el componente antes de "corregir" la estructura — si ya es válida en runtime, marcar **False Positive**.
- **`Web:S6845` (tabindex en elemento no interactivo) sobre un contenedor scrolleable**: `tabindex="0"` en un `<div>`/`<section>` con `overflow-x:auto` para que el teclado pueda desplazarlo es el patrón WAI-ARIA estándar de "región desplazable" (scrollable region), no un error. Marcar **Won't Fix** citando ese patrón; no quitar el `tabindex`.
- **`Web:S6819` ("usa `<button>`/`<section>`/`<dialog>` en vez del rol ARIA") sobre un elemento con rol simulado anidado dentro de otro elemento interactivo real**: HTML no permite `<button>` dentro de `<button>`. Cuando el elemento con rol simulado (ej. `<span role="button">`) vive dentro de un `<button>` real, la regla no se puede aplicar tal cual sin reestructurar: convertir el contenedor exterior a `<div role="button" tabindex="0" @keydown.enter/.space="...">` y el interior a un `<button>` real (ver `AppDateFilterInput.vue`, commit del fix `Web:S6819,MouseEventWithoutKeyboardEquivalentCheck`).
- **`Web:S6819` sobre `role="dialog"` manual (modal con backdrop propio + focus-trap propio + `@keydown.esc`)**: patrón establecido en 7+ componentes del proyecto (`UploadErrorModal.vue`, `CorregirSkuModal.vue`, `BuscarSkuModal.vue`, etc.) antes de esta migración. El fix correcto es migrar a `<dialog>` nativo con `showModal()`/`close()`, `@cancel.prevent` (reemplaza `@keydown.esc`, preservando cualquier confirmación previa al cierre), detección de backdrop-click vía `evento.target === elDialog` en un `@click` sobre el propio `<dialog>` (reemplaza el wrapper manual + `@click.self`), y elimina el focus-trap manual (`showModal()` ya lo hace nativamente). El `::backdrop` no es alcanzable con CSS `scoped` de Vue — usar un `<style>` sin scoped con una clase específica. Ver `UploadErrorModal.vue` como implementación de referencia. **Al crear un modal nuevo, usar `<dialog>` nativo desde el diseño inicial, no `role="dialog"` manual.**
- **`typescript:S6606` (`||` → `??`) y en general cualquier cambio de operador de coerción**: antes de aplicar el fix automático, verificar si el operando izquierdo puede ser un valor falsy-no-nulo válido (`''`, `0`, `false`). Si puede serlo, es un cambio de comportamiento real (zona gris, sección 3) — requiere decisión explícita del usuario sobre qué comportamiento es el correcto, no aplicar a ciegas.
- **Componentes Vue que envuelven un `<input>`/control nativo en un `<div>` contenedor (ej. `AppDateInput.vue`, `DebouncedSearchField.vue`)**: si no exponen una prop `id` explícita que se reenvíe al control interno, un `<label for="...">` en el componente padre no puede asociarse correctamente (el *fallthrough* automático de atributos de Vue cae en el `<div>` contenedor, no en el control real) → dispara `Web:S6853`. Al crear un componente que envuelve un control nativo, agregar `id?: string` a sus props y enlazarlo al control interno desde el diseño inicial.
- **El número de línea que reporta Sonar puede no apuntar a la función correcta** cuando dos funciones están una junto a la otra y el reporte se generó antes de otros fixes en el mismo archivo (los fixes previos corren líneas). Antes de asumir cuál función es, localizarla por nombre/firma o por complejidad real (contar ramas), no solo por cercanía a la línea reportada.
- **`typescript:S3776` en una función `async` con efectos secundarios (llamadas a API, refs, router, toast), no en una función pura**: no se puede extraer la función completa a un módulo aparte y testear igual que una función pura. Patrón que funciona: (1) extraer toda la lógica de **decisión/cálculo puro** (parseo, armado de mensajes, clasificación de errores) a funciones puras `(datos) => resultado` **fuera** del composable/componente, exportadas y con tests de caracterización; (2) extraer los tramos de **orquestación async** (la llamada a la API + sus ifs de control) a funciones async separadas (pueden quedar como funciones hermanas dentro del mismo `<script setup>`/composable, sin necesidad de exportarlas ni testearlas, si dependen de refs/composables del cierre); (3) la función original queda como una secuencia lineal de pasos que delega toda rama a (1) y (2). Si dos o más funciones puras nuevas necesitan saber "¿ya se encontró algo por otra vía?", pasarles ese acumulado como parámetro explícito — si no, la extracción puede alterar el resultado final para inputs reales.
- **Un conteo manual de "ramas anidadas" NO predice de forma confiable la Cognitive Complexity real de Sonar**: al extraer, apuntar a dejar la función muy por debajo de 15 (una secuencia casi lineal), no confiar en un conteo manual cercano al umbral — el siguiente análisis real de Sonar en CI es la única confirmación verdadera; si Sonar vuelve a reportar la misma función tras un fix, extraer más agresivamente.
- **`Web:S6819` sobre `role="button"` NO se resuelve manteniendo el rol simulado, ni siquiera con teclado manejado a mano**: la regla rechaza *cualquier* `role="button"` sobre un elemento no nativo, sin excepción por manejo de teclado. La única forma de silenciarlo con código (no con Won't Fix) es eliminar el anidamiento de raíz: convertir el trigger y el control secundario en **botones reales hermanos**, no anidados, moviendo el borde/fondo/foco a un `<div>` contenedor no interactivo con `focus-within:ring-*`. Ver `AppDateFilterInput.vue`.
- **Migrar una llamada de un método `@deprecated` (pass-through puro) a su reemplazo**: es un cambio mecánico y seguro en producción, pero **rompe en silencio cualquier test que mockee el módulo/objeto viejo** (`vi.mock(...)`). Correr *solo* los tests de las funciones puras afectadas no lo detecta: hay que correr la suite completa (`npx vitest run tests/unit`) tras este tipo de cambio.
- **Si Sonar reporta el mismo patrón de código en un solo call-site pero el archivo tiene 2+ ocurrencias idénticas** (el análisis de PR solo marca lo que está en el diff "nuevo"): una vez decidido que el fix es seguro, aplicarlo a **todas** las ocurrencias idénticas del archivo, no solo a la marcada.
- **Extraer/mover código preexistente a una función nueva lo convierte en "código nuevo" del PR para el análisis de Sonar, incluso sin cambiarlo una sola línea**: revisar el código movido con la misma atención que código recién escrito (`||` vs `??`, ternarios anidados, regex, etc.) antes de comitear.
- **`typescript:S3358` al construir un sufijo de texto pluralizado dentro de otro ternario que decide si ese sufijo aplica en absoluto**: extraer el ternario del plural a su propia variable (`const plural = n === 1 ? '' : 's'`) ANTES de interpolarlo en el string, desde el primer commit.
- **`typescript:S6544` ("Promise-returning function provided to property where a void return was expected") sobre una opción `persist?: () => void` de un composable compartido, a la que se le pasa una función async fire-and-forget**: NO envolver en un wrapper síncrono ni forzar `await`/`.catch()` en el call site si la función ya maneja sus propios errores internamente — el fix correcto es ampliar el tipo de la opción compartida a `() => void | Promise<void>`.

## 7. Métrica de éxito

- Baja el número de issues abiertos en SonarQube.
- La cobertura de tests no disminuye.
- Cero regresiones funcionales (los tests que pasaban, siguen pasando).
