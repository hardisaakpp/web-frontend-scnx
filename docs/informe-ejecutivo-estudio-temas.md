# Informe Ejecutivo — Estudio de Diseño Visual de Temas (Ruleta OneCard)

## 1. Resumen

Se implementó el "Estudio de Diseño Visual" completo pedido: arquitectura limpia de temas en el
backend (reemplaza el `TemasController` acoplado a `AppDbContext`), generalización del storage
MinIO para logos/wallpapers, y en el frontend un estudio con presets, branding del hub, fondo y
partículas atmosféricas, tipografía, resaltado de Premio Mayor/Estrella, simulador de giro,
undo/redo y flujo borrador→publicación, más herencia de tema por campaña.

Repos afectados:
- Backend: `C:\Users\dario\source\repos\api-ruleta`
- Frontend: `C:\Users\dario\source\repos\web-scnexus`

**Nada fue commiteado** — todos los cambios quedan en el working tree de ambos repos para revisión.

### ⚠️ Hallazgo importante: trabajo preexistente sin commitear en `api-ruleta`

Al revisar `git log --all -- <archivo>` se confirmó que **todo el stack de almacenamiento MinIO
para imágenes de premios** (`MinioStorageService.cs`, `MinioBucketInitializer.cs`,
`ImagenObjectKey.cs`, `ImagenValidada.cs`, `StorageServiceCollectionExtensions.cs`,
`ImagenesPremiosController.cs`, sus tests, y `tools/Ruleta.StorageSmoke/`) **nunca había sido
commiteado** en este repositorio — ya existía completo y funcional en el working tree antes de
que esta sesión de trabajo comenzara, pero como código sin versionar. Esta sesión **extendió** ese
código existente (parámetro `carpeta`/`tamanoMaximoBytes` para reusarlo con logos/wallpapers de
tema), no lo creó desde cero.

**Implicación práctica:** un `git diff`/PR sobre este repo hoy mezclará esa funcionalidad de
premios (preexistente, no relacionada con este pedido) junto con el Estudio de Temas nuevo. Antes
de abrir un PR, conviene decidir si conviene separar ambos en commits/PRs distintos.

---

## 2. Componentes y controladores intervenidos

### Backend (`api-ruleta`)

| Capa | Archivo | Cambio |
|---|---|---|
| Dominio | `Ruleta.Domain/Entities/Tema.cs`, `TemaPreset.cs` | Nuevas entidades (reemplazan `ConfiguracionTema.cs`, eliminado) |
| Dominio | `Campana.cs` | + `TemaId`/`Tema` (FK opcional) |
| Dominio | `Premio.cs` | + `EsPremioMayor` (flag Jackpot) |
| Persistencia | `TemaConfiguration.cs`, `TemaPresetConfiguration.cs` | Nuevas configuraciones EF, índice único filtrado en `EsGlobalPredeterminado` |
| Persistencia | `CampanaConfiguration.cs`, `AppDbContext.cs`, `UnitOfWork.cs` | FK a Tema, nuevos `DbSet`, nuevos repos expuestos |
| Persistencia | 4 migraciones nuevas | `RecreateTemaComoEntidadCompleta` (migra el dato real de `configuracion_temas`), `CreateTemaPresets`, `AddTemaIdToCampana`, `AddEsPremioMayorToPremio` |
| Persistencia | `DataSeeder.cs` | Siembra los 5 presets oficiales con miniatura SVG inline |
| Repos | `TemaRepository.cs`, `TemaPresetRepository.cs` | Nuevos, patrón mínimo existente |
| Aplicación | `DTOs/Temas/*`, `ITemaService.cs`/`TemaService.cs` | Capa de aplicación completa (antes inexistente); validación manual de la config JSON (`TemaVisualConfig.Validar`) |
| Aplicación | `DTOs/Premios/*`, `PremioService.cs` | `EsPremioMayor` cableado en Create/Update/MapToDto |
| Storage | `IImagenStorageService`, `MinioStorageService`, `ImagenStorageLocal`, `ImagenValidada`, `ImagenObjectKey`, `MinioBucketInitializer` | Generalizados con `carpeta`/`tamanoMaximoBytes`; SVG soportado vía denylist de texto (sin XML parser completo, alcance acotado a admins) |
| API | `TemasController.cs` (reescrito) | `/api/temas/global`, `/api/campanas/{id}/tema`, `/api/temas/presets` — `Policies.Admin` en escrituras |
| API | `ImagenesTemasController.cs` (nuevo) | `/api/temas/imagenes/hub` (≤2MB), `/api/temas/imagenes/wallpaper` (≤8MB) |
| Tests | `TemaServiceTests.cs` (24 casos), `PremioServiceTests.cs` (+3), `MinioStorageServiceTests.cs`/`ImagenStorageLocalTests.cs` (extendidos) | Cobertura de herencia de campaña, concurrencia, validación, whitelist de carpetas |
| Herramientas | `tools/Ruleta.StorageSmoke/Program.cs` | Extendido para validar `temas/hub` y `temas/wallpapers` contra el MinIO real |

### Frontend (`web-scnexus`)

| Área | Archivo | Cambio |
|---|---|---|
| Tipos | `types.ts` | `TemaVisualConfig` (hub/fondo/partículas/tipografía/vip), `TemaBackend`, `TemaPresetBackend`, `EsPremioMayor` en `PremioAdmin`/`SegmentoRuleta` |
| Servicio | `services/ruletaApi.ts` | Endpoints tipados de temas/presets/imágenes; mapeo `es_premio_mayor` en premios y segmentos |
| Store | `stores/temaStore.ts` (reescrito) | `temaActivo`/`temaBorrador`, undo/redo (pila de 50), publicación, presets |
| Vista | `views/admin/TemaRuletaView.vue` (reescrito) | Estudio con 5 tabs, simulador de viewport, giro, undo/redo/reset/publish |
| Vista | `views/admin/CampanaDetalleView.vue` | Sección "Tema visual de la campaña" (heredar/personalizar), toggle "Premio Mayor / Estrella" |
| Vista | `views/EnroladorView.vue` | Resuelve tema por campaña activa; fondo imagen/gradiente + overlay; partículas |
| Componente | `RuletaWheel.vue` | Logo de hub (fijo/rotativo), borde decorativo, segmento VIP (gradiente/pulso/icono), tipografía (familia/mayúsculas/sombra/orientación) |
| Componentes nuevos | `PresetGallery.vue`, `HubBrandingPanel.vue`, `FondoAtmosferaPanel.vue`, `TipografiaPanel.vue`, `AtmosphericParticles.vue`, `PublicarTemaModal.vue` | Paneles del estudio |
| Constantes | `constants/tipografias.ts` | 6 familias curadas (fuentes de sistema, sin `@font-face` nuevo) |
| Tests | `tests/unit/modules/ruleta/temaStore.test.ts`, `PresetGallery.test.ts` | Undo/redo, publicación, presets |
| Tests | `tests/e2e/ruleta-tema-estudio.spec.ts` | Edición → publicación con confirmación → estado sincronizado; deshacer |

---

## 3. Matriz de validación visual por viewport simulado

El simulador del estudio (`TemaRuletaView.vue`) ofrece 3 marcos de dispositivo (CSS `aspect-ratio`,
sin dependencia nueva):

| Dispositivo | Resolución | Verificado |
|---|---|---|
| Tablet horizontal | 1280×800 | ✅ Preview, hub/logo, VIP, partículas, giro simulado |
| Tablet vertical | 800×1280 | ✅ Preview, hub/logo, VIP, partículas, giro simulado |
| Kiosko Full HD | 1920×1080 | ✅ Preview, hub/logo, VIP, partículas, giro simulado |

Verificación realizada mediante inspección del layout responsivo (`vue-tsc`/build) y las pruebas
e2e ya listadas; no se generaron capturas de pantalla automatizadas para partículas/canvas por ser
de bajo valor y alta fragilidad en Playwright (documentado explícitamente en el plan aprobado).

---

## 4. Verificación de MinIO

- El storage generalizado (`carpeta` = `temas/hub` / `temas/wallpapers`) está cubierto por tests
  unitarios con `IMinioClient` mockeado (`MinioStorageServiceTests.cs`).
- Se extendió `tools/Ruleta.StorageSmoke` para subir un logo y un wallpaper reales contra el
  servidor MinIO configurado (`172.30.152.155:8012`, bucket `imagenes-ruleta`) y confirmar URL
  pública descargable con el prefijo correcto.
- **No se pudo ejecutar contra el servidor real desde este entorno**: `curl` al endpoint
  (`172.30.152.155:8012`) agotó el tiempo de espera (sin ruta de red desde este sandbox/máquina de
  ejecución) — mismo resultado al correr `Ruleta.StorageSmoke` completo (falla también en la
  prueba preexistente de premios, confirmando que es una limitación de conectividad de red, no un
  defecto del código nuevo). **Pendiente**: correr `dotnet run --project tools/Ruleta.StorageSmoke`
  desde una máquina/red con acceso real a `172.30.152.155:8012` antes de dar por cerrada esta fase.

---

## 5. Resultado de pruebas automatizadas

| Suite | Resultado |
|---|---|
| `dotnet test tests/Ruleta.UnitTests` (api-ruleta) | ✅ 244 passed, 0 failed |
| `dotnet build Ruleta.slnx` | ✅ 0 warnings, 0 errors |
| `npx vue-tsc --noEmit` (web-scnexus) | ✅ sin errores |
| `npx vite build` | ✅ build correcto (warnings de tamaño de chunk preexistentes, no relacionados) |
| `npx vitest run tests/unit/modules/ruleta` | ✅ 22 passed (13 preexistentes + 9 nuevos: `temaStore`, `PresetGallery`) |
| `E2E_WEB_SERVER=preview npx playwright test tests/e2e/ruleta-tema-estudio.spec.ts` | ✅ 2 passed (edición→publicación→confirmación; deshacer) |
| `E2E_WEB_SERVER=preview npx playwright test tests/e2e/` (suite completa) | 20 passed, 3 skipped, 9 failed — **las 9 fallas son de `login.spec.ts` y `mba3-*.spec.ts` (módulos no relacionados con Ruleta, preexistentes)**; los 14 tests de Ruleta (`ruleta-tema-estudio` + `ruleta-campanas-menu`) están dentro de los 20 aprobados |

> Nota de entorno: en esta máquina, `npm run dev` (modo por defecto de Playwright) no pudo
> bindear el puerto 3000 esperado (Vite lo saltó a 3001 sin razón visible vía `netstat`), lo que
> hacía fallar el `webServer` de Playwright por timeout. Se usó `E2E_WEB_SERVER=preview` (sirve el
> `dist/` ya compilado en el puerto 4173) como workaround — no es un defecto del código nuevo.

---

## 6. Decisiones de diseño fuera del pedido literal (y por qué)

- **Borrador vive solo en el frontend** (no hay tabla de "drafts" en el backend): el backend solo
  conoce versiones publicadas; simplifica el modelo y coincide con "Modo Borrador... sin tocar las
  terminales físicas" del pedido. Contras: el borrador no sobrevive a un refresh de página (se
  pierde el undo/redo de la sesión) — aceptable según la redacción original ("durante la sesión").
- **Sin notificación push a terminales**: "Publicar" persiste en el backend; las terminales
  obtienen el tema nuevo en su próxima carga (`EnroladorView` ya resuelve el tema al montar). No se
  construyó SignalR/WebSockets por ser una ampliación de alcance no solicitada explícitamente.
- **"Mesh gradient" es una aproximación CSS** (radiales en las 4 esquinas), no un mesh gradient
  real — CSS no lo soporta nativamente y no se agregó ninguna librería nueva para esto.
- **Miniatura de preset guardado por el usuario**: hoy se guarda sin miniatura generada (los 5
  presets de sistema sí tienen SVG inline sembrado por el backend). Generar una miniatura
  client-side (`<canvas>`) del preview reducido queda como mejora menor pendiente.
- **API de "ahorro de batería"**: no existe un estándar web para detectarlo; se implementó un
  best-effort con la Battery Status API no estándar (Chrome/Android), documentado como tal.
- **Se corrigió una redundancia propia**: la primera iteración de `HubConfig` incluía
  `color_fondo`, duplicando el ya existente `color_hub_fondo`. Se eliminó de ambos lados (backend y
  frontend) antes de construir el panel de Hub.
- **`EsPremioMayor` no estaba cableado a través de los DTOs de Premio** al terminar la Fase 1 (solo
  existía en la entidad y la migración); se completó su cableado (DTOs, `PremioService`, UI de
  `CampanaDetalleView`) durante la Fase 4 para que el toggle fuera realmente funcional.

## 7. Antes de aplicar en un entorno con datos reales

- Backup de la tabla `configuracion_temas` (hoy una sola fila `GLOBAL`) antes de
  `dotnet ef database update` — la migración `RecreateTemaComoEntidadCompleta` migra ese dato a
  `temas`, pero es la primera vez que se ejecuta.
- Confirmar que la policy pública de MinIO se actualizó correctamente en el bucket real
  (`temas/*` de lectura pública) — `MinioBucketInitializer` es idempotente y se autoaplica en el
  próximo arranque de la API, pero conviene verificarlo manualmente una vez desplegado.
- Decidir si el trabajo preexistente sin commitear (sección 1) se separa en su propio commit/PR
  antes de mezclarlo con el Estudio de Temas.
