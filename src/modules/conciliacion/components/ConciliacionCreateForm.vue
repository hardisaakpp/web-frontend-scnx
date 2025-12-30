<template>
  <form @submit.prevent="submitForm" class="space-y-6" :class="{ 'opacity-50 pointer-events-none': !documentoId }">
        <!-- Nombre -->
        <div>
          <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span class="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            v-model="form.nombre"
            type="text"
            @blur="validateField('nombre')"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              errors.nombre ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Ingrese el nombre de la conciliación"
          />
          <p v-if="errors.nombre" class="mt-1 text-sm text-red-600">{{ errors.nombre }}</p>
        </div>

        <!-- Tipo -->
        <div>
          <label for="tipo" class="block text-sm font-medium text-gray-700 mb-1">
            Tipo <span class="text-red-500">*</span>
          </label>
          <select
            id="tipo"
            v-model="form.tipo"
            @blur="validateField('tipo')"
            @change="validateField('tipo')"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white',
              errors.tipo ? 'border-red-300' : 'border-gray-300'
            ]"
          >
            <option value="">Seleccione un tipo</option>
            <option value="bancaria">Bancaria</option>
            <option value="contable">Contable</option>
          </select>
          <p v-if="errors.tipo" class="mt-1 text-sm text-red-600">{{ errors.tipo }}</p>
        </div>

        <!-- Fechas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Fecha Inicio -->
          <div>
            <label for="fecha_inicio" class="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio <span class="text-red-500">*</span>
            </label>
            <input
              id="fecha_inicio"
              v-model="form.fecha_inicio"
              type="date"
              @blur="validateField('fecha_inicio')"
              @change="validateField('fecha_inicio')"
              :class="[
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                errors.fecha_inicio ? 'border-red-300' : 'border-gray-300'
              ]"
            />
            <p v-if="errors.fecha_inicio" class="mt-1 text-sm text-red-600">{{ errors.fecha_inicio }}</p>
          </div>

          <!-- Fecha Fin -->
          <div>
            <label for="fecha_fin" class="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin <span class="text-red-500">*</span>
            </label>
            <input
              id="fecha_fin"
              v-model="form.fecha_fin"
              type="date"
              @blur="validateField('fecha_fin')"
              @change="validateField('fecha_fin')"
              :min="form.fecha_inicio || ''"
              :class="[
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                errors.fecha_fin ? 'border-red-300' : 'border-gray-300'
              ]"
            />
            <p v-if="errors.fecha_fin" class="mt-1 text-sm text-red-600">{{ errors.fecha_fin }}</p>
          </div>
        </div>

        <!-- Cuenta ID -->
        <div>
          <label for="cuenta_id" class="block text-sm font-medium text-gray-700 mb-1">
            Cuenta ID <span class="text-red-500">*</span>
          </label>
          <input
            id="cuenta_id"
            v-model="form.cuenta_id"
            type="text"
            @blur="validateField('cuenta_id')"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              errors.cuenta_id ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Ingrese el ID de la cuenta"
          />
          <p v-if="errors.cuenta_id" class="mt-1 text-sm text-red-600">{{ errors.cuenta_id }}</p>
        </div>

        <!-- Moneda -->
        <div>
          <label for="moneda" class="block text-sm font-medium text-gray-700 mb-1">
            Moneda <span class="text-red-500">*</span>
          </label>
          <input
            id="moneda"
            v-model="form.moneda"
            type="text"
            @blur="validateField('moneda')"
            @input="normalizeMoneda"
            maxlength="3"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase',
              errors.moneda ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="USD, EUR, COP, etc."
          />
          <p v-if="errors.moneda" class="mt-1 text-sm text-red-600">{{ errors.moneda }}</p>
          <p class="mt-1 text-xs text-gray-500">Código ISO de 3 letras (ej: USD, EUR, COP)</p>
        </div>

        <!-- Mensaje si no hay documento -->
        <div v-if="!documentoId" class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <div class="flex items-center">
            <svg class="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm font-medium">Debe cargar un documento antes de completar el formulario</p>
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label for="observaciones" class="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            v-model="form.observaciones"
            @blur="validateField('observaciones')"
            @input="validateField('observaciones')"
            rows="4"
            maxlength="1000"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              errors.observaciones ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Ingrese observaciones adicionales (opcional)"
          ></textarea>
          <div class="flex justify-between items-center mt-1">
            <p v-if="errors.observaciones" class="text-sm text-red-600">{{ errors.observaciones }}</p>
            <p class="text-xs text-gray-500 ml-auto">
              {{ (form.observaciones || '').length }} / 1000 caracteres
            </p>
          </div>
        </div>

        <!-- Error general del backend -->
        <div v-if="backendError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p class="font-medium">{{ backendError }}</p>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            @click="resetForm"
            :disabled="isSubmitting"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar
          </button>
          <button
            type="submit"
            :disabled="hasErrors || isSubmitting || !documentoId"
            class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{{ isSubmitting ? 'Creando...' : 'Crear Conciliación' }}</span>
          </button>
        </div>
      </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import type { ConciliacionCreateData, BackendValidationError } from '../types'

const props = defineProps<{
  documentoId?: string
}>()

const emit = defineEmits<{
  created: []
}>()

const store = useConciliacionStore()
const toast = useToast()

// Estado del formulario (usamos tipo más amplio para el estado inicial)
const form = reactive<{
  nombre: string
  tipo: 'bancaria' | 'contable' | ''
  fecha_inicio: string
  fecha_fin: string
  cuenta_id: string
  moneda: string
  observaciones: string
}>({
  nombre: '',
  tipo: '',
  fecha_inicio: '',
  fecha_fin: '',
  cuenta_id: '',
  moneda: '',
  observaciones: '',
})

// Errores de validación
const errors = reactive<Record<string, string>>({
  nombre: '',
  tipo: '',
  fecha_inicio: '',
  fecha_fin: '',
  cuenta_id: '',
  moneda: '',
  observaciones: '',
})

// Estado
const isSubmitting = ref(false)
const backendError = ref<string>('')

// Watch para limpiar errores cuando se recibe documentoId
watch(() => props.documentoId, (newId) => {
  if (newId) {
    // Si hay un nuevo documento_id, limpiar cualquier error relacionado
    // (aunque ya no validamos documento_id en el frontend)
  }
})

// Validar campo individual
function validateField(fieldName: string): void {
  const fieldValue = form[fieldName as keyof typeof form]
  errors[fieldName] = ''

  switch (fieldName) {
    case 'nombre':
      const nombreTrimmed = (fieldValue as string)?.trim() || ''
      if (!nombreTrimmed) {
        errors.nombre = 'El nombre es requerido'
      } else if (nombreTrimmed.length < 3) {
        errors.nombre = 'El nombre debe tener al menos 3 caracteres'
      }
      // Validación: longitud máxima igual al backend (150 caracteres)
      else if (nombreTrimmed.length > 150) {
        errors.nombre = 'El nombre no puede exceder 150 caracteres'
      }
      break

    case 'tipo':
      if (!fieldValue || (fieldValue !== 'bancaria' && fieldValue !== 'contable')) {
        errors.tipo = 'Debe seleccionar un tipo válido'
      }
      break

    case 'fecha_inicio':
      if (!fieldValue) {
        errors.fecha_inicio = 'La fecha de inicio es requerida'
      } else {
        // Validar que fecha_inicio <= fecha_fin (si existe fecha_fin)
        if (form.fecha_fin && fieldValue > form.fecha_fin) {
          errors.fecha_inicio = 'La fecha de inicio debe ser anterior o igual a la fecha fin'
        }
        // Validar formato de fecha (input type="date" garantiza formato, pero validamos por seguridad)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(fieldValue as string)) {
          errors.fecha_inicio = 'Formato de fecha inválido'
        }
      }
      break

    case 'fecha_fin':
      if (!fieldValue) {
        errors.fecha_fin = 'La fecha fin es requerida'
      } else {
        // Validar que fecha_fin >= fecha_inicio (si existe fecha_inicio)
        if (form.fecha_inicio && fieldValue < form.fecha_inicio) {
          errors.fecha_fin = 'La fecha fin debe ser posterior o igual a la fecha inicio'
        }
        // Validar formato de fecha
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(fieldValue as string)) {
          errors.fecha_fin = 'Formato de fecha inválido'
        }
      }
      break

    case 'cuenta_id':
      const cuentaIdTrimmed = (fieldValue as string)?.trim() || ''
      if (!cuentaIdTrimmed) {
        errors.cuenta_id = 'La cuenta ID es requerida'
      }
      // Validación adicional: longitud mínima y máxima razonable
      else if (cuentaIdTrimmed.length < 1) {
        errors.cuenta_id = 'La cuenta ID no puede estar vacía'
      } else if (cuentaIdTrimmed.length > 255) {
        errors.cuenta_id = 'La cuenta ID no puede exceder 255 caracteres'
      }
      break

    case 'moneda':
      const monedaValue = (fieldValue as string)?.trim() || ''
      if (!monedaValue) {
        errors.moneda = 'La moneda es requerida'
      } else if (!/^[A-Z]{3}$/.test(monedaValue)) {
        errors.moneda = 'La moneda debe ser un código ISO de 3 letras (ej: USD, EUR, COP)'
      }
      break

    case 'observaciones':
      const observacionesValue = (fieldValue as string) || ''
      if (observacionesValue.length > 1000) {
        errors.observaciones = 'Las observaciones no pueden exceder 1000 caracteres'
      }
      break
  }
}

// Validar todo el formulario
function validateForm(): boolean {
  // Validar que existe documentoId
  if (!props.documentoId) {
    toast.error('Documento requerido', 'Debe cargar un documento antes de crear la conciliación')
    return false
  }

  // Validar todos los campos
  validateField('nombre')
  validateField('tipo')
  validateField('fecha_inicio')
  validateField('fecha_fin')
  validateField('cuenta_id')
  validateField('moneda')
  validateField('observaciones')

  // Verificar si hay errores
  return !Object.values(errors).some(error => error !== '')
}

// Normalizar moneda (a mayúsculas)
function normalizeMoneda(): void {
  form.moneda = form.moneda.toUpperCase()
}

// Mapear errores del backend a campos del formulario
function mapBackendErrors(validationErrors: BackendValidationError[]): void {
  // Limpiar errores anteriores del backend
  Object.keys(errors).forEach(key => {
    if (errors[key].includes('(servidor)')) {
      errors[key] = ''
    }
  })

  backendError.value = ''

  validationErrors.forEach(error => {
    const fieldPath = error.loc
    if (Array.isArray(fieldPath) && fieldPath.length > 0) {
      // El último elemento es el nombre del campo
      const fieldName = fieldPath[fieldPath.length - 1] as string
      
      // Mapear nombres de campos del backend al formulario
      const fieldMap: Record<string, string> = {
        'nombre': 'nombre',
        'tipo': 'tipo',
        'fecha_inicio': 'fecha_inicio',
        'fecha_fin': 'fecha_fin',
        'cuenta_id': 'cuenta_id',
        'moneda': 'moneda',
        'documento_id': 'documento_id', // Aunque no se muestra, puede venir error del backend
        'observaciones': 'observaciones',
      }

      const formFieldName = fieldMap[fieldName]
      if (formFieldName && errors.hasOwnProperty(formFieldName)) {
        errors[formFieldName] = `${error.msg} (servidor)`
      } else {
        // Si no se puede mapear a un campo específico, mostrar error general
        backendError.value = error.msg
      }
    }
  })
}

// Preparar datos para enviar (normalización)
// IMPORTANTE: Los datos deben estar normalizados ANTES de enviar al backend
// El backend también valida, pero normalizar aquí mejora UX y reduce errores
function prepareFormData(): ConciliacionCreateData {
  if (!props.documentoId) {
    throw new Error('No hay documento cargado')
  }
  
  if (!form.tipo || (form.tipo !== 'bancaria' && form.tipo !== 'contable')) {
    throw new Error('Tipo inválido')
  }
  
  // Asegurar que las fechas estén en formato ISO (input type="date" ya devuelve "YYYY-MM-DD")
  // No hacer conversiones adicionales que puedan cambiar el formato
  const fechaInicio = form.fecha_inicio // Ya está en formato "YYYY-MM-DD"
  const fechaFin = form.fecha_fin       // Ya está en formato "YYYY-MM-DD"
  
  return {
    nombre: form.nombre.trim(),                                      // Normalizar: eliminar espacios
    tipo: form.tipo.toLowerCase() as 'bancaria' | 'contable',       // Normalizar: lowercase
    fecha_inicio: fechaInicio,                                       // Formato ISO: "YYYY-MM-DD"
    fecha_fin: fechaFin,                                             // Formato ISO: "YYYY-MM-DD"
    cuenta_id: form.cuenta_id.trim(),                                // Normalizar: eliminar espacios
    moneda: form.moneda.toUpperCase().trim(),                        // Normalizar: uppercase
    documento_id: props.documentoId,                                 // UUID del documento (no editable)
    observaciones: form.observaciones?.trim() || undefined,          // Normalizar: eliminar espacios, opcional
  }
}

// Enviar formulario
async function submitForm(): Promise<void> {
  // Validar antes de enviar
  if (!validateForm()) {
    toast.error('Errores de validación', 'Por favor corrija los errores antes de continuar')
    return
  }

  isSubmitting.value = true
  backendError.value = ''

  try {
    const formData = prepareFormData()
    await store.createConciliacion(formData)
    
    toast.success('Conciliación creada', 'La conciliación se ha creado exitosamente')
    resetForm()
    emit('created')
  } catch (error: any) {
    console.error('Error al crear conciliación:', error)
    
    // Manejar errores de validación del backend (422)
    if (error.validationErrors && Array.isArray(error.validationErrors)) {
      mapBackendErrors(error.validationErrors)
      toast.error('Errores de validación', 'Revise los campos marcados')
    } else {
      // Error general
      const errorMessage = error.message || 'Error al crear la conciliación'
      backendError.value = errorMessage
      toast.error('Error', errorMessage)
    }
  } finally {
    isSubmitting.value = false
  }
}

// Resetear formulario
function resetForm(): void {
  form.nombre = ''
  form.tipo = ''
  form.fecha_inicio = ''
  form.fecha_fin = ''
  form.cuenta_id = ''
  form.moneda = ''
  form.observaciones = ''
  
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  
  backendError.value = ''
}

// Computed: verificar si hay errores
const hasErrors = computed(() => {
  return Object.values(errors).some(error => error !== '')
})
</script>

