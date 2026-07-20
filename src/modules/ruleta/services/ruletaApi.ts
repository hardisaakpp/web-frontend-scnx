import axios from 'axios'
import type {
  Ruleta, RuletaFilters, RuletaPagination,
  Tienda, SegmentoRuleta, IdentificacionCliente, ResultadoGiro,
  MetricasSupervisor, EnroladorMetrica,
  Campana, CampanaBackendResponse, CampanaDisponibleBackendResponse, DisponibilidadCampana, CrearCampanaDTO, GrupoProbabilidad, PremioAdmin,
  TiendaInventario, InventarioPremio,
  MetricasGlobal, EfectividadTienda, SegmentacionGrupo, ConversionSemanal,
  EstadoCampana, EstadoGrupo, SegmentoCliente, TipoPremio,
  PremioBackendResponse, GiroRequestDTO,
  GiroVerificacionResponse, RedencionResponse, MetricasCampana,
  HistorialGiroItem, HistorialGirosResponse,
  StockPremio
} from '../types'

// Instancia heredada para endpoints del core API (getRuletas, etc.)
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Cliente HTTP para el backend de Ruleta (localhost:5062 en dev) ───────────
const campanaApi = axios.create({
  baseURL: import.meta.env.VITE_RULETA_API_URL || '/ruleta-api',
  headers: { 'Content-Type': 'application/json' }
})

campanaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

function mapCampana(raw: CampanaBackendResponse): Campana {
  return {
    id: raw.id,
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? undefined,
    fecha_inicio: raw.fechaInicio.slice(0, 10),
    fecha_fin: raw.fechaFin.slice(0, 10),
    cooldown_dias: raw.diasEntreGiros,
    max_giros: raw.maxGirosPorCliente,
    segmentos_permitidos: (raw.segmentosPermitidos as SegmentoCliente[]) ?? [],
    estado: raw.estado.toLowerCase() as EstadoCampana,
    estado_operativo: raw.estadoOperativo.toLowerCase() as Campana['estado_operativo'],
    esta_vigente: raw.estaVigente,
    disponible_para_giro: raw.disponibleParaGiro,
    motivo_no_disponible: raw.motivoNoDisponible,
    requiere_validacion_onecard: raw.requiereValidacionOneCard ?? false,
    tiene_premios: Array.isArray(raw.premios) && raw.premios.length > 0,
    hora_feliz_inicio: raw.horaFelizInicio ?? null,
    hora_feliz_fin: raw.horaFelizFin ?? null
  }
}

function mapPremioFromBackend(p: PremioBackendResponse): PremioAdmin {
  let tipo: TipoPremio = 'fisico'
  if (p.esVacio || p.tipo === 'SinPremio') tipo = 'relleno'
  else if (p.tipo === 'Digital') tipo = 'digital'
  else if (p.tipo === 'Descuento') tipo = 'descuento'
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? null,
    tipo,
    stock_total: p.stockTotal,
    stock_disponible: p.stockDisponible ?? null,
    valor_referencial: p.valorReferencial ?? null,
    es_relleno: p.esVacio,
    imagen_url: p.imagenUrl ?? undefined,
    controla_stock_por_tienda: p.controlaStockPorTienda ?? false,
  }
}

function premioToBackend(data: Partial<PremioAdmin>, segmento?: string) {
  let tipo = 'SinPremio'
  if (data.tipo === 'fisico') tipo = 'Fisico'
  else if (data.tipo === 'digital') tipo = 'Digital'
  else if (data.tipo === 'descuento') tipo = 'Descuento'

  // Nunca persistir una URL de blob local del navegador: solo existe en la
  // sesión de quien la subió y se rompe para cualquier otro usuario.
  const imagenUrl = data.imagen_url?.startsWith('blob:') ? null : (data.imagen_url ?? null)

  const payload: Record<string, unknown> = {
    nombre: data.nombre,
    descripcion: data.descripcion ?? null,
    tipo,
    stockTotal: data.stock_total ?? null,
    valorReferencial: data.valor_referencial ?? null,
    esVacio: data.es_relleno ?? false,
    segmento,
    imagenUrl,
    controlaStockPorTienda: data.controla_stock_por_tienda ?? false,
    
    // Hardcodeado: Forzamos a que sea 0 sí o sí.
    ordenRuleta: 0 
  }


  return payload
}

// ─── CRUD base (listado admin) ────────────────────────────────────────────────
export const ruletaService = {
  async getRuletas(filters: RuletaFilters): Promise<{ data: Ruleta[]; pagination: RuletaPagination }> {
    const response = await api.get<{ items?: Ruleta[]; total?: number; page?: number; page_size?: number; total_pages?: number } & Ruleta[]>('/v1/ruleta/', {
      params: { search: filters.search ?? undefined, page: filters.page ?? 1, page_size: filters.pageSize ?? 10 }
    })
    return {
      data: (response.data as any).items ?? response.data,
      pagination: {
        total: (response.data as any).total ?? 0,
        page: (response.data as any).page ?? 1,
        pageSize: (response.data as any).page_size ?? 10,
        totalPages: (response.data as any).total_pages ?? 0
      }
    }
  },

  async getRuletaById(id: number): Promise<Ruleta> {
    const response = await api.get<Ruleta>(`/v1/ruleta/${id}`)
    return response.data
  },

  async createRuleta(data: Partial<Ruleta>): Promise<Ruleta> {
    const response = await api.post<Ruleta>('/v1/ruleta/', data)
    return response.data
  },

  async updateRuleta(id: number, data: Partial<Ruleta>): Promise<Ruleta> {
    const response = await api.patch<Ruleta>(`/v1/ruleta/${id}`, data)
    return response.data
  },

  async deleteRuleta(id: number): Promise<void> {
    await api.delete(`/v1/ruleta/${id}`)
  },

  // ─── Tema Global ───────────────────────────────────────────────────────────
  async getTemaGlobal(): Promise<any> {
    try {
      const response = await campanaApi.get<any>('/api/temas')
      if (response.data?.temaJson) {
        return JSON.parse(response.data.temaJson)
      }
      return null
    } catch (e) {
      console.error('Error al obtener tema global:', e)
      return null
    }
  },

  async updateTemaGlobal(temaJson: any): Promise<void> {
    await campanaApi.put('/api/temas', temaJson)
  },

  // ─── Tiendas ───────────────────────────────────────────────────────────────
  async getTiendas(): Promise<Tienda[]> {
    const response = await campanaApi.get<{ codigo: string; nombre: string }[]>('/api/tiendas', {
      params: { marca: 'ROLAND' }
    })
    return response.data.map((t, i) => ({
      id: i + 1,
      codigo: t.codigo,
      nombre: t.nombre,
      ciudad: '',
      activa: true
    }))
  },

  // ─── Obtener Campaña Activa ──────────────────────────────────────────────────
  async getCampanaActiva(): Promise<Campana | null> {
    const disponibilidad = await this.getDisponibilidadCampana()
    return disponibilidad.disponible && disponibilidad.campana
      ? disponibilidad.campana
      : null
  },

  async getDisponibilidadCampana(): Promise<DisponibilidadCampana> {
    const response = await campanaApi.get<CampanaDisponibleBackendResponse>('/api/Campanas/disponible-para-giro')
    return {
      disponible: response.data.disponible,
      estado_operativo: response.data.estadoOperativo,
      motivo: response.data.motivo,
      campana: response.data.campana ? mapCampana(response.data.campana) : null
    }
  },

  // ─── Segmentos campaña activa ──────────────────────────────────────────────
  async getSegmentosCampanaActiva(campanaId?: string): Promise<SegmentoRuleta[]> {
    if (!campanaId) return []
    const response = await campanaApi.get<PremioBackendResponse[]>(`/api/campanas/${campanaId}/premios`)
    
    return response.data.map((p, index) => {
      let tipo: 'digital' | 'fisico' | 'relleno' = 'fisico'
      if (p.esVacio || p.tipo === 'SinPremio') tipo = 'relleno'
      else if (p.tipo === 'Digital' || p.tipo === 'Cupon') tipo = 'digital'
      
      return {
        id: index + 1,
        nombre: p.nombre, // Mantenemos el nombre original para mostrarlo bonito
        descripcion: p.descripcion,
        tipo,
        imagen_url: null,
        color: ['#C87137', '#4F46E5', '#A8B4C8', '#3B82F6', '#E63946', '#5A5F6B'][index % 6],
        es_vacio: p.esVacio
      }
    })
  },

  // ─── Identificar cliente (llama API Credicorp vía backend) ─────────────────
  async identificarCliente(cedula: string): Promise<IdentificacionCliente> {
    const response = await campanaApi.post<IdentificacionCliente>('/api/clientes/identificar', {
      identificacion: cedula
    })
    return response.data
  },

  // ─── Ejecutar giro ─────────────────────────────────────────────────────────
  async ejecutarGiro(cedula: string, tiendaCodigo: string, enroladorId?: number, campanaId?: string): Promise<ResultadoGiro> {
    if (!campanaId) throw new Error('No hay campaña activa')

    const request: GiroRequestDTO = {
      identificacion: cedula,
      campanaId,
      tiendaCodigo,
      enroladorId,
      deviceHash: 'enrolador-web'
    }

    const response = await campanaApi.post<any>('/api/giros', request)
    const data = response.data

    let tipo: 'digital' | 'fisico' | 'relleno' = 'fisico'
    if (!data.esGanador || data.premioTipo === 'SinPremio') tipo = 'relleno'
    else if (data.premioTipo === 'Digital' || data.premioTipo === 'Cupon') tipo = 'digital'

    const segmentoGanador: SegmentoRuleta = {
      id: Date.now(),
      nombre: data.premioNombre || 'Sin Premio',
      descripcion: data.premioDescripcion || null,
      tipo,
      imagen_url: null,
      color: '#4F46E5',
      es_vacio: !data.esGanador
    }

    return {
      giro_id: data.id || String(Date.now()),
      codigo_canje: data.codigoRedencion,
      premio: segmentoGanador,
      es_ganador: data.esGanador,
      indice_segmento: -1,
      cliente: {
        identificacion: cedula,
        correo: data.clienteCorreo ?? null,
        segmento: null,
        en_lista_negra: false,
        nombre: null,
        telefono: null
      }
    }
  },

  // ─── Enviar notificación por email ─────────────────────────────────────────
  async enviarNotificacion(giroId: string | number, correo: string): Promise<void> {
    await campanaApi.post(`/api/giros/${giroId}/notificacion`, { correo })
  },

  // ─── Admin: Campañas ─────────────────────────────────────────────────────────
  async getCampanas(): Promise<Campana[]> {
    const response = await campanaApi.get<CampanaBackendResponse[]>('/api/Campanas')
    return response.data.map(mapCampana)
  },

  async crearCampana(dto: CrearCampanaDTO): Promise<Campana> {
    const payload = {
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      fechaInicio: dto.fecha_inicio,
      fechaFin: dto.fecha_fin,
      diasEntreGiros: dto.cooldown_dias,
      maxGirosPorCliente: dto.max_giros,
      segmentosPermitidos: dto.segmentos_permitidos.length > 0 ? dto.segmentos_permitidos : null,
      requiereValidacionOneCard: dto.requiere_validacion_onecard,
      horaFelizInicio: dto.hora_feliz_inicio ?? null,
      horaFelizFin: dto.hora_feliz_fin ?? null,
      estado: 'Borrador'
    }
    const response = await campanaApi.post<CampanaBackendResponse>('/api/Campanas', payload)
    return mapCampana(response.data)
  },

  async actualizarCampana(id: string, dto: CrearCampanaDTO): Promise<Campana> {
    const payload = {
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      fechaInicio: dto.fecha_inicio,
      fechaFin: dto.fecha_fin,
      diasEntreGiros: dto.cooldown_dias,
      maxGirosPorCliente: dto.max_giros,
      segmentosPermitidos: dto.segmentos_permitidos.length > 0 ? dto.segmentos_permitidos : null,
      requiereValidacionOneCard: dto.requiere_validacion_onecard,
      horaFelizInicio: dto.hora_feliz_inicio ?? null,
      horaFelizFin: dto.hora_feliz_fin ?? null
    }
    const response = await campanaApi.put<CampanaBackendResponse>(`/api/Campanas/${id}`, payload)
    return mapCampana(response.data)
  },

  async cambiarEstadoCampana(id: string, estado: Campana['estado']): Promise<void> {
    const nuevoEstado = estado.charAt(0).toUpperCase() + estado.slice(1)
    await campanaApi.patch(`/api/Campanas/${id}/estado`, { nuevoEstado })
  },

  async eliminarCampana(id: string): Promise<void> {
    await campanaApi.delete(`/api/Campanas/${id}`)
  },

  // ─── Admin: Premios y probabilidades ─────────────────────────────────────────
  async getGruposProbabilidad(campanaId: string): Promise<GrupoProbabilidad[]> {
    const response = await campanaApi.get<PremioBackendResponse[]>(`/api/campanas/${campanaId}/premios`)
    const ALL_GROUPS: SegmentoCliente[] = ['GRUPO_1','GRUPO_2','GRUPO_3','GRUPO_4','GRUPO_5','GRUPO_6']
    const GROUP_LABELS: Record<SegmentoCliente, string> = {
      GRUPO_1: 'Grupo 1', GRUPO_2: 'Grupo 2', GRUPO_3: 'Grupo 3',
      GRUPO_4: 'Grupo 4', GRUPO_5: 'Grupo 5', GRUPO_6: 'Grupo 6 — No afiliados'
    }
    const byGroup = new Map<SegmentoCliente, PremioAdmin[]>()
    for (const g of ALL_GROUPS) byGroup.set(g, [])
    for (const p of response.data) {
      const seg = (p.segmento || 'GRUPO_1') as SegmentoCliente
      if (byGroup.has(seg)) byGroup.get(seg)!.push(mapPremioFromBackend(p))
    }
    return ALL_GROUPS.map(g => {
      const premios = byGroup.get(g)!
      const tieneReal = premios.some(p => !p.es_relleno)
      const tieneConsolacion = premios.some(p => p.es_relleno)
      const permiteSoloConsolacion = g === 'GRUPO_4' || g === 'GRUPO_5' || g === 'GRUPO_6'
      
      let estado: EstadoGrupo = 'incompleto'
      if ((tieneReal && tieneConsolacion) || (permiteSoloConsolacion && tieneConsolacion)) estado = 'completo'
      else if (tieneReal) estado = 'advertencia'
      
      return { grupo: g, label: GROUP_LABELS[g], estado, premios }
    })
  },

  async actualizarPremio(campanaId: string, premioId: string, data: Partial<PremioAdmin>): Promise<void> {
    await campanaApi.put(`/api/campanas/${campanaId}/premios/${premioId}`, premioToBackend(data))
  },

  async agregarPremio(campanaId: string, segmento: string, data: Omit<PremioAdmin, 'id'>): Promise<PremioAdmin> {
    const response = await campanaApi.post<PremioBackendResponse>(
      `/api/campanas/${campanaId}/premios`,
      premioToBackend(data, segmento)
    )
    return mapPremioFromBackend(response.data)
  },

  async eliminarPremio(campanaId: string, premioId: string): Promise<void> {
    await campanaApi.delete(`/api/campanas/${campanaId}/premios/${premioId}`)
  },

  async subirImagenPremio(archivo: File): Promise<string> {
    const formData = new FormData()
    formData.append('archivo', archivo)
    const response = await campanaApi.post<{ url: string }>('/api/premios/imagenes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.url
  },

  async asignarStockTienda(campanaId: string, premioId: string, tiendaCodigo: string, cantidad: number): Promise<void> {
    await campanaApi.post(
      `/api/campanas/${campanaId}/premios/${premioId}/stock-tienda`,
      null,
      { params: { tiendaCodigo, stockTotal: cantidad } }
    )
  },

  // ─── Admin: Inventario ────────────────────────────────────────────────────────
  async getTiendasInventario(): Promise<TiendaInventario[]> {
    const response = await campanaApi.get<{ codigo: string; nombre: string }[]>('/api/tiendas', {
      params: { marca: 'ROLAND' }
    })
    return response.data.map((t, i) => ({ id: i + 1, nombre: t.nombre, codigo: t.codigo }))
  },

  async getInventarioCampana(campanaId: string, tiendas: TiendaInventario[] = []): Promise<InventarioPremio[]> {
    const response = await campanaApi.get<PremioBackendResponse[]>(`/api/campanas/${campanaId}/premios`)
    return response.data
      .filter(p => !p.esVacio && p.controlaStockPorTienda && (p.stockTotal ?? 0) > 0)
      .map(p => {
        const por_tienda: Record<number, number> = {}
        if (p.inventariosTienda) {
          for (const inv of p.inventariosTienda) {
            const tiendaEncontrada = tiendas.find(t => t.codigo === inv.tiendaCodigo)
            if (tiendaEncontrada) {
              por_tienda[tiendaEncontrada.id] = inv.stockTotal
            }
          }
        }
        
        const total_asignado = Object.values(por_tienda).reduce((a, b) => a + b, 0)
        
        return {
          premio_id: p.id,
          nombre: p.nombre,
          tipo: p.tipo,
          stock_total: p.stockTotal ?? 0,
          por_tienda,
          total_asignado,
          restante_bodega: (p.stockTotal ?? 0) - total_asignado,
        }
      })
  },

  // ─── Admin: Dashboard Global ──────────────────────────────────────────────────
  async getMetricasGlobal(): Promise<MetricasGlobal> {
    const r = await campanaApi.get<any>('/api/metricas/global')
    const d = r.data
    return {
      total_participantes:     d.totalParticipantes     ?? d.total_participantes     ?? 0,
      participantes_delta_hoy: d.participantesDeltaHoy  ?? d.participantes_delta_hoy ?? 0,
      afiliaciones_nuevas:     d.afiliacionesNuevas     ?? d.afiliaciones_nuevas     ?? 0,
      afiliaciones_delta_hoy:  d.afiliacionesDeltaHoy   ?? d.afiliaciones_delta_hoy  ?? 0,
      tasa_conversion:         d.tasaConversion         ?? d.tasa_conversion         ?? 0,
      tasa_conversion_meta:    d.tasaConversionMeta     ?? d.tasa_conversion_meta    ?? 0,
      premios_entregados:      d.premiosEntregados      ?? d.premios_entregados      ?? 0,
      premios_redimidos:       d.premiosRedimidos       ?? d.premios_redimidos       ?? 0,
      porcentaje_redimidos:    d.porcentajeRedimidos    ?? d.porcentaje_redimidos    ?? 0,
    }
  },

  async getEfectividadTiendas(): Promise<EfectividadTienda[]> {
    const r = await campanaApi.get<any[]>('/api/metricas/tiendas')
    return r.data.map((t: any) => ({
      tienda_id:      t.tiendaId       ?? t.tienda_id      ?? 0,
      tienda_nombre:  t.tiendaNombre   ?? t.tienda_nombre  ?? '',
      giros:          t.totalGiros     ?? t.giros          ?? 0,
      participantes:  t.participantes  ?? 0,
      afiliaciones:   t.afiliaciones   ?? 0,
      conversion:     t.tasaConversion ?? t.conversion     ?? 0,
      premios:        t.premiosEntregados ?? t.premios     ?? 0,
      stock_restante: t.stockRestante  ?? t.stock_restante ?? 0,
      alerta_stock:   t.alertaStock    ?? t.alerta_stock   ?? false,
    }))
  },

  async getSegmentacion(): Promise<SegmentacionGrupo[]> {
    const r = await campanaApi.get<any[]>('/api/metricas/segmentacion')
    return r.data.map((s: any) => ({
      grupo:      s.grupo      ?? '',
      label:      s.label      ?? s.grupo ?? '',
      cantidad:   s.cantidad   ?? 0,
      porcentaje: s.porcentaje ?? 0,
      color:      s.color      ?? '#94a3b8',
    }))
  },

  async getConversionSemanal(): Promise<ConversionSemanal[]> {
    const r = await campanaApi.get<any[]>('/api/metricas/conversion-semanal')
    return r.data.map((s: any) => ({
      label: s.label ?? s.semana ?? '',
      valor: s.valor ?? s.tasaConversion ?? s.tasa_conversion ?? 0,
    }))
  },

  // ─── Supervisor ─────────────────────────────────────────────────────────────
  async getMetricasSupervisor(): Promise<MetricasSupervisor> {
    const r = await campanaApi.get<any>('/api/metricas/supervisor')
    const d = r.data
    return {
      total_giros:        d.totalGiros        ?? d.total_giros        ?? 0,
      clientes_unicos:    d.clientesUnicos    ?? d.clientes_unicos    ?? 0,
      afiliaciones:       d.afiliaciones      ?? 0,
      afiliaciones_delta: d.afiliacionesDelta ?? d.afiliaciones_delta ?? 0,
      tasa_conversion:    d.tasaConversion    ?? d.tasa_conversion    ?? 0,
      tienda_nombre:      d.tiendaNombre      ?? d.tienda_nombre      ?? '',
      tienda_ciudad:      d.tiendaCiudad      ?? d.tienda_ciudad      ?? '',
      fecha:              d.fecha             ?? new Date().toISOString().slice(0, 10),
    }
  },

  // ─── Verificar y redimir códigos ─────────────────────────────────────────────
  async verificarCodigo(codigo: string): Promise<GiroVerificacionResponse> {
    const response = await campanaApi.get<GiroVerificacionResponse>(`/api/giros/verificar/${codigo}`)
    return response.data
  },

  async redimirPremio(codigo: string, notas?: string): Promise<RedencionResponse> {
    const response = await campanaApi.post<RedencionResponse>(`/api/redenciones/${codigo}`, { notas: notas ?? null })
    return response.data
  },

  // ─── Métricas de campaña ──────────────────────────────────────────────────────
  async getMetricasCampana(campanaId: string): Promise<MetricasCampana> {
    const response = await campanaApi.get<any>(`/api/metricas/campanas/${campanaId}`)
    const d = response.data
    return {
      totalGiros:          d.totalGiros          ?? 0,
      totalGanadores:      d.totalGanadores      ?? 0,
      porcentajeGanadores: d.porcentajeGanadores ?? 0,
      premiosEntregados:   d.premiosEntregados   ?? 0,
      // backend puede enviar stockTotalRestante o stockRestanteGlobal
      stockRestanteGlobal: d.stockRestanteGlobal ?? d.stockTotalRestante ?? 0,
    }
  },

  // ─── Stock de premios para dashboard ─────────────────────────────────────────
  async getStockPremiosCampana(campanaId: string): Promise<StockPremio[]> {
    const response = await campanaApi.get<any[]>(`/api/campanas/${campanaId}/premios`)
    return response.data
      .filter(p => !p.esVacio)
      .map(p => {
        const total      = p.stockTotal      ?? 0
        const disponible = p.stockDisponible ?? total
        return {
          id:               p.id      ?? '',
          nombre:           p.nombre  ?? '',
          tipo:             p.tipo    ?? '',
          stockTotal:       total,
          stockDisponible:  disponible,
          alertaBajoStock:  disponible === 0 || (total > 0 && disponible / total < 0.2),
        }
      })
  },

  // ─── Historial de giros ───────────────────────────────────────────────────────
  async getHistorialGiros(campanaId?: string, page = 1, pageSize = 10): Promise<HistorialGirosResponse> {
    const params: Record<string, unknown> = { page, pageSize }
    if (campanaId) params.campanaId = campanaId
    const response = await campanaApi.get<any>('/api/metricas/giros', { params })
    const d = response.data
    const items: HistorialGiroItem[] = (d.items ?? d.Items ?? []).map((item: any) => ({
      id:               item.id               ?? item.giroId            ?? '',
      fecha:            item.fecha            ?? item.fechaGiro         ?? '',
      identificacion:   item.identificacion   ?? item.clienteIdentificacion ?? '',
      tiendaCodigo:     item.tiendaCodigo     ?? item.tienda            ?? '',
      enroladorNombre:  item.enroladorNombre  ?? null,
      premioNombre:     item.premioNombre     ?? '',
      premioTipo:       item.premioTipo       ?? item.tipo              ?? '',
      esGanador:        item.esGanador        ?? false,
      codigoRedencion:  item.codigoRedencion  ?? item.codigo            ?? null,
      redimido:         item.redimido         ?? item.estado === 'Redimido',
    }))
    return {
      totalRegistros: d.totalRegistros ?? 0,
      totalPaginas:   d.totalPaginas   ?? 0,
      paginaActual:   d.paginaActual   ?? page,
      items,
    }
  },

  async exportarGirosCsv(campanaId?: string): Promise<void> {
    const params: Record<string, string> = {}
    if (campanaId) params.CampanaId = campanaId
    const response = await campanaApi.get('/api/metricas/giros/exportar', { params, responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = campanaId ? `giros-${campanaId}.csv` : 'giros.csv'
    a.click()
    URL.revokeObjectURL(blobUrl)
  },

  async exportarGirosExcel(campanaId?: string): Promise<void> {
    const params: Record<string, string> = {}
    if (campanaId) params.CampanaId = campanaId
    const response = await campanaApi.get('/api/metricas/giros/exportar/excel', { params, responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = campanaId ? `giros-${campanaId}.xlsx` : 'giros.xlsx'
    a.click()
    URL.revokeObjectURL(blobUrl)
  },

  async exportarEnroladoresExcel(campanaId?: string): Promise<void> {
    const params: Record<string, string> = {}
    if (campanaId) params.CampanaId = campanaId
    const response = await campanaApi.get('/api/metricas/enroladores/exportar/excel', { params, responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = 'enroladores.xlsx'
    a.click()
    URL.revokeObjectURL(blobUrl)
  },

  async getEnroladoresMetricas(campanaId?: string): Promise<EnroladorMetrica[]> {
    const params: Record<string, string> = {}
    if (campanaId) params.CampanaId = campanaId
    const response = await campanaApi.get<any[]>('/api/metricas/enroladores', { params })
    return response.data.map((e, i) => ({
      id:              e.id               ?? e.enroladorId         ?? i + 1,
      nombre:          e.enroladorNombre  ?? e.nombre              ?? e.nombreEnrolador ?? '',
      tienda:          e.tiendaNombre     ?? e.tienda              ?? e.tiendaCodigo    ?? undefined,
      giros:           e.totalGiros       ?? e.giros               ?? 0,
      clientes_unicos: e.clientesUnicos   ?? e.clientes_unicos     ?? 0,
      afiliaciones:    e.totalGanadores   ?? e.afiliaciones        ?? e.nuevasAfiliaciones ?? 0,
      conversion:      (e.totalGiros ?? e.giros ?? 0) > 0 
                         ? ((e.totalGanadores ?? e.afiliaciones ?? e.nuevasAfiliaciones ?? 0) / (e.totalGiros ?? e.giros ?? 0)) * 100 
                         : 0,
      estado:          e.estado  ?? 'activo',
    }))
  }
}
