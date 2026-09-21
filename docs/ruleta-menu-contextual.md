# Menú contextual de campañas

El cambio está en `src/modules/ruleta/views/admin/CampanasView.vue`; las funciones completas `abrirMenu`, `cerrarMenu`, los manejadores y su limpieza están en `src/modules/ruleta/composables/useMenuContextual.ts`.

El menú conserva Teleport a body y posición fixed. Se mide después de nextTick con el ancho ya limitado; usa exclusivamente coordenadas del viewport. Abre debajo cuando cabe y arriba si allí dispone de más espacio. Si ningún lado alcanza, limita la altura y habilita scroll interno. Mantiene 12 px respecto a los bordes y 6 px respecto al disparador. También considera el viewport visual disponible en móviles.

Se cierra al hacer scroll fuera del menú, al redimensionar la ventana o el viewport visual, al pulsar Escape/Tab o al hacer click fuera. Su propio scroll no lo cierra. Los listeners solo existen mientras está abierto y se retiran al cerrar, desmontar o desactivar la vista. Se invalidan aperturas pendientes para evitar que nextTick vuelva a mostrar un menú cerrado.

La animación solo modifica opacidad para no alterar las medidas. Los botones tienen áreas táctiles de al menos 44 px, ARIA de expansión/relación, roles de menú, foco visible y navegación con flechas, Home y End. Escape devuelve el foco al disparador. La explicación de la acción Activar deshabilitada se muestra dentro del menú, también accesible en pantalla táctil.

## Verificación automática

Desde la raíz de `web-scnexus`:

```powershell
npm exec vitest -- run tests/unit/modules/ruleta
npm run build
$env:E2E_WEB_SERVER = 'preview'
npm exec playwright -- test tests/e2e/ruleta-campanas-menu.spec.ts --reporter=list
```

Las pruebas de componente cubren coordenadas con scrollX/scrollY, flip, clamping, altura limitada, scroll interno/externo, teclado, click fuera, cierre antes de nextTick y retirada de listeners. La prueba anterior de imágenes del módulo permanece incluida.

Las pruebas Chromium cargan la aplicación compilada con 25 campañas simuladas y autenticación simulada. Interceptan las peticiones de datos para no contactar ni modificar los backends. Revisan primera, intermedia y última fila a 1920×1080, 1366×768, 768×1024 y 390×844, incluyendo scroll mayor de 500 px. Comprueban separación respecto al botón, márgenes visibles y foco; prueban además una ventana de 640×300 para forzar scroll interno. Las capturas de la última fila quedan en `test-results`.

## Revisión manual

1. Abrir `/ruleta/admin/campanas` con más de 15 campañas y repetir en 1920×1080, 1366×768, 768×1024 y una anchura móvil de 390 px.
2. Abrir el menú en la primera fila, una intermedia y la última. Desplazarse más de 500 px antes de probar las filas inferiores. El menú debe permanecer junto al botón, visible dentro del viewport y sin desplazamiento adicional por scroll.
3. Situar un botón cerca del borde inferior: el menú debe abrir hacia arriba. Reducir mucho la altura: comprobar que se pueden desplazar las acciones dentro del menú hasta Eliminar sin cerrarlo.
4. Abrir y desplazar la página o un contenedor de la tabla: debe desaparecer también el backdrop. Repetir redimensionando la ventana o rotando la tablet.
5. Abrir con Enter/Espacio, recorrer acciones con flechas/Home/End y cerrar con Escape: el foco debe volver al botón. Tab continúa la navegación normal. Comprobar también click externo y apertura táctil.
6. Abrir Configurar premios, Duplicar o Editar y comprobar que conserva la campaña seleccionada. Cambiar de ruta con el menú abierto y volver: no debe quedar overlay ni reaccionar a listeners antiguos.

Fundamento: [coordenadas de getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) y [nextTick de Vue](https://vuejs.org/api/general#nexttick).
