import axios from 'axios'
import { defineStore } from 'pinia'
import { articuloService } from '../services/articuloService'
import type { Articulo, ArticuloFilters, ArticuloPagination } from '../types'

const SEARCH_DEBOUNCE_MS = 350

interface ArticuloState {
    articulos: Articulo[]
    selectedArticulo: Articulo | null
    pagination: ArticuloPagination
    loading: boolean
    error: string | null
    filters: ArticuloFilters
}

// Fuera del store: un AbortController no debe volverse reactivo (Vue lo
// envolvería en un Proxy y rompería su identidad), y un solo timer de
// debounce compartido es suficiente porque solo existe una instancia de este
// store en toda la app.
let peticionEnVuelo: AbortController | null = null
let debounceBusqueda: ReturnType<typeof setTimeout> | null = null

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
        // Cancela cualquier listado en vuelo antes de disparar uno nuevo:
        // evita que una respuesta vieja y lenta sobrescriba la tabla con
        // resultados que ya no corresponden a la búsqueda/página actual.
        async fetchArticulos() {
            peticionEnVuelo?.abort()
            const controller = new AbortController()
            peticionEnVuelo = controller

            this.loading = true
            this.error = null
            try {
                const response = await articuloService.getArticulos(this.filters, controller.signal)
                if (controller.signal.aborted) return
                this.articulos = response.data
                this.pagination = response.pagination
            } catch (err: any) {
                if (axios.isCancel(err) || controller.signal.aborted) return
                this.error = err.response?.data?.detail || 'Error al cargar artículos'
            } finally {
                if (!controller.signal.aborted) this.loading = false
            }
        },

        async fetchArticuloById(itemCode: string) {
            this.loading = true
            try {
                this.selectedArticulo = await articuloService.getArticuloByCode(itemCode)
            } catch (err: any) {
                this.error = err.response?.data?.detail || 'Error al cargar el detalle del artículo'
            } finally {
                this.loading = false
            }
        },

        // Debounce de 350ms: el valor del filtro se refleja de inmediato
        // (el input no se siente bloqueado) pero la petición al backend solo
        // se dispara cuando el usuario deja de escribir.
        setSearchFilter(search: string) {
            this.filters.search = search
            this.filters.page = 1
            if (debounceBusqueda) clearTimeout(debounceBusqueda)
            debounceBusqueda = setTimeout(() => {
                void this.fetchArticulos()
            }, SEARCH_DEBOUNCE_MS)
        },

        setPage(page: number) {
            this.filters.page = page
            this.fetchArticulos()
        },

        async descargarReporteDiario(fecha?: string) {
            try {
                await articuloService.descargarReporteDiario(fecha)
                return true
            } catch (err: any) {
                throw err.response?.data?.detail || 'Error al descargar el reporte diario'
            }
        }
    }
})
