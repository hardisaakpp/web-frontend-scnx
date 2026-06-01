import { defineStore } from 'pinia'
import reposicionApi from '../services/reposicionApi'
import type { 
  CatalogoItem, 
  CatalogoFilters, 
  ListasFiltros, 
  SolicitudDetalle,
  Almacen
} from '../types'
import { useAuthStore } from '@/stores/auth'

export const useReposicionStore = defineStore('reposicion', {
  state: () => ({
    catalogo: [] as CatalogoItem[],
    totalItems: 0,
    currentPage: 1,
    pageSize: 25,
    loading: false,
    filters: {
      whsCode: '',
      pageNumber: 1,
      pageSize: 25,
      descripcion: '',
      itemCode: '',
      codeBars: '',
      marca: '',
      unidad: '',
      categoria: '',
      linea: ''
    } as CatalogoFilters,
    listasFiltros: {
      marcas: [],
      categorias: [],
      lineas: [],
      unidades: []
    } as ListasFiltros,
    almacenes: [] as Almacen[],
    carrito: [] as SolicitudDetalle[],
    isOpen: true,
    error: null as string | null
  }),

  getters: {
    totalSolicitado: (state) => {
      return state.carrito.reduce((acc, item) => acc + item.quantity, 0)
    },
    cantidadPorCodigo: (state) => (itemCode: string) => {
      const item = state.carrito.find(i => i.itemCode === itemCode)
      return item ? item.quantity : 0
    },
    comentarioPorCodigo: (state) => (itemCode: string) => {
      const item = state.carrito.find(i => i.itemCode === itemCode)
      return item ? item.comment : ''
    }
  },

  actions: {
    async fetchAlmacenes() {
      try {
        this.almacenes = await reposicionApi.getAlmacenes()
        if (this.almacenes.length > 0 && !this.filters.whsCode) {
          // Intentar asignar el almacén del usuario si tiene acceso
          const authStore = useAuthStore()
          const userWhs = authStore.userWarehouseAccesses?.[0]?.codAlmacen
          
          if (userWhs && this.almacenes.some(a => a.whsCode === userWhs)) {
            this.filters.whsCode = userWhs
          } else {
            this.filters.whsCode = this.almacenes[0].whsCode
          }
        }
      } catch (err) {
        this.error = 'Error al cargar almacenes'
      }
    },

    async fetchFiltros() {
      if (!this.filters.whsCode) return
      try {
        this.listasFiltros = await reposicionApi.getFiltros(this.filters.whsCode)
      } catch (err) {
        console.error('Error al cargar filtros', err)
      }
    },

    async fetchCatalogo(resetPage = false) {
      if (!this.filters.whsCode) return
      this.loading = true
      if (resetPage) this.filters.pageNumber = 1
      
      try {
        const result = await reposicionApi.getCatalogo(this.filters)
        this.catalogo = result.items
        this.totalItems = result.totalItems
        this.currentPage = result.pageNumber
      } catch (err) {
        this.error = 'Error al cargar catálogo'
      } finally {
        this.loading = false
      }
    },

    async fetchCarrito() {
      const authStore = useAuthStore()
      if (!this.filters.whsCode || !authStore.userData?.id) return
      
      try {
        this.carrito = await reposicionApi.getCarrito(this.filters.whsCode, parseInt(authStore.userData.id))
      } catch (err) {
        console.error('Error al cargar carrito', err)
      }
    },

    async updateItemQuantity(itemCode: string, quantity: number) {
      const authStore = useAuthStore()
      if (!this.filters.whsCode || !authStore.userData?.id) return
      
      // Optimistic update
      const index = this.carrito.findIndex(i => i.itemCode === itemCode)
      const oldQuantity = index !== -1 ? this.carrito[index].quantity : 0
      
      if (index !== -1) {
        if (quantity === 0) {
          this.carrito.splice(index, 1)
        } else {
          this.carrito[index].quantity = quantity
        }
      } else if (quantity > 0) {
        this.carrito.push({ itemCode, quantity, comment: '' })
      }

      try {
        await reposicionApi.saveItem({
          toWhs: this.filters.whsCode,
          fromWhs: 'CD01', // Asumimos CD01 como centro de distribución por defecto o lo sacamos del almacén
          idUser: parseInt(authStore.userData.id),
          itemCode,
          quantity
        })
      } catch (err) {
        // Rollback on error
        this.fetchCarrito()
        throw err
      }
    },

    async updateItemComment(itemCode: string, comment: string) {
      const authStore = useAuthStore()
      if (!this.filters.whsCode || !authStore.userData?.id) return

      const index = this.carrito.findIndex(i => i.itemCode === itemCode)
      if (index !== -1) {
        this.carrito[index].comment = comment
      }

      try {
        await reposicionApi.saveComment({
          toWhs: this.filters.whsCode,
          idUser: parseInt(authStore.userData.id),
          itemCode,
          comment
        })
      } catch (err) {
        console.error('Error al guardar comentario', err)
      }
    },

    setWhsCode(whsCode: string) {
      this.filters.whsCode = whsCode
      this.fetchFiltros()
      this.fetchCatalogo(true)
      this.fetchCarrito()
    },

    setPage(page: number) {
      this.filters.pageNumber = page
      this.fetchCatalogo()
    },

    setFilters(newFilters: Partial<CatalogoFilters>) {
      this.filters = { ...this.filters, ...newFilters, pageNumber: 1 }
      this.fetchCatalogo()
    },

    async initialize() {
      await this.fetchAlmacenes()
      if (this.filters.whsCode) {
        await this.fetchDataByWarehouse()
      }
    },

    async fetchDataByWarehouse() {
      if (!this.filters.whsCode) return
      this.loading = true
      try {
        await Promise.all([
          this.fetchFiltros(),
          this.fetchCatalogo(true),
          this.fetchCarrito(),
          this.checkStatus()
        ])
      } finally {
        this.loading = false
      }
    },

    async checkStatus() {
      try {
        const { isOpen } = await reposicionApi.getStatus()
        this.isOpen = isOpen
      } catch (err) {
        console.error('Error al verificar estado', err)
      }
    }
  }
})
