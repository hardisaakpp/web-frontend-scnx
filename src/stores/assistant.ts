import { defineStore } from 'pinia'
import type { CoolTuritoExpression, CoolTuritoGesture } from '@/components/assistant/coolturito.types'

/**
 * Estado global de Cool-turito (asistente SCNEXUS AI).
 *
 * Permite que cualquier componente le pida una reacción a la mascota:
 *
 *   import { useAssistantStore } from '@/stores/assistant'
 *   const asistente = useAssistantStore()
 *   asistente.reaccionar('exito')            // celebra 2,5 s y vuelve a la normalidad
 *   asistente.reaccionar('concentrado', 4000) // duración personalizada en ms
 *
 * La reacción es un "override" temporal: el widget la muestra con prioridad,
 * salvo cuando está procesando una consulta (eso siempre gana).
 */
let reaccionTimeout: ReturnType<typeof setTimeout> | null = null

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    /** Expresión temporal pedida desde la app; null = sin override. */
    reaccion: null as CoolTuritoExpression | null,
    /** Gesto de cuerpo temporal (p. ej. 'caja' = transportando); null = postura normal. */
    gesto: null as CoolTuritoGesture | null,
  }),
  actions: {
    /** Muestra una expresión (y opcionalmente un gesto) durante `duracionMs` y luego vuelve al estado normal. */
    reaccionar(expresion: CoolTuritoExpression, duracionMs = 2500, gesto: CoolTuritoGesture | null = null): void {
      if (reaccionTimeout) clearTimeout(reaccionTimeout)
      this.reaccion = expresion
      this.gesto = gesto
      reaccionTimeout = setTimeout(() => {
        this.reaccion = null
        this.gesto = null
        reaccionTimeout = null
      }, duracionMs)
    },
    /** Cancela cualquier reacción en curso. */
    calmar(): void {
      if (reaccionTimeout) clearTimeout(reaccionTimeout)
      reaccionTimeout = null
      this.reaccion = null
      this.gesto = null
    },
  },
})
