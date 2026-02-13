# Módulo de Contabilidad

Este es un módulo completo de ejemplo que muestra la estructura recomendada para desarrollar módulos en SCNexus.

## Estructura

```
contabilidad/
├── views/
│   └── ContabilidadView.vue      # Vista principal del módulo
├── components/
│   └── BalanceCard.vue           # Componente de tarjeta de balance
├── services/
│   └── contabilidadApi.ts        # Servicio API para comunicación con backend
├── stores/
│   └── contabilidadStore.ts      # Store Pinia para estado global
├── router.ts                      # Configuración de rutas
└── types.ts                       # Definiciones TypeScript
```

## Funcionalidades

- ✅ Lista de transacciones
- ✅ Tarjetas de balance (Ingresos, Egresos, Balance)
- ✅ CRUD completo de transacciones
- ✅ Filtrado y búsqueda
- ✅ Exportación de datos
- ✅ Store con Pinia para gestión de estado
- ✅ Servicios API configurados
- ✅ Tipos TypeScript definidos

## Uso

Este módulo sirve como plantilla para crear nuevos módulos. Los desarrolladores pueden:

1. Copiar la estructura
2. Adaptar los tipos según sus necesidades
3. Implementar sus propios servicios API
4. Personalizar las vistas y componentes

## API Endpoints

```
GET    /api/contabilidad/transacciones
GET    /api/contabilidad/transacciones/:id
POST   /api/contabilidad/transacciones
PUT    /api/contabilidad/transacciones/:id
DELETE /api/contabilidad/transacciones/:id
GET    /api/contabilidad/balance
GET    /api/contabilidad/export?formato=pdf|excel|csv
```

## Store

```typescript
import { useContabilidadStore } from '@/modules/contabilidad/stores/contabilidadStore'

const store = useContabilidadStore()

// Cargar datos
await store.fetchTransacciones()
await store.fetchBalance()

// Crear transacción
await store.createTransaccion({
  fecha: '2024-11-28',
  descripcion: 'Venta',
  tipo: 'ingreso',
  monto: 1000,
  estado: 'procesado'
})
```

## Personalización

Para adaptar este módulo a otro microservicio, cambiar el `API_URL` en `services/contabilidadApi.ts`:

```typescript
const API_URL = 'https://tu-microservicio.com/api/contabilidad'
```
