<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-3"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-slide-in-right"
          :class="getToastClasses(toast.type)"
        >
          <div class="flex items-start p-4">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <component :is="getIcon(toast.type)" class="h-5 w-5" :class="getIconClasses(toast.type)" />
            </div>
            
            <!-- Content -->
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-semibold" :class="getTitleClasses(toast.type)">
                {{ toast.title }}
              </p>
              <p v-if="toast.message" class="mt-1 text-sm" :class="getMessageClasses(toast.type)">
                {{ toast.message }}
              </p>
              
              <!-- Action Button -->
              <div v-if="toast.action" class="mt-3">
                <button
                  @click="handleAction(toast)"
                  class="text-sm font-medium underline"
                  :class="getActionClasses(toast.type)"
                >
                  {{ toast.action.label }}
                </button>
              </div>
            </div>
            
            <!-- Close Button -->
            <button
              @click="removeToast(toast.id)"
              class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar notificación"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Progress Bar -->
          <div v-if="toast.duration && toast.duration > 0" class="h-1 bg-gray-200">
            <div
              class="h-full transition-all ease-linear"
              :class="getProgressBarClasses(toast.type)"
              :style="{ animation: `shrink ${toast.duration}ms linear forwards` }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { useToast, type Toast } from '@/composables/useToast'

const { toasts, removeToast: removeToastFromStore } = useToast()

function removeToast(id: string) {
  removeToastFromStore(id)
}

function handleAction(toast: Toast) {
  if (toast.action) {
    toast.action.onClick()
    removeToast(toast.id)
  }
}

function getIcon(type: Toast['type']) {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
  }
  return icons[type]
}

function getToastClasses(type: Toast['type']): string {
  const classes = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
    warning: 'border-yellow-200 bg-yellow-50',
  }
  return classes[type]
}

function getIconClasses(type: Toast['type']): string {
  const classes = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  }
  return classes[type]
}

function getTitleClasses(type: Toast['type']): string {
  const classes = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800',
  }
  return classes[type]
}

function getMessageClasses(type: Toast['type']): string {
  const classes = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
    warning: 'text-yellow-700',
  }
  return classes[type]
}

function getActionClasses(type: Toast['type']): string {
  const classes = {
    success: 'text-green-700 hover:text-green-800',
    error: 'text-red-700 hover:text-red-800',
    info: 'text-blue-700 hover:text-blue-800',
    warning: 'text-yellow-700 hover:text-yellow-800',
  }
  return classes[type]
}

function getProgressBarClasses(type: Toast['type']): string {
  const classes = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }
  return classes[type]
}
</script>

<style scoped>
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>






