import type { Component } from 'vue'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, NoSymbolIcon, XCircleIcon } from '@heroicons/vue/24/solid'
import { EstadoDeposito } from '../types/tesoreria.types'

export type Tono = 'success' | 'warning' | 'danger' | 'neutral'

/**
 * Clases de badge por tono semántico — contraste verificado ≥4.5:1 (texto oscuro sobre fondo muy
 * claro en modo claro, y su inverso en modo oscuro). El color NUNCA es la única señal: siempre se
 * combina con un ícono distinto y una etiqueta de texto (WCAG 1.4.1).
 */
export const TONO_CLASES: Record<Tono, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  danger: 'bg-vermilion-100 text-vermilion-800 border-vermilion-300 dark:bg-vermilion-900/50 dark:text-vermilion-200 dark:border-vermilion-800',
  neutral: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
}

export const ESTADO_DEPOSITO_TONO: Record<EstadoDeposito, Tono> = {
  [EstadoDeposito.Pendiente]: 'warning',
  [EstadoDeposito.IntegradoSAP]: 'success',
  [EstadoDeposito.RechazadoSAP]: 'danger',
  [EstadoDeposito.Anulado]: 'neutral'
}

/** Reloj = esperando acción; Check = éxito; X = rechazo SAP; Prohibido = anulado. */
export const ESTADO_DEPOSITO_ICONO: Record<EstadoDeposito, Component> = {
  [EstadoDeposito.Pendiente]: ClockIcon,
  [EstadoDeposito.IntegradoSAP]: CheckCircleIcon,
  [EstadoDeposito.RechazadoSAP]: XCircleIcon,
  [EstadoDeposito.Anulado]: NoSymbolIcon
}

export const ICONO_ALERTA = ExclamationTriangleIcon
export const ICONO_EXITO = CheckCircleIcon
