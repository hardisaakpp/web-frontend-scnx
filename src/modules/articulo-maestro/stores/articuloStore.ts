import { defineStore } from 'pinia'
import { articuloService } from '../services/articuloService'
import type { Articulo, ArticuloFilters, ArticuloPagination } from '../types'

interface ArticuloState {
    articulos: Articulo[]
    selectedArticulo: Articulo | null
    pagination: ArticuloPagination
    loading: boolean
    error: string | null
    filters: ArticuloFilters
}

export const useArticuloStore = defineStore('articuloMaestro', {
    state: (): ArticuloState => ({
        articulos: [],
        selectedArticulo: null,
        pagination: {
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 0
        },
        loading: false,
        error: null,
        filters: {
            search: '',
            estado: undefined,
            page: 1,
            pageSize: 10
        }
    }),

    actions: {
        async fetchArticulos() {
            this.loading = true
            this.error = null
            try {
                const response = await articuloService.getArticulos(this.filters)
                this.articulos = response.data
                this.pagination = response.pagination
            } catch (err: any) {
                this.error = err.response?.data?.detail || 'Error al cargar artículos'
            } finally {
                this.loading = false
            }
        },

        async fetchArticuloById(id: number) {
            this.loading = true
            try {
                this.selectedArticulo = await articuloService.getArticuloById(id)
            } catch (err: any) {
                this.error = err.response?.data?.detail || 'Error al cargar el detalle del artículo'
            } finally {
                this.loading = false
            }
        },

        setSearchFilter(search: string) {
            this.filters.search = search
            this.filters.page = 1
            this.fetchArticulos()
        },

        setPage(page: number) {
            this.filters.page = page
            this.fetchArticulos()
        },

        async syncToSap(id: number) {
            try {
                await articuloService.sincronizarConSap(id)
                await this.fetchArticulos() // Refrescar lista
                return true
            } catch (err: any) {
                throw err.response?.data?.detail || 'Error en la sincronización'
            }
        }
    }
})
