import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref } from 'vue'
import type { TemaVisualConfig, TemaBackend, TemaPresetBackend, DispositivoSimulado } from '../types'
import { ruletaService } from '../services/ruletaApi'
import { configurarTemaVectorial } from '../utils/temaVectorial'

const STORAGE_KEY = 'ruleta_tema'
const MAX_HISTORIAL = 50

export const TEMA_DEFECTO: TemaVisualConfig = {
  paleta_segmentos: ['#1a1a1a', '#e8e0cc', '#1a1a1a', '#e8e0cc', '#1a1a1a', '#e8e0cc', '#1a1a1a', '#e8e0cc'],
  color_texto_segmentos: '#ffffff',
  color_aro_primario: '#C9A84C',
  color_aro_secundario: '#8B6914',
  color_hub_fondo: '#111111',
  color_hub_acento: '#C9A84C',
  color_puntero: '#ffffff',
  color_fondo_inicio: '#0d0d0d',
  color_fondo_fin: '#1a1200',
  color_halo: '#C9A84C',
  color_boton: '#C9A84C',
  hub: {
    escala: 1,
    rotacion_fija: false,
    borde_decorativo: true,
  },
  fondo: {
    tipo: 'gradiente',
    gradiente: {
      tipo: 'lineal',
      angulo: 135,
      paradas: [
        { color: '#0d0d0d', offset: 0 },
        { color: '#1a1200', offset: 100 },
      ],
    },
    overlay_opacidad: 0,
  },
  particulas: { tipo: 'ninguno', intensidad: 'media' },
  tipografia: {
    familia: 'Inter',
    mayusculas: true,
    sombra_color: '#000000',
    sombra_intensidad: 40,
    orientacion: 'arco',
  },
  vip: {
    color_primario: '#F5D061',
    color_secundario: '#B8860B',
    pulso: true,
    icono: 'corona',
  },
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor))
}

function fusionarConDefecto(config: unknown): TemaVisualConfig {
  const valor = config && typeof config === 'object' ? config as Partial<TemaVisualConfig> : {}
  const base = clonar(TEMA_DEFECTO)
  if (!valor.fondo?.gradiente) {
    base.fondo!.gradiente!.paradas = [
      { color: valor.color_fondo_inicio ?? base.color_fondo_inicio, offset: 0 },
      { color: valor.color_fondo_fin ?? base.color_fondo_fin, offset: 100 },
    ]
  }
  return configurarTemaVectorial({
    ...base, ...valor,
    hub: { ...base.hub!, ...valor.hub },
    fondo: { ...base.fondo!, ...valor.fondo, gradiente: { ...base.fondo!.gradiente!, ...valor.fondo?.gradiente } },
    particulas: { ...base.particulas!, ...valor.particulas },
    tipografia: { ...base.tipografia!, ...valor.tipografia },
    vip: { ...base.vip!, ...valor.vip },
  })
}

function cargarTemaActivoLocal(): TemaVisualConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return fusionarConDefecto(JSON.parse(stored))
  } catch {}
  return clonar(TEMA_DEFECTO)
}

function parsearConfiguracion(temaBackend: TemaBackend | null): TemaVisualConfig {
  if (!temaBackend?.configuracionJson) return clonar(TEMA_DEFECTO)
  try {
    return fusionarConDefecto(JSON.parse(temaBackend.configuracionJson))
  } catch (e) {
    throw new Error('El tema recibido contiene una configuración inválida.', { cause: e })
  }
}

export const useTemaStore = defineStore('ruleta-tema', () => {
  // `tema` se mantiene por compatibilidad: es el alias de solo lectura que consumen las pantallas
  // que solo necesitan el tema PUBLICADO (ej. EnroladorView) sin conocer el flujo de borrador.
  const tema = ref<TemaVisualConfig>(cargarTemaActivoLocal())

  const temaActivo = ref<TemaVisualConfig>(clonar(tema.value))
  const temaBorrador = ref<TemaVisualConfig>(clonar(tema.value))
  const temaBackendActivo = ref<TemaBackend | null>(null)
  const campanaIdActual = ref<string | null>(null)

  const historial = ref<string[]>([])
  const historialFuturo = ref<string[]>([])

  const presets = ref<TemaPresetBackend[]>([])
  const modoDispositivo = ref<DispositivoSimulado>('tablet-h')

  const cargando = ref(false)
  const publicando = ref(false)
  const cargandoPresets = ref(false)
  const errorPresets = ref('')
  const errorCarga = ref('')
  let solicitudActual = 0

  const hayCambiosSinPublicar = computed(() =>
    JSON.stringify(temaBorrador.value) !== JSON.stringify(temaActivo.value)
  )
  const puedeDeshacer = computed(() => historial.value.length > 0)
  const puedeRehacer = computed(() => historialFuturo.value.length > 0)

  function aplicarComoActivo(config: TemaVisualConfig, backend: TemaBackend | null, preservarBorrador = false) {
    const conservar = preservarBorrador && hayCambiosSinPublicar.value
    temaActivo.value = clonar(config)
    if (!conservar) {
      temaBorrador.value = clonar(config)
      temaBackendActivo.value = backend
      historial.value = []
      historialFuturo.value = []
    }
    tema.value = clonar(config)
    // El tema global es el único con caché cross-tab en localStorage: el tema de una campaña
    // específica se resuelve siempre contra el backend, no tiene sentido cachearlo bajo esta clave.
    if (!campanaIdActual.value) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch {}
    }
  }

  async function cargarTema(campanaId: string | null = null, enSegundoPlano = false) {
    const solicitud = ++solicitudActual
    if (!enSegundoPlano) cargando.value = true
    campanaIdActual.value = campanaId
    try {
      const backend = campanaId
        ? await ruletaService.getTemaCampana(campanaId)
        : await ruletaService.getTemaGlobal()
      if (solicitud !== solicitudActual) return
      const config = parsearConfiguracion(backend)
      errorCarga.value = ''
      if (!enSegundoPlano || JSON.stringify(config) !== JSON.stringify(temaActivo.value)
          || backend?.rowVersion !== temaBackendActivo.value?.rowVersion) {
        aplicarComoActivo(config, backend, enSegundoPlano)
      }
    } catch (e) {
      if (solicitud !== solicitudActual) return
      errorCarga.value = 'No se pudo actualizar el tema. Se conserva el último diseño disponible.'
      console.error('Error cargando tema:', e)
    } finally {
      if (solicitud === solicitudActual) cargando.value = false
    }
  }

  /** Polling secuencial; pausa en segundo plano y reintenta con backoff tras microcortes. */
  function iniciarSincronizacion(obtenerCampana: () => string | null, intervaloMs = 30000) {
    let detenido = false
    let enCurso = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let fallos = 0
    const intervalo = Math.max(1000, intervaloMs)
    const refrescar = async () => {
      if (detenido || enCurso) return
      if (timer) clearTimeout(timer)
      enCurso = true
      try {
        if (!document.hidden && navigator.onLine !== false) {
          await cargarTema(obtenerCampana(), true)
          fallos = errorCarga.value ? Math.min(fallos + 1, 3) : 0
        }
      } finally {
        enCurso = false
        if (!detenido) timer = setTimeout(refrescar, intervalo * 2 ** fallos)
      }
    }
    const reanudar = () => { void refrescar() }
    document.addEventListener('visibilitychange', reanudar)
    window.addEventListener('online', reanudar)
    void refrescar()
    return () => {
      detenido = true
      ++solicitudActual // ignora respuestas pendientes al abandonar la pantalla
      cargando.value = false
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', reanudar)
      window.removeEventListener('online', reanudar)
    }
  }

  function sincronizarPestanas(event: StorageEvent) {
    if (event.key !== STORAGE_KEY || campanaIdActual.value) return
    // El servidor proporciona también RowVersion; localStorage solo avisa de la publicación.
    void cargarTema(null, true)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', sincronizarPestanas)
    onScopeDispose(() => window.removeEventListener('storage', sincronizarPestanas))
  }

  /** Aplica un cambio al borrador, apilando el estado anterior para poder deshacerlo. */
  function actualizarBorrador(patch: Partial<TemaVisualConfig>) {
    historial.value.push(JSON.stringify(temaBorrador.value))
    if (historial.value.length > MAX_HISTORIAL) historial.value.shift()
    historialFuturo.value = []
    // Los controles de color históricos siguen editando los extremos del degradado.
    if (!patch.fondo && (patch.color_fondo_inicio || patch.color_fondo_fin)) {
      const fondo = temaBorrador.value.fondo!
      const gradiente = fondo.gradiente!
      const paradas = [...gradiente.paradas].sort((a, b) => a.offset - b.offset)
        .map(p => ({ ...p }))
      if (paradas.length >= 2) {
        if (patch.color_fondo_inicio) paradas[0].color = patch.color_fondo_inicio
        if (patch.color_fondo_fin) paradas[paradas.length - 1].color = patch.color_fondo_fin
        patch = { ...patch, fondo: { ...fondo, gradiente: { ...gradiente, paradas } } }
      }
    }
    temaBorrador.value = { ...temaBorrador.value, ...patch }
  }

  function actualizarColorPaleta(indice: number, color: string) {
    const nueva = [...temaBorrador.value.paleta_segmentos]
    nueva[indice] = color
    actualizarBorrador({ paleta_segmentos: nueva })
  }

  function deshacer() {
    const anterior = historial.value.pop()
    if (anterior === undefined) return
    historialFuturo.value.push(JSON.stringify(temaBorrador.value))
    temaBorrador.value = JSON.parse(anterior)
  }

  function rehacer() {
    const siguiente = historialFuturo.value.pop()
    if (siguiente === undefined) return
    historial.value.push(JSON.stringify(temaBorrador.value))
    temaBorrador.value = JSON.parse(siguiente)
  }

  /** Descarta el borrador y vuelve al último tema publicado. */
  function restablecerCambios() {
    temaBorrador.value = clonar(temaActivo.value)
    historial.value = []
    historialFuturo.value = []
  }

  /** Publica el borrador actual: recién aquí el cambio llega a las terminales de tienda. */
  async function publicarTemaEnTiendas() {
    publicando.value = true
    try {
      const rowVersion = temaBackendActivo.value?.rowVersion
      const backend = campanaIdActual.value
        ? await ruletaService.publicarTemaCampana(campanaIdActual.value, temaBorrador.value, rowVersion)
        : await ruletaService.publicarTemaGlobal(temaBorrador.value, rowVersion)
      aplicarComoActivo(parsearConfiguracion(backend), backend)
    } finally {
      publicando.value = false
    }
  }

  async function cargarPresets() {
    cargandoPresets.value = true
    errorPresets.value = ''
    try {
      presets.value = await ruletaService.getPresetsTema()
    } catch (e) {
      console.error('Error cargando plantillas de tema:', e)
      errorPresets.value = 'No se pudieron cargar las plantillas. Intenta nuevamente.'
    } finally {
      cargandoPresets.value = false
    }
  }

  function aplicarPreset(preset: TemaPresetBackend) {
    try {
      actualizarBorrador(fusionarConDefecto(JSON.parse(preset.configuracionJson)))
    } catch (e) {
      console.error('Plantilla con configuración inválida:', e)
    }
  }

  async function guardarNuevoPreset(nombre: string) {
    const nuevo = await ruletaService.guardarPresetTema(nombre, temaBorrador.value)
    presets.value = [...presets.value, nuevo]
    return nuevo
  }

  async function eliminarPreset(id: string) {
    await ruletaService.eliminarPresetTema(id)
    presets.value = presets.value.filter((p) => p.id !== id)
  }

  return {
    tema, temaActivo, temaBorrador, campanaIdActual, presets, modoDispositivo,
    cargando, publicando, cargandoPresets, errorPresets, errorCarga, iniciarSincronizacion, hayCambiosSinPublicar, puedeDeshacer, puedeRehacer,
    cargarTema, actualizarBorrador, actualizarColorPaleta, deshacer, rehacer,
    restablecerCambios, publicarTemaEnTiendas, cargarPresets, aplicarPreset,
    guardarNuevoPreset, eliminarPreset,
  }
})
