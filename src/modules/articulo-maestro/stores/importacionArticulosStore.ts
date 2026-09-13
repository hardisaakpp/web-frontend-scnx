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
// Backoff exponencial: si el servidor está lento/caído, espaciar los
// siguientes intentos en vez de insistir cada 2.5s contra algo que ya
// está fallando.
const MAX_POLL_INTERVAL_MS = 10_000
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
    pollTimer: ReturnType<typeof setTimeout> | null
    pollDelayMs: number
    pollAbortController: AbortController | null
    consultaEnCurso: number | null
    verificando: boolean
    verificacionId: number
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
            pollDelayMs: POLL_INTERVAL_MS,
            pollAbortController: null,
            consultaEnCurso: null,
            verificando: false,
            verificacionId: 0,
            resumenSimulacion: null,
            errorSimulacion: null,
            reintentandoGrupoId: null
        }),

        getters: {
            tipoOperacion: (state): TipoCargaMasiva | null =>
                state.trabajo ? state.trabajo.tipo.toLowerCase() as TipoCargaMasiva : null,
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
                const verificacionId = ++this.verificacionId
                this.verificando = true
                this.errorSimulacion = null
                try {
                    const resumen = await articuloService.verificarImportacion(
                        file,
                        tipo,
                        zipImagenes
                    )
                    if (verificacionId === this.verificacionId) this.resumenSimulacion = resumen
                } catch (error: unknown) {
                    if (verificacionId !== this.verificacionId) return
                    this.resumenSimulacion = null
                    this.errorSimulacion = getErrorMessage(error)
                    throw error
                } finally {
                    if (verificacionId === this.verificacionId) this.verificando = false
                }
            },

            resetVerificacion(): void {
                this.verificacionId++
                this.verificando = false
                this.resumenSimulacion = null
                this.errorSimulacion = null
            },

            async iniciar(
                file: File,
                tipo: TipoCargaMasiva,
                zipImagenes?: File | null
            ): Promise<void> {
                if (this.loading || this.isActive) return
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
                    this.trabajo = null
                    globalThis.localStorage?.setItem(
                        STORAGE_KEY,
                        String(aceptada.jobId)
                    )
                    this.iniciarPolling()
                    // El 202 confirma la recepción; consultar el progreso
                    // no debe mantener bloqueado el envío del archivo.
                    void this.actualizar()
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

            async actualizar(signal?: AbortSignal): Promise<void> {
                const jobId = this.jobId
                if (!jobId || this.consultaEnCurso === jobId) return
                this.consultaEnCurso = jobId
                try {
                    const trabajo = await articuloService.getImportacion(jobId, signal)
                    if (this.jobId !== jobId) return
                    this.trabajo = trabajo
                    this.error = null
                    // Éxito: volver al intervalo base -- el backoff solo debe
                    // durar mientras el servidor siga respondiendo mal.
                    this.pollDelayMs = POLL_INTERVAL_MS
                    if (this.isTerminal) {
                        const errores = await articuloService.getErroresImportacion(jobId)
                        if (this.jobId !== jobId) return
                        this.errores = errores
                        this.detenerPolling()
                    }
                } catch (error: unknown) {
                    // Un abort deliberado (nuevo ciclo de polling, o
                    // detenerPolling) no es un error de red real -- no debe
                    // pisar `this.error` ni escalar el backoff.
                    if (signal?.aborted) return
                    if (this.jobId !== jobId) return
                    this.error = getErrorMessage(error)
                    this.pollDelayMs = Math.min(
                        this.pollDelayMs * 2,
                        MAX_POLL_INTERVAL_MS
                    )
                } finally {
                    if (this.consultaEnCurso === jobId) this.consultaEnCurso = null
                }
            },

            // Bucle de polling con `setTimeout` recursivo (en vez de
            // `setInterval` de intervalo fijo): permite backoff exponencial
            // ante fallas y garantiza que nunca se agende el siguiente tick
            // mientras el anterior sigue en vuelo. Cada ciclo tiene su propio
            // AbortController para poder cancelar la petición HTTP en curso
            // (no solo ignorar su resultado) al desmontar o reiniciar.
            programarSiguientePoll(): void {
                this.pollTimer = globalThis.setTimeout(() => {
                    this.pollAbortController?.abort()
                    const controller = new AbortController()
                    this.pollAbortController = controller
                    void this.actualizar(controller.signal).finally(() => {
                        // Si `detenerPolling()` corrió durante el await
                        // (desmontaje, nuevo jobId), `pollTimer` ya es null:
                        // no reprogramar un ciclo que nadie pidió.
                        if (this.pollTimer !== null && !this.isTerminal) {
                            this.programarSiguientePoll()
                        }
                    })
                }, this.pollDelayMs)
            },

            iniciarPolling(): void {
                if (this.pollTimer || !this.jobId || this.isTerminal) return
                this.programarSiguientePoll()
            },

            detenerPolling(): void {
                if (this.pollTimer) {
                    globalThis.clearTimeout(this.pollTimer)
                    this.pollTimer = null
                }
                this.pollAbortController?.abort()
                this.pollAbortController = null
                this.pollDelayMs = POLL_INTERVAL_MS
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

            async descargarReporteExitos(): Promise<void> {
                if (!this.trabajo || !this.tipoOperacion || this.downloading) return
                this.downloading = true
                try {
                    await articuloService.descargarReporteExitos(
                        this.trabajo.id,
                        this.tipoOperacion
                    )
                } catch {
                    useToast().error(
                        'No se pudo descargar el reporte',
                        'Inténtelo nuevamente. La importación conserva su resultado.'
                    )
                } finally {
                    this.downloading = false
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
