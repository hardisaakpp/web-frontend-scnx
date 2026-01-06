# 🌙 Guía de Modo Oscuro - SCNexus

## ✅ Implementación Completada

El modo oscuro ha sido implementado exitosamente en todo el proyecto SCNexus. Los usuarios ahora pueden alternar entre tema claro y oscuro usando el botón de sol/luna en la barra superior.

## 🎯 Características

- ✨ **Toggle global** - Botón disponible en todas las vistas (header y login)
- 💾 **Persistencia** - La preferencia se guarda en `localStorage`
- 🎨 **Transiciones suaves** - Cambios animados entre temas
- 🖥️ **Detección automática** - Respeta la preferencia del sistema operativo
- 🔄 **Sincronización** - El tema se aplica inmediatamente en toda la app

## 📁 Archivos Modificados

### Configuración Base
- `tailwind.config.js` - Habilitado `darkMode: 'class'`
- `src/style.css` - Variables CSS para ambos temas
- `src/stores/theme.ts` - Store de Pinia para gestión del tema (NUEVO)
- `src/main.ts` - Inicialización del tema al cargar la app

### Componentes Actualizados
- `src/layouts/MainLayout.vue` - Header con toggle y clases dark
- `src/views/Login.vue` - Soporte completo para modo oscuro

## 🎨 Cómo Usar en Tus Componentes

### Clases de Tailwind con Dark Mode

Tailwind CSS usa el prefijo `dark:` para aplicar estilos en modo oscuro:

```vue
<template>
  <!-- Fondo blanco en claro, gris oscuro en dark -->
  <div class="bg-white dark:bg-gray-800">
    
    <!-- Texto negro en claro, blanco en dark -->
    <h1 class="text-gray-900 dark:text-white">Título</h1>
    
    <!-- Texto gris en claro, gris claro en dark -->
    <p class="text-gray-600 dark:text-gray-300">Descripción</p>
    
    <!-- Bordes -->
    <div class="border border-gray-300 dark:border-gray-600">
      Contenido con borde
    </div>
    
    <!-- Botones -->
    <button class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
      Click
    </button>
    
    <!-- Inputs -->
    <input 
      class="bg-white dark:bg-gray-700 
             text-gray-900 dark:text-white 
             border-gray-300 dark:border-gray-600"
    />
  </div>
</template>
```

### Paleta de Colores Recomendada

#### Fondos
- **Principal**: `bg-white dark:bg-gray-800`
- **Secundario**: `bg-gray-50 dark:bg-gray-900`
- **Alternativo**: `bg-gray-100 dark:bg-gray-700`

#### Textos
- **Principal**: `text-gray-900 dark:text-white`
- **Secundario**: `text-gray-600 dark:text-gray-300`
- **Terciario**: `text-gray-500 dark:text-gray-400`

#### Bordes
- **Normal**: `border-gray-300 dark:border-gray-600`
- **Sutil**: `border-gray-200 dark:border-gray-700`

#### Botones Primarios
- **Base**: `bg-indigo-600 dark:bg-indigo-500`
- **Hover**: `hover:bg-indigo-700 dark:hover:bg-indigo-600`

### Acceder al Store de Tema

Si necesitas acceder al estado del tema en tu componente:

```vue
<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// Verificar si está en modo oscuro
console.log(themeStore.isDark) // true o false

// Cambiar el tema programáticamente
themeStore.toggleTheme()

// Establecer un tema específico
themeStore.setTheme('dark') // o 'light'
</script>
```

### Transiciones Suaves

Agrega transiciones para cambios suaves:

```vue
<div class="bg-white dark:bg-gray-800 transition-colors duration-300">
  Contenido con transición suave
</div>
```

## 📋 Ejemplos de Componentes Comunes

### Card
```vue
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 transition-colors duration-300">
  <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Título</h2>
  <p class="text-gray-600 dark:text-gray-300">Contenido de la tarjeta</p>
</div>
```

### Tabla
```vue
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
  <thead class="bg-gray-50 dark:bg-gray-900">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
        Columna
      </th>
    </tr>
  </thead>
  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
        Dato
      </td>
    </tr>
  </tbody>
</table>
```

### Modal
```vue
<div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center">
  <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Modal</h3>
    <p class="text-gray-600 dark:text-gray-300">Contenido del modal</p>
  </div>
</div>
```

### Alert
```vue
<!-- Success -->
<div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded">
  Operación exitosa
</div>

<!-- Error -->
<div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
  Error en la operación
</div>

<!-- Warning -->
<div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded">
  Advertencia
</div>
```

## 🔧 Variables CSS Personalizadas

Si prefieres usar variables CSS en lugar de clases de Tailwind:

```css
/* En src/style.css ya están definidas: */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

.dark {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #374151;
}
```

Úsalas así:
```vue
<div style="background-color: var(--bg-primary); color: var(--text-primary);">
  Contenido
</div>
```

## 🎯 Mejores Prácticas

1. **Siempre agregar transiciones** - `transition-colors duration-300`
2. **Probar ambos temas** - Verifica que todo se vea bien en claro y oscuro
3. **Contraste adecuado** - Asegura legibilidad en ambos modos
4. **Consistencia** - Usa la paleta de colores recomendada
5. **Imágenes y logos** - Considera versiones alternativas si es necesario

## 🚀 Próximos Pasos

Para actualizar componentes existentes:

1. Agrega clases `dark:` a todos los elementos con colores
2. Agrega `transition-colors duration-300` para transiciones suaves
3. Prueba el componente en ambos modos
4. Ajusta colores si es necesario para mejor contraste

## 📝 Notas Técnicas

- El tema se aplica agregando/removiendo la clase `dark` en el elemento `<html>`
- La preferencia se guarda en `localStorage` con la clave `theme`
- El sistema detecta automáticamente la preferencia del OS con `prefers-color-scheme`
- Todos los componentes heredan el tema automáticamente gracias a Tailwind

## 🐛 Solución de Problemas

**Problema**: Los estilos dark no se aplican
- **Solución**: Verifica que `tailwind.config.js` tenga `darkMode: 'class'`

**Problema**: El tema no persiste al recargar
- **Solución**: Verifica que `themeStore.initTheme()` se llame en `main.ts`

**Problema**: Transiciones bruscas
- **Solución**: Agrega `transition-colors duration-300` a los elementos

---

¡El modo oscuro está listo para usar! 🎉
