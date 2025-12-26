<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-3xl font-bold text-gray-900">Crear Pedido</h1>
        <button
          @click="$router.push('/mba3-consultas')"
          class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
      </div>
      <p class="text-gray-600">Complete la información del pedido de forma rápida y sencilla</p>
    </div>

    <div class="space-y-8">
      <!-- A. Cabecera del Pedido -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Información del Pedido</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Cliente -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="clienteBusqueda"
                @input="buscarClientes"
                @focus="mostrarSugerenciasClientes = true"
                @blur="ocultarSugerenciasClientes"
                type="text"
                placeholder="Buscar cliente por nombre o código..."
                class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                :class="{ 'border-red-300': errores.cliente }"
              />
              <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              <!-- Dropdown de sugerencias -->
              <div
                v-if="mostrarSugerenciasClientes && clientesFiltrados.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <button
                  v-for="cliente in clientesFiltrados"
                  :key="cliente.id"
                  @click="seleccionarCliente(cliente)"
                  class="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div class="font-medium text-gray-900">{{ cliente.nombre }}</div>
                  <div class="text-sm text-gray-500">{{ cliente.codigo }}</div>
                </button>
              </div>
            </div>
            <p v-if="errores.cliente" class="mt-1 text-sm text-red-600">{{ errores.cliente }}</p>
            <p v-if="pedido.cliente" class="mt-2 text-sm text-gray-600">
              Cliente seleccionado: <span class="font-medium">{{ pedido.cliente.nombre }}</span>
            </p>
          </div>

          <!-- Fecha -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fecha <span class="text-red-500">*</span>
            </label>
            <input
              v-model="pedido.fecha"
              type="date"
              class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              :class="{ 'border-red-300': errores.fecha }"
            />
            <p v-if="errores.fecha" class="mt-1 text-sm text-red-600">{{ errores.fecha }}</p>
          </div>

          <!-- Vendedor -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Vendedor <span class="text-red-500">*</span>
            </label>
            <input
              v-model="pedido.vendedor"
              type="text"
              placeholder="Nombre del vendedor"
              class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              :class="{ 'border-red-300': errores.vendedor }"
            />
            <p v-if="errores.vendedor" class="mt-1 text-sm text-red-600">{{ errores.vendedor }}</p>
          </div>

          <!-- Observaciones -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              v-model="pedido.observaciones"
              rows="3"
              placeholder="Notas adicionales sobre el pedido..."
              class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- B. Detalle del Pedido -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Productos del Pedido</h2>
        
        <!-- Formulario para agregar producto -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <!-- Producto -->
            <div class="md:col-span-5">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Producto
              </label>
              <div class="relative">
                <input
                  v-model="productoBusqueda"
                  @input="buscarProductos"
                  @focus="mostrarSugerenciasProductos = true"
                  @blur="ocultarSugerenciasProductos"
                  type="text"
                  placeholder="Buscar producto..."
                  class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                <!-- Dropdown de sugerencias -->
                <div
                  v-if="mostrarSugerenciasProductos && productosFiltrados.length > 0"
                  class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  <button
                    v-for="producto in productosFiltrados"
                    :key="producto.id"
                    @click="seleccionarProducto(producto)"
                    class="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div class="font-medium text-gray-900">{{ producto.nombre }}</div>
                    <div class="text-sm text-gray-500">{{ producto.codigo }}</div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Cantidad -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                v-model.number="nuevoProducto.cantidad"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <!-- Precio -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Precio
              </label>
              <input
                v-model.number="nuevoProducto.precio"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <!-- Botón Agregar -->
            <div class="md:col-span-3 flex items-end">
              <button
                @click="agregarProducto"
                :disabled="!puedeAgregarProducto"
                class="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla de productos -->
        <div v-if="pedido.productos.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Producto</th>
                <th class="text-right py-4 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                <th class="text-right py-4 px-4 text-sm font-semibold text-gray-700">Precio</th>
                <th class="text-right py-4 px-4 text-sm font-semibold text-gray-700">Subtotal</th>
                <th class="text-center py-4 px-4 text-sm font-semibold text-gray-700 w-20">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in pedido.productos"
                :key="item.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="font-medium text-gray-900">{{ item.producto.nombre }}</div>
                  <div class="text-sm text-gray-500">{{ item.producto.codigo }}</div>
                </td>
                <td class="py-4 px-4">
                  <input
                    v-model.number="item.cantidad"
                    @input="actualizarSubtotal(index)"
                    type="number"
                    min="1"
                    step="1"
                    class="w-24 px-3 py-2 text-right text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </td>
                <td class="py-4 px-4">
                  <input
                    v-model.number="item.precio"
                    @input="actualizarSubtotal(index)"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-32 px-3 py-2 text-right text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </td>
                <td class="py-4 px-4 text-right">
                  <span class="font-semibold text-gray-900 text-base">
                    {{ formatearMoneda(item.subtotal) }}
                  </span>
                </td>
                <td class="py-4 px-4 text-center">
                  <button
                    @click="eliminarProducto(index)"
                    class="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                    title="Eliminar producto"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-50 border-t-2 border-gray-200">
                <td colspan="3" class="py-4 px-4 text-right font-semibold text-gray-700 text-lg">
                  Total:
                </td>
                <td class="py-4 px-4 text-right">
                  <span class="font-bold text-indigo-600 text-xl">
                    {{ formatearMoneda(pedido.total) }}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mensaje cuando no hay productos -->
        <div v-else class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-lg">No hay productos agregados</p>
          <p class="text-sm mt-1">Agregue productos usando el formulario de arriba</p>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          @click="limpiarPedido"
          class="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Limpiar
        </button>
        <button
          @click="guardarPedido"
          :disabled="!puedeGuardar"
          class="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Guardar Pedido
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Cliente, Producto, ProductoPedido, Pedido } from '../types'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()

// Datos mock de clientes
const clientesMock: Cliente[] = [
  { id: '1', codigo: 'CLI001', nombre: 'Distribuidora Central S.A.', direccion: 'Av. Principal 123' },
  { id: '2', codigo: 'CLI002', nombre: 'Comercial del Norte', direccion: 'Calle 45 #67-89' },
  { id: '3', codigo: 'CLI003', nombre: 'Supermercados Unidos', direccion: 'Carrera 12 #34-56' },
  { id: '4', codigo: 'CLI004', nombre: 'Tiendas del Sur', direccion: 'Av. Sur 789' },
  { id: '5', codigo: 'CLI005', nombre: 'Mayorista Express', direccion: 'Zona Industrial' },
]

// Datos mock de productos
const productosMock: Producto[] = [
  { id: '1', codigo: 'PROD001', nombre: 'Camiseta Básica Algodón', precio_base: 25000, unidad: 'Unidad' },
  { id: '2', codigo: 'PROD002', nombre: 'Pantalón Jeans Clásico', precio_base: 85000, unidad: 'Unidad' },
  { id: '3', codigo: 'PROD003', nombre: 'Zapatos Deportivos', precio_base: 120000, unidad: 'Par' },
  { id: '4', codigo: 'PROD004', nombre: 'Chaqueta Impermeable', precio_base: 95000, unidad: 'Unidad' },
  { id: '5', codigo: 'PROD005', nombre: 'Gorra Ajustable', precio_base: 18000, unidad: 'Unidad' },
  { id: '6', codigo: 'PROD006', nombre: 'Bufanda de Lana', precio_base: 22000, unidad: 'Unidad' },
  { id: '7', codigo: 'PROD007', nombre: 'Cinturón de Cuero', precio_base: 35000, unidad: 'Unidad' },
  { id: '8', codigo: 'PROD008', nombre: 'Calcetines Pack x3', precio_base: 15000, unidad: 'Pack' },
]

// Estado del pedido
const pedido = ref<Pedido>({
  cliente: null,
  fecha: new Date().toISOString().split('T')[0],
  vendedor: '',
  observaciones: '',
  productos: [],
  total: 0,
})

// Estado para búsqueda de clientes
const clienteBusqueda = ref('')
const clientesFiltrados = ref<Cliente[]>([])
const mostrarSugerenciasClientes = ref(false)

// Estado para búsqueda de productos
const productoBusqueda = ref('')
const productosFiltrados = ref<Producto[]>([])
const mostrarSugerenciasProductos = ref(false)

// Nuevo producto a agregar
const nuevoProducto = ref<{ producto: Producto | null; cantidad: number; precio: number }>({
  producto: null,
  cantidad: 1,
  precio: 0,
})

// Errores de validación
const errores = ref({
  cliente: '',
  fecha: '',
  vendedor: '',
})

// Computed
const puedeAgregarProducto = computed(() => {
  return nuevoProducto.value.producto !== null && 
         nuevoProducto.value.cantidad > 0 && 
         nuevoProducto.value.precio >= 0
})

const puedeGuardar = computed(() => {
  return pedido.value.cliente !== null &&
         pedido.value.fecha !== '' &&
         pedido.value.vendedor.trim() !== '' &&
         pedido.value.productos.length > 0
})

// Métodos
function buscarClientes() {
  const busqueda = clienteBusqueda.value.toLowerCase().trim()
  if (busqueda === '') {
    clientesFiltrados.value = []
    return
  }
  
  clientesFiltrados.value = clientesMock.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda) ||
    cliente.codigo.toLowerCase().includes(busqueda)
  )
}

function seleccionarCliente(cliente: Cliente) {
  pedido.value.cliente = cliente
  clienteBusqueda.value = cliente.nombre
  mostrarSugerenciasClientes.value = false
  errores.value.cliente = ''
}

function ocultarSugerenciasClientes() {
  setTimeout(() => {
    mostrarSugerenciasClientes.value = false
  }, 200)
}

function buscarProductos() {
  const busqueda = productoBusqueda.value.toLowerCase().trim()
  if (busqueda === '') {
    productosFiltrados.value = []
    return
  }
  
  productosFiltrados.value = productosMock.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda) ||
    producto.codigo.toLowerCase().includes(busqueda)
  )
}

function seleccionarProducto(producto: Producto) {
  nuevoProducto.value.producto = producto
  nuevoProducto.value.precio = producto.precio_base || 0
  productoBusqueda.value = producto.nombre
  mostrarSugerenciasProductos.value = false
}

function ocultarSugerenciasProductos() {
  setTimeout(() => {
    mostrarSugerenciasProductos.value = false
  }, 200)
}

function agregarProducto() {
  if (!puedeAgregarProducto.value || !nuevoProducto.value.producto) return

  const productoPedido: ProductoPedido = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    producto: nuevoProducto.value.producto,
    cantidad: nuevoProducto.value.cantidad,
    precio: nuevoProducto.value.precio,
    subtotal: nuevoProducto.value.cantidad * nuevoProducto.value.precio,
  }

  pedido.value.productos.push(productoPedido)
  calcularTotal()

  // Resetear formulario
  nuevoProducto.value = {
    producto: null,
    cantidad: 1,
    precio: 0,
  }
  productoBusqueda.value = ''
}

function actualizarSubtotal(index: number) {
  const item = pedido.value.productos[index]
  if (item) {
    item.subtotal = item.cantidad * item.precio
    calcularTotal()
  }
}

function eliminarProducto(index: number) {
  pedido.value.productos.splice(index, 1)
  calcularTotal()
}

function calcularTotal() {
  pedido.value.total = pedido.value.productos.reduce((sum, item) => sum + item.subtotal, 0)
}

function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

function validarPedido(): boolean {
  errores.value = {
    cliente: '',
    fecha: '',
    vendedor: '',
  }

  let valido = true

  if (!pedido.value.cliente) {
    errores.value.cliente = 'Debe seleccionar un cliente'
    valido = false
  }

  if (!pedido.value.fecha) {
    errores.value.fecha = 'Debe seleccionar una fecha'
    valido = false
  }

  if (!pedido.value.vendedor.trim()) {
    errores.value.vendedor = 'Debe ingresar el nombre del vendedor'
    valido = false
  }

  return valido
}

function limpiarPedido() {
  if (confirm('¿Está seguro de que desea limpiar todos los datos del pedido?')) {
    pedido.value = {
      cliente: null,
      fecha: new Date().toISOString().split('T')[0],
      vendedor: '',
      observaciones: '',
      productos: [],
      total: 0,
    }
    clienteBusqueda.value = ''
    productoBusqueda.value = ''
    nuevoProducto.value = {
      producto: null,
      cantidad: 1,
      precio: 0,
    }
    errores.value = {
      cliente: '',
      fecha: '',
      vendedor: '',
    }
  }
}

function guardarPedido() {
  if (!validarPedido()) {
    toast.error('Por favor, complete todos los campos requeridos')
    return
  }

  if (pedido.value.productos.length === 0) {
    toast.error('Debe agregar al menos un producto al pedido')
    return
  }

  // Aquí se haría la llamada al API
  console.log('Pedido a guardar:', pedido.value)
  
  toast.success('Pedido guardado correctamente')
  
  // Opcional: limpiar después de guardar
  // limpiarPedido()
}

onMounted(() => {
  // Inicializar fecha con hoy
  pedido.value.fecha = new Date().toISOString().split('T')[0]
})
</script>






