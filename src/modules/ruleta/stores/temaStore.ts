import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TemaRuleta } from '../types'

const STORAGE_KEY = 'ruleta_tema'

export const TEMA_DEFECTO: TemaRuleta = {
  paleta_segmentos: ['#C87137', '#4F46E5', '#A8B4C8', '#3B82F6', '#E63946', '#5A5F6B'],
  color_texto_segmentos: '#ffffff',
  color_aro_primario: '#13A8E7',
  color_aro_secundario: '#0574AF',
  color_hub_fondo: '#0b1828',
  color_hub_acento: '#13A8E7',
  color_puntero: '#ffffff',
  color_fondo_inicio: '#060c18',
  color_fondo_fin: '#0b1828',
  color_halo: '#13A8E7',
  color_boton: '#0E97D4',
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
