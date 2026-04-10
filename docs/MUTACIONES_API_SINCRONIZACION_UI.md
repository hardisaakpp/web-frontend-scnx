# Sincronización de la UI con respuestas de mutación (estándar del proyecto)

## Objetivo

Cuando un usuario guarda cambios (**PATCH**, **PUT** o, si aplica, **POST** de actualización), las columnas y campos derivados del servidor —por ejemplo **última actualización**, **usuario que modificó**, totales calculados o flags— deben reflejarse **en la misma sesión** sin obligar a recargar la página ni a asumir valores solo en el cliente.

El backend debe devolver el **registro ya persistido** (como lo lee de la base de datos). El frontend debe **aplicar esa respuesta al estado local** (lista, fila, Pinia, etc.).

## Principios

1. **Un solo round-trip**: no hace falta un segundo `GET` solo para refrescar auditoría si la mutación ya devuelve el ente actualizado.
2. **Verdad del servidor**: fechas y usuario de auditoría deben venir de la respuesta, no inventarse en el cliente tras el `await`.
3. **Resiliencia**: si el JSON no es reconocible o el backend aún no devuelve el cuerpo, el código puede hacer **`refetch`** del listado o mantener un fallback mínimo documentado en el módulo.

## Contrato recomendado con el backend

- Tras una mutación exitosa, la API responde con el recurso actualizado, típicamente bajo una clave `data` (p. ej. `{ ok: true, data: { ... } }`) o el formato que exponga vuestro router PHP / controlador .NET.
- El actor de la operación debe identificarse de forma consistente (por ejemplo cabecera **`X-User`** y/o campo acordado en el cuerpo), para que la auditoría en BD coincida con quien edita.

## Implementación en el servicio (capa API)

- Las funciones que llamen a **axios** para mutar (`patch`, `put`, `post`) deben:
  - Leer **`response.data`**.
  - **Parsear** el cuerpo a un modelo tipado del dominio (normalizando alias de campos si el listado ya lo hace: fechas, enums, etc.).
  - Devolver **`Entidad | null`**: la entidad si se pudo extraer; `null` si la forma del JSON no encaja (el caller decidirá refetch).

Funciones auxiliares recomendadas:

- **`mapXxxRow(raw)`**: misma normalización que en el listado GET, para no duplicar reglas.
- **`parseXxxMutationResponse(data: unknown)`**: extrae el objeto entidad de envoltorios (`payload`, `data`, etc.).

## Implementación en la vista o store

- Tras **`await updateXxx(...)`**:
  - Si hay entidad devuelta: **`Object.assign(fila, entidad)`** o sustituir el elemento en el array por **`{ ...anterior, ...entidad }`** según convenga a la reactividad de Vue.
  - Si es **edición de formulario** que cierra y la fila sigue en una tabla: localizar por **`id`** y fusionar en el array de items.
- Si el resultado es **`null`**: **`await fetchListado()`** (o invalidar query si se usa TanStack Query en el futuro).

## Alcance actual en el repositorio

| Área | Estado |
|------|--------|
| **Referencia implementada** | Módulo **gestión de empleados / tienda** (`src/modules/gestion-usuarios/`): `services/storeEmployeesApi.ts` (`mapStoreEmployeeRow`, `parseStoreEmployeeMutationResponse`, `updateStoreEmployee` → `StoreEmployee \| null`) y `views/GestionUsuariosView.vue` (fusión en fila tras inline edit, formulario y toggles). |
| **Resto de módulos** | No replicado de forma sistemática; al tocar un flujo de guardado en otro módulo, aplicar esta guía de forma incremental. |

## Anti-patrones

- Confiar solo en poner a mano `new Date()` o el usuario del store de auth en el cliente **sin** fusionar la respuesta, cuando el backend ya devuelve auditoría.
- Ignorar el cuerpo de la respuesta y hacer siempre `fetch` completo por coste y parpadeo innecesarios (aceptable solo como fallback si el contrato API es débil).

## Referencias cruzadas

- [ARQUITECTURA_Y_NUEVOS_MODULOS.md](ARQUITECTURA_Y_NUEVOS_MODULOS.md) — sección *Desarrollo de Nuevos Módulos Frontend*, convención sobre mutaciones.
- [MODULOS.md](MODULOS.md) — estructura de módulos y servicios API.

---

**Última actualización:** Abril 2026
