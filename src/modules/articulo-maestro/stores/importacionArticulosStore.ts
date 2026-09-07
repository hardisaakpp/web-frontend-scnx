import { defineStore } from 'pinia'
import {
    articuloService,
    type DryRunSummary,
    type ImportacionError,
    type ImportacionTrabajo,
    type TipoCargaMasiva
} from '../services/articuloService'
import { useToast } from '@/composables/useToast'

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
    verificando: boolean
    resumenSimulacion: DryRunSummary | null
    errorSimulacion: string | null
    // H13: id del grupo con un reintento selectivo en vuelo -- distingue
    // ese botón puntual de `loading` (que es del reintento del trabajo
    // COMPLETO), para no deshabilitar toda la UI por un solo grupo.
    reintentandoGrupoId: number | null
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
            pollTimer: null,
            verificando: false,
            resumenSimulacion: null,
            errorSimulacion: null,
            reintentandoGrupoId: null
        }),

        getters: {
            isTerminal: (state): boolean =>
                !!state.trabajo && TERMINAL_STATES.has(state.trabajo.estado),
            isActive(): boolean {
                return this.jobId !== null && !this.isTerminal
            },
            // Estado del semáforo de pre-vuelo. Derivado, no un campo aparte,
            // para que nunca pueda desincronizarse de `verificando`/`resumenSimulacion`.
            estadoSimulacion(): 'IDLE' | 'SIMULANDO' | 'VALIDO' | 'CON_ERRORES' {
                if (this.verificando) return 'SIMULANDO'
                if (!this.resumenSimulacion) return 'IDLE'
                return this.resumenSimulacion.esLoteValido ? 'VALIDO' : 'CON_ERRORES'
            },
            archivoVerificado(): boolean {
                return this.resumenSimulacion?.esLoteValido ?? false
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
            // La subida a MinIO es síncrona (sin estados intermedios): una
            // imagen que falla (p.ej. no encontrada dentro del ZIP) queda
            // registrada directamente en ERROR, nunca en PENDIENTE/PROCESANDO.
            imagenesConError: (state): number =>
                state.trabajo?.grupos
                    .flatMap(grupo => grupo.imagenes)
                    .filter(imagen => imagen.estado === 'ERROR').length ?? 0,
            // H12: CAMPO_ESTRUCTURAL_CON_MOVIMIENTOS no es un fallo del
            // sistema -- es una regla de negocio esperable (el artículo ya
            // tiene stock/movimientos en SAP y esa columna puntual no puede
            // tocarse por Excel). Se discrimina del resto de errores
            // (validación de catálogo, SAP no disponible, etc.) para que la
            // UI pueda tratarlos como una observación informativa en vez de
            // un error destructivo.
            erroresEstructurales: (state): ImportacionError[] =>
                state.errores.filter(
                    error => error.codigoError === 'CAMPO_ESTRUCTURAL_CON_MOVIMIENTOS'
                ),
            erroresNoEstructurales: (state): ImportacionError[] =>
                state.errores.filter(
                    error => error.codigoError !== 'CAMPO_ESTRUCTURAL_CON_MOVIMIENTOS'
                ),
            // true cuando el trabajo terminó con observaciones, pero TODAS
            // son restricciones de SAP esperables -- ninguna es un error de
            // validación/sistema real. GestionArticulos.vue la usa para
            // decidir Warning Toast (bloqueos esperables) vs Error Toast
            // (algo realmente falló).
            soloBloqueosEstructurales(): boolean {
                return (
                    this.errores.length > 0 &&
                    this.erroresNoEstructurales.length === 0
                )
            },
            // H13: grupos observados (ERROR) -- la UI los lista
            // individualmente con su avance de fotos y un botón de
            // reintento puntual, en vez de solo el resumen agregado.
            gruposObservados: (state): ImportacionTrabajo['grupos'] =>
                state.trabajo?.grupos.filter(
                    grupo => grupo.estado === 'ERROR'
                ) ?? []
        },

        actions: {
            async verificar(
                file: File,
                tipo: TipoCargaMasiva,
                zipImagenes?: File | null
            ): Promise<void> {
                this.verificando = true
                this.errorSimulacion = null
                try {
                    this.resumenSimulacion = await articuloService.verificarImportacion(
                        file,
                        tipo,
                        zipImagenes
                    )
                } catch (error: unknown) {
                    this.resumenSimulacion = null
                    this.errorSimulacion = getErrorMessage(error)
                    throw error
                } finally {
                    this.verificando = false
                }
            },

            resetVerificacion(): void {
                this.resumenSimulacion = null
                this.errorSimulacion = null
            },

            async iniciar(
                file: File,
                tipo: TipoCargaMasiva,
                zipImagenes?: File | null
            ): Promise<void> {
                this.detenerPolling()
                this.loading = true
                this.error = null
                this.errores = []
                try {
                    const aceptada = await articuloService.crearImportacion(
                        file,
                        tipo,
                        zipImagenes
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

            // H13: reintento SELECTIVO de un único grupo observado (ej. una
            // fila cuya Foto 3 falló por un corte de red), sin reabrir el
            // trabajo completo. `reintentandoGrupoId` habilita el estado de
            // carga del botón puntual y previene doble pulsación.
            async reintentarGrupo(grupoId: number): Promise<void> {
                const grupo = this.trabajo?.grupos.find(g => g.id === grupoId)
                if (!grupo || this.reintentandoGrupoId !== null) return

                const estadoPrevio = grupo.estado
                // Optimista: refleja de inmediato que el reintento está en
                // curso, antes de esperar la respuesta del servidor.
                grupo.estado = 'PROCESANDO'
                this.reintentandoGrupoId = grupoId
                try {
                    await articuloService.reintentarGrupoImportacion(grupoId)
                    await this.actualizar()
                    this.iniciarPolling()
                } catch (error: unknown) {
                    grupo.estado = estadoPrevio
                    useToast().error(
                        'No se pudo iniciar el reintento del grupo',
                        'Verifique la conexión e inténtelo de nuevo.'
                    )
                } finally {
                    this.reintentandoGrupoId = null
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
                this.resumenSimulacion = null
                this.errorSimulacion = null
                globalThis.localStorage?.removeItem(STORAGE_KEY)
            }
        }
    }
)
