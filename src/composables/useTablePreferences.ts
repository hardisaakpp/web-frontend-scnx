import { ref, watch, computed, onMounted } from 'vue'
import { userPreferencesService, type TablePreferences } from '@/services/userPreferencesService'
import { useAuthStore } from '@/stores/auth'

export interface UseTablePreferencesOptions {
  tableId: string
  defaultVisibleColumns: string[]
  defaultColumnOrder: string[]
  enableFilters?: boolean
  enablePageSize?: boolean
}

/**
 * Composable híbrido para gestionar preferencias de tabla
 * Combina localStorage (inmediato) con sincronización al backend (background)
 */
export function useTablePreferences(options: UseTablePreferencesOptions) {
  const { tableId, defaultVisibleColumns, defaultColumnOrder } = options
  
  const STORAGE_KEY = `${tableId}-table-columns`
  const STORAGE_KEY_ORDER = `${tableId}-table-columns-order`
  const STORAGE_KEY_FILTERS = `${tableId}-table-filters`
  const STORAGE_KEY_PAGE_SIZE = `${tableId}-table-page-size`

  const visibleColumns = ref<string[]>([])
  const columnOrder = ref<string[]>([])
  const filters = ref<Record<string, any>>({})
  const pageSize = ref<number>(10)
  
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const isInitializing = ref(true) // Bandera para evitar watchers durante inicialización

  const authStore = useAuthStore()

  // ==================== CARGAR PREFERENCIAS ====================

  /**
   * Cargar preferencias desde localStorage
   */
  function loadFromLocalStorage() {
    try {
      // Cargar columnas visibles
      const savedColumns = localStorage.getItem(STORAGE_KEY)
      if (savedColumns) {
        const parsed = JSON.parse(savedColumns)
        if (Array.isArray(parsed) && parsed.length > 0) {
          visibleColumns.value = parsed
        }
      } else {
        visibleColumns.value = [...defaultVisibleColumns]
      }

      // Cargar orden de columnas
      const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER)
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder)
        if (Array.isArray(parsed) && parsed.length > 0) {
          columnOrder.value = parsed
        }
      } else {
        columnOrder.value = [...defaultColumnOrder]
      }

      // Cargar filtros si están habilitados
      if (options.enableFilters) {
        const savedFilters = localStorage.getItem(STORAGE_KEY_FILTERS)
        if (savedFilters) {
          try {
            filters.value = JSON.parse(savedFilters)
          } catch {
            filters.value = {}
          }
        }
      }

      // Cargar tamaño de página si está habilitado
      if (options.enablePageSize) {
        const savedPageSize = localStorage.getItem(STORAGE_KEY_PAGE_SIZE)
        if (savedPageSize) {
          const parsed = parseInt(savedPageSize, 10)
          if (!isNaN(parsed) && parsed > 0) {
            pageSize.value = parsed
          }
        }
      }
    } catch (error) {
      console.error(`Error cargando preferencias de localStorage para ${tableId}:`, error)
      // Usar valores por defecto en caso de error
      visibleColumns.value = [...defaultVisibleColumns]
      columnOrder.value = [...defaultColumnOrder]
    }
  }

  /**
   * Cargar preferencias desde el servidor
   */
  async function loadFromServer() {
    if (!authStore.isAuthenticated) {
      return false
    }

    isLoading.value = true
    try {
      const serverPrefs = await userPreferencesService.getTablePreferences(tableId)
      
      if (serverPrefs) {
        // Aplicar preferencias del servidor
        // El backend retorna en camelCase (visibleColumns, columnOrder, etc.)
        if (serverPrefs.visibleColumns && serverPrefs.visibleColumns.length > 0) {
          visibleColumns.value = [...serverPrefs.visibleColumns]
        }
        
        if (serverPrefs.columnOrder && serverPrefs.columnOrder.length > 0) {
          columnOrder.value = [...serverPrefs.columnOrder]
        }

        if (options.enableFilters && serverPrefs.filters) {
          filters.value = { ...serverPrefs.filters }
        }

        if (options.enablePageSize && serverPrefs.pageSize) {
          pageSize.value = serverPrefs.pageSize
        }

        // Guardar también en localStorage como backup
        saveToLocalStorage()
        lastSyncTime.value = new Date()
        return true
      }
    } catch (error) {
      console.warn(`No se pudieron cargar preferencias del servidor para ${tableId}:`, error)
    } finally {
      isLoading.value = false
    }

    return false
  }

  /**
   * Cargar preferencias: primero del servidor, luego localStorage como fallback
   */
  async function loadPreferences() {
    isInitializing.value = true
    
    try {
      // Intentar cargar del servidor primero
      const serverLoaded = await loadFromServer()
      
      // Si no se cargaron del servidor, usar localStorage
      if (!serverLoaded) {
        loadFromLocalStorage()
      }
    } finally {
      // Marcar como inicializado después de un pequeño delay para asegurar que los watchers no se activen
      setTimeout(() => {
        isInitializing.value = false
      }, 100)
    }
  }

  // ==================== GUARDAR PREFERENCIAS ====================

  /**
   * Guardar preferencias en localStorage
   */
  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns.value))
      localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(columnOrder.value))
      
      if (options.enableFilters) {
        localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters.value))
      }

      if (options.enablePageSize) {
        localStorage.setItem(STORAGE_KEY_PAGE_SIZE, pageSize.value.toString())
      }
    } catch (error) {
      console.error(`Error guardando preferencias en localStorage para ${tableId}:`, error)
    }
  }

  /**
   * Sincronizar preferencias con el servidor (en background)
   */
  async function syncToServer() {
    if (isSyncing.value || !authStore.isAuthenticated) {
      return
    }

    // Validar que los arrays no estén vacíos antes de sincronizar
    if (!visibleColumns.value || visibleColumns.value.length === 0) {
      console.debug(`[${tableId}] Omitiendo sincronización: visibleColumns está vacío`)
      return
    }

    if (!columnOrder.value || columnOrder.value.length === 0) {
      console.debug(`[${tableId}] Omitiendo sincronización: columnOrder está vacío`)
      return
    }

    isSyncing.value = true
    try {
      const preferences: TablePreferences = {
        visibleColumns: visibleColumns.value,
        columnOrder: columnOrder.value
      }

      if (options.enableFilters) {
        preferences.filters = filters.value
      }

      if (options.enablePageSize) {
        preferences.pageSize = pageSize.value
      }

      await userPreferencesService.saveTablePreferences(tableId, preferences)
      lastSyncTime.value = new Date()
    } catch (error) {
      console.warn(`Error sincronizando preferencias al servidor para ${tableId}:`, error)
      // No lanzar error, las preferencias ya están guardadas en localStorage
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * Guardar preferencias: primero localStorage (inmediato), luego servidor (background)
   */
  async function savePreferences() {
    // No guardar durante la inicialización
    if (isInitializing.value) {
      return
    }

    // Guardar inmediatamente en localStorage
    saveToLocalStorage()

    // Sincronizar con servidor en background (no bloquea)
    syncToServer()
  }

  // ==================== COMPUTED ====================

  /**
   * Columnas visibles ordenadas según el orden guardado
   */
  const orderedVisibleColumns = computed(() => {
    // Filtrar solo columnas visibles y disponibles
    const validOrder = columnOrder.value.filter(key => 
      visibleColumns.value.includes(key)
    )
    
    // Agregar columnas visibles que no están en el orden (nuevas columnas)
    const missingColumns = visibleColumns.value.filter(key => !validOrder.includes(key))
    
    return [...validOrder, ...missingColumns]
  })

  // ==================== FUNCIONES DE UTILIDAD ====================

  /**
   * Resetear preferencias a los valores por defecto
   */
  function resetPreferences() {
    visibleColumns.value = [...defaultVisibleColumns]
    columnOrder.value = [...defaultColumnOrder]
    filters.value = {}
    pageSize.value = 10
    savePreferences()
  }

  /**
   * Seleccionar todas las columnas disponibles
   */
  function selectAllColumns(availableColumns: string[]) {
    visibleColumns.value = [...availableColumns]
    columnOrder.value = [...availableColumns]
    savePreferences()
  }

  /**
   * Sincronizar manualmente con el servidor
   */
  async function forceSync() {
    await syncToServer()
  }

  // ==================== WATCHERS ====================

  // Guardar automáticamente cuando cambian las preferencias
  watch(visibleColumns, () => {
    savePreferences()
  }, { deep: true })

  watch(columnOrder, () => {
    savePreferences()
  }, { deep: true })

  if (options.enableFilters) {
    watch(filters, () => {
      savePreferences()
    }, { deep: true })
  }

  if (options.enablePageSize) {
    watch(pageSize, () => {
      savePreferences()
    })
  }

  // ==================== INICIALIZACIÓN ====================

  // Cargar preferencias al montar el componente
  onMounted(() => {
    loadPreferences()
  })

  // Sincronizar cuando el usuario se autentica
  watch(() => authStore.isAuthenticated, (isAuthenticated) => {
    if (isAuthenticated) {
      // Cargar preferencias del servidor cuando el usuario se autentica
      loadPreferences()
    }
  })

  return {
    // Estado
    visibleColumns,
    columnOrder,
    filters,
    pageSize,
    isLoading,
    isSyncing,
    lastSyncTime,
    
    // Computed
    orderedVisibleColumns,
    
    // Funciones
    loadPreferences,
    savePreferences,
    resetPreferences,
    selectAllColumns,
    forceSync,
    syncToServer
  }
}

