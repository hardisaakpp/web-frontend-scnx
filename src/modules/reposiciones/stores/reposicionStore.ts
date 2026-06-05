import { defineStore } from 'pinia'
import reposicionApi from '../services/reposicionApi'
import type { 
  CatalogoItem, 
  CatalogoFilters, 
  ListasFiltros, 
  CarritoItem,
  CarritoResponse,
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
    carrito: [] as CarritoItem[],
    carritoInfo: {
      fromWhs: '',
      toWhs: '',
      fecha: ''
    } as Omit<CarritoResponse, 'items'>,
    isOpen: true,
    error: null as string | null
  }),

  getters: {
    totalSolicitado: (state) => {
      return state.carrito.reduce((acc: number, item: CarritoItem) => acc + item.quantity, 0)
    },
    cantidadPorCodigo: (state) => (itemCode: string) => {
      const item = state.carrito.find((i: CarritoItem) => i.itemCode === itemCode)
      return item ? item.quantity : 0
    },
    comentarioPorCodigo: (state) => (itemCode: string) => {
      const item = state.carrito.find((i: CarritoItem) => i.itemCode === itemCode)
      return item ? item.comment ?? '' : ''
    }
  },

  actions: {
    async fetchAlmacenes() {
      try {
        const authStore = useAuthStore()
        const accesses: any = authStore.userWarehouseAccesses
        const newAlmacenes: Almacen[] = []
        
        // Extraemos los almacenes directamente de los grupos del usuario
        // Ignoramos el endpoint externo /api/Catalogo/almacenes
        const processGroups = (groups: any[]) => {
          groups?.forEach(g => {
            if (Array.isArray(g.almacenes)) {
              g.almacenes.forEach((code: string) => {
                if (!newAlmacenes.some(a => a.whsCode === code)) {
                  newAlmacenes.push({
                    whsCode: code,
                    whsName: code // Usamos el código como nombre
                  })
                }
              })
            }
          })
        }

        if (accesses) {
          if (accesses.warehouseGroups) {
            processGroups(accesses.warehouseGroups)
          } else if (Array.isArray(accesses)) {
            accesses.forEach((a: any) => {
              if (a.warehouseGroups) processGroups(a.warehouseGroups)
              else if (a.almacenes) processGroups([a]) // Si el objeto mismo es el grupo
            })
          }
        }

        this.almacenes = newAlmacenes

        if (this.almacenes.length > 0 && !this.filters.whsCode) {
          this.filters.whsCode = this.almacenes[0].whsCode
        }
      } catch (err) {
        console.error('Error al procesar almacenes de sesión:', err)
        this.error = 'Error al cargar almacenes permitidos'
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
      this.catalogo = []
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
      if (!this.filters.whsCode) return
      
      try {
        const response: any = await reposicionApi.getCarrito(this.filters.whsCode)
        if (response && response.items) {
          this.carrito = response.items
          this.carritoInfo = {
            fromWhs: response.fromWhs || '',
            toWhs: response.toWhs || '',
            fecha: response.fecha || ''
          }
        } else if (Array.isArray(response)) {
          this.carrito = response
          this.carritoInfo = { fromWhs: '', toWhs: '', fecha: '' }
        } else {
          this.carrito = []
        }
      } catch (err) {
        console.error('Error al cargar carrito', err)
      }
    },

    async updateItemQuantity(itemCode: string, quantity: number) {
      const authStore = useAuthStore()
      if (!this.filters.whsCode || !authStore.userData?.id) return
      
      // Optimistic update
      const index = this.carrito.findIndex((i: CarritoItem) => i.itemCode === itemCode)
      if (index !== -1) {
        if (quantity === 0) {
          this.carrito.splice(index, 1)
        } else {
          this.carrito[index].quantity = quantity
        }
      } else if (quantity > 0) {
        const catalogItem = this.catalogo.find(i => i.itemCode === itemCode)
        if (catalogItem) {
          this.carrito.push({ ...catalogItem, quantity, comment: '' })
        } else {
          await this.fetchCarrito()
        }
      }

      // DETERMINAR ORIGEN (Bodega Central) Y DESTINO (Tienda)
      const accesses: any = authStore.userWarehouseAccesses
      const toWhs = this.filters.whsCode
      let fromWhs = 'OUT-CD'

      const findCentralInGroups = (groups: any[]) => {
        const group = groups?.find(g => g.almacenes?.includes(toWhs))
        return group?.bodegaCentral
      }

      if (accesses) {
        if (accesses.warehouseGroups) {
          const central = findCentralInGroups(accesses.warehouseGroups)
          if (central) fromWhs = central
        } else if (Array.isArray(accesses)) {
          accesses.forEach((a: any) => {
            if (a.warehouseGroups) {
              const central = findCentralInGroups(a.warehouseGroups)
              if (central) fromWhs = central
            } else if (a.almacenes?.includes(toWhs)) {
              if (a.bodegaCentral) fromWhs = a.bodegaCentral
            }
          })
        }
      }

      try {
        await reposicionApi.saveItem({
          toWhs,
          fromWhs,
          itemCode,
          quantity
        })
      } catch (err) {
        await this.fetchCarrito()
        throw err
      }
    },

    async updateItemComment(itemCode: string, comment: string) {
      const authStore = useAuthStore()
      if (!this.filters.whsCode || !authStore.userData?.id) return

      const index = this.carrito.findIndex((i: CarritoItem) => i.itemCode === itemCode)
      if (index !== -1) {
        this.carrito[index].comment = comment
      }

      try {
        await reposicionApi.saveComment({
          toWhs: this.filters.whsCode,
          itemCode,
          comment
        })
      } catch (err) {
        console.error('Error al guardar comentario', err)
      }
    },

    setWhsCode(whsCode: string) {
      if (this.filters.whsCode === whsCode) return
      this.filters.whsCode = whsCode
      this.fetchDataByWarehouse()
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
