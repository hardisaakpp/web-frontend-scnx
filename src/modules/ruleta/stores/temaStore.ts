import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TemaRuleta } from '../types'

const STORAGE_KEY = 'ruleta_tema'

export const TEMA_DEFECTO: TemaRuleta = {
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
}

function cargarTema(): TemaRuleta {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...TEMA_DEFECTO, ...JSON.parse(stored) }
  } catch {}
  return { ...TEMA_DEFECTO }
}

export const useTemaStore = defineStore('ruleta-tema', () => {
  const tema = ref<TemaRuleta>(cargarTema())

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        tema.value = cargarTema()
      }
    })
  }

  function actualizarTema(parcial: Partial<TemaRuleta>) {
    tema.value = { ...tema.value, ...parcial }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tema.value))
  }

  function actualizarColorPaleta(indice: number, color: string) {
    const nueva = [...tema.value.paleta_segmentos]
    nueva[indice] = color
    actualizarTema({ paleta_segmentos: nueva })
  }

  function resetearTema() {
    tema.value = { ...TEMA_DEFECTO }
    localStorage.removeItem(STORAGE_KEY)
  }

  return { tema, actualizarTema, actualizarColorPaleta, resetearTema }
})
