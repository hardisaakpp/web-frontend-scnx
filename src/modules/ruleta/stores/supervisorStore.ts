import { defineStore } from 'pinia'
import { ruletaService } from '../services/ruletaApi'
import type { MetricasSupervisor, EnroladorMetrica } from '../types'

interface SupervisorState {
  metricas: MetricasSupervisor | null
  enroladores: EnroladorMetrica[]
  loading: boolean
  error: string | null
  umbralConversion: number
}

export const useSupervisorStore = defineStore('supervisor', {
  state: (): SupervisorState => ({
    metricas: null,
    enroladores: [],
    loading: false,
    error: null,
    umbralConversion: 20
  }),

  getters: {
    maxGiros: (state): number =>
      Math.max(...state.enroladores.map(e => e.giros), 1),

    enroladoresOrdenados: (state): EnroladorMetrica[] =>
      [...state.enroladores].sort((a, b) => b.giros - a.giros),

    totalAlertas: (state): number =>
      state.enroladores.filter(e => e.estado === 'alerta').length
  },

  actions: {
    async cargarDashboard() {
      this.loading = true
      this.error = null
      try {
        const enroladores = await ruletaService.getEnroladoresMetricas()
        this.enroladores = enroladores

        const totalGiros = enroladores.reduce((suma, e) => suma + e.giros, 0)
        const totalAfiliaciones = enroladores.reduce((suma, e) => suma + e.afiliaciones, 0)
        const clientesUnicos = enroladores.reduce((suma, e) => suma + (e.clientes_unicos || 0), 0)
        const tasa = totalGiros > 0 ? (totalAfiliaciones / totalGiros) * 100 : 0

        this.metricas = {
            total_giros: totalGiros,
            clientes_unicos: clientesUnicos,
            afiliaciones: totalAfiliaciones,
            afiliaciones_delta: 0,
            tasa_conversion: tasa,
            tienda_nombre: 'Global',
            tienda_ciudad: 'Todas',
            fecha: new Date().toISOString()
        }
      } catch (e) {
        console.error('Error al cargar dashboard de monitoreo:', e)
        this.error = 'Error al cargar los datos de monitoreo.'
      } finally {
        this.loading = false
      }
    },

    async cargarEnroladores(campanaId?: string) {
      this.loading = true
      this.error = null
      try {
        this.enroladores = await ruletaService.getEnroladoresMetricas(campanaId)
      } catch (e) {
        console.error('Error al cargar enroladores:', e)
        this.error = 'Error al cargar los datos de monitoreo.'
      } finally {
        this.loading = false
      }
    },

    exportarCSV() {
      if (!this.enroladores.length) return
      const headers = ['Enrolador', 'Giros', 'Clientes únicos', 'Afiliaciones', 'Conversión (%)']
      const rows = this.enroladores.map(e => [
        e.nombre, e.giros, e.clientes_unicos, e.afiliaciones, e.conversion.toFixed(1)
      ])
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `monitoreo_enroladores_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
})
