import { defineStore } from 'pinia'
import {
    articuloService,
    type ImportacionError,
    type ImportacionTrabajo,
    type TipoCargaMasiva
} from '../services/articuloService'

const STORAGE_KEY = 'articulo-maestro:importacion-activa'
const POLL_INTERVAL_MS = 2500
const TERMINAL_STATES = new Set([
    'COMPLETADO',
    'COMPLETADO_CON_ERRORES',
    'ERROR'
])

interface ImportacionState {
    jobId: number | null
    trabajo: ImportacionTrabajo | null
    errores: ImportacionError[]
    loading: boolean
    downloading: boolean
    error: string | null
    pollTimer: ReturnType<typeof setInterval> | null
}

function readPersistedJobId(): number | null {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function getErrorMessage(error: unknown): string {
    const apiError = error as {
        response?: {
            data?: {
                detail?: string | { mensaje?: string }
            }
        }
    }
    const detail = apiError.response?.data?.detail
    if (typeof detail === 'string') return detail
    return detail?.mensaje || 'No fue posible consultar la importación.'
}

export const useImportacionArticulosStore = defineStore(
    'importacionArticulos',
    {
        state: (): ImportacionState => ({
            jobId: readPersistedJobId(),
            trabajo: null,
            errores: [],
            loading: false,
            downloading: false,
            error: null,
            pollTimer: null
        }),

        getters: {
            isTerminal: (state): boolean =>
                !!state.trabajo && TERMINAL_STATES.has(state.trabajo.estado),
            isActive(): boolean {
                return this.jobId !== null && !this.isTerminal
            },
            progress: (state): number => {
                if (!state.trabajo?.totalGrupos) return 0
                return Math.min(
                    100,
                    Math.round(
                        (state.trabajo.gruposProcesados /
                            state.trabajo.totalGrupos) *
                            100
                    )
                )
            },
            gruposCorrectos: (state): number =>
                state.trabajo?.grupos.filter(
                    grupo => grupo.estado === 'COMPLETADO'
                ).length ?? 0,
            gruposError: (state): number =>
                state.trabajo?.grupos.filter(
                    grupo => grupo.estado === 'ERROR'
                ).length ?? 0,
            gruposPendientes: (state): number =>
                state.trabajo?.grupos.filter(grupo =>
                    ['PENDIENTE', 'PROCESANDO'].includes(grupo.estado)
                ).length ?? 0,
            imagenesPendientes: (state): number =>
                state.trabajo?.grupos
                    .flatMap(grupo => grupo.imagenes)
                    .filter(imagen =>
                        ['PENDIENTE', 'PROCESANDO'].includes(
                            imagen.estado ?? ''
                        )
                    ).length ?? 0
        },

        actions: {
            async iniciar(file: File, tipo: TipoCargaMasiva): Promise<void> {
                this.detenerPolling()
                this.loading = true
                this.error = null
                this.errores = []
                try {
                    const aceptada = await articuloService.crearImportacion(
                        file,
                        tipo
                    )
                    this.jobId = aceptada.jobId
                    globalThis.localStorage?.setItem(
                        STORAGE_KEY,
                        String(aceptada.jobId)
                    )
                    await this.actualizar()
                    this.iniciarPolling()
                } catch (error: unknown) {
                    this.error = getErrorMessage(error)
                    throw error
                } finally {
                    this.loading = false
                }
            },

            async restaurar(): Promise<void> {
                if (!this.jobId) return
                await this.actualizar()
                if (!this.isTerminal) this.iniciarPolling()
            },

            async actualizar(): Promise<void> {
                if (!this.jobId) return
                try {
                    this.trabajo = await articuloService.getImportacion(
                        this.jobId
                    )
                    this.error = null
                    if (this.isTerminal) {
                        this.detenerPolling()
                        this.errores =
                            await articuloService.getErroresImportacion(
                                this.jobId
                            )
                    }
                } catch (error: unknown) {
                    this.error = getErrorMessage(error)
                    this.detenerPolling()
                }
            },

            iniciarPolling(): void {
                if (this.pollTimer || !this.jobId || this.isTerminal) return
                this.pollTimer = globalThis.setInterval(() => {
                    void this.actualizar()
                }, POLL_INTERVAL_MS)
            },

            detenerPolling(): void {
                if (!this.pollTimer) return
                globalThis.clearInterval(this.pollTimer)
                this.pollTimer = null
            },

            async reintentar(): Promise<void> {
                if (!this.jobId) return
                this.loading = true
                this.error = null
                try {
                    await articuloService.reintentarImportacion(this.jobId)
                    this.errores = []
                    await this.actualizar()
                    this.iniciarPolling()
                } catch (error: unknown) {
                    this.error = getErrorMessage(error)
                } finally {
                    this.loading = false
                }
            },

            async descargarErrores(): Promise<void> {
                if (!this.jobId) return
                this.downloading = true
                try {
                    await articuloService.descargarErroresImportacion(
                        this.jobId
                    )
                } finally {
                    this.downloading = false
                }
            },

            async descargarErroresPlantilla(): Promise<void> {
                if (!this.jobId) return
                this.downloading = true
                try {
                    await articuloService.descargarErroresPlantillaImportacion(
                        this.jobId
                    )
                } finally {
                    this.downloading = false
                }
            },

            limpiar(): void {
                this.detenerPolling()
                this.jobId = null
                this.trabajo = null
                this.errores = []
                this.error = null
                globalThis.localStorage?.removeItem(STORAGE_KEY)
            }
        }
    }
)
