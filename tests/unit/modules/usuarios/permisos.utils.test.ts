import { describe, expect, it } from 'vitest'
import {
  claveDuplicada,
  normalizarClave,
  normalizarModulo,
  usoPorPermiso,
  validarClavePermiso,
  validarDescripcionPermiso,
  validarModuloPermiso,
} from '@/modules/usuarios/utils/permisos'
import { mensajeDeError, traducirMensajeCore } from '@/modules/usuarios/utils/roles'

describe('validarClavePermiso', () => {
  it.each(['xia.tecnico', 'odcsap.view', 'cajachica.liquidaciones.view', 'boton-monitorear.view', 'inventario.bandeja_ajustes', 'XIA.Tecnico', ' xia . tecnico '])(
    'acepta %j (se normaliza)', clave => expect(validarClavePermiso(clave)).toBe(''))

  it.each(['', '   ', 'sinpunto', '.view', 'xia.', 'xia..view', 'xia.téc', 'xia/view', 'xia.view;'])(
    'rechaza %j', clave => expect(validarClavePermiso(clave)).not.toBe(''))

  it('limita la longitud', () => {
    expect(validarClavePermiso(`a.${'b'.repeat(99)}`)).toMatch(/superar/)
  })
})

describe('normalización', () => {
  it('claves en minúsculas y sin espacios', () => expect(normalizarClave(' XIA . Tecnico ')).toBe('xia.tecnico'))
  it('módulos en minúsculas con guiones', () => expect(normalizarModulo('  Caja Chica ')).toBe('caja-chica'))
})

describe('validarModuloPermiso / validarDescripcionPermiso', () => {
  it('módulo', () => {
    expect(validarModuloPermiso('xia')).toBe('')
    expect(validarModuloPermiso('Caja Chica')).toBe('')
    expect(validarModuloPermiso('')).not.toBe('')
    expect(validarModuloPermiso('mód/ulo')).not.toBe('')
  })
  it('descripción obligatoria y acotada', () => {
    expect(validarDescripcionPermiso('Ver el monitoreo')).toBe('')
    expect(validarDescripcionPermiso('  ')).not.toBe('')
    expect(validarDescripcionPermiso('x'.repeat(201))).toMatch(/superar/)
  })
})

describe('claveDuplicada', () => {
  const permisos = [{ id: 1, key: 'odcsap.view' }, { id: 2, key: 'articulomaestro.eliminacionSAP' }]
  it('ignora mayúsculas y espacios', () => {
    expect(claveDuplicada(' ODCSAP.view', permisos)).toBe(true)
    expect(claveDuplicada('articulomaestro.eliminacionsap', permisos)).toBe(true)
    expect(claveDuplicada('xia.tecnico', permisos)).toBe(false)
  })
  it('no cuenta el permiso que se edita', () => expect(claveDuplicada('odcsap.view', permisos, 1)).toBe(false))
})

describe('usoPorPermiso', () => {
  it('indica qué roles tienen cada permiso, ordenados', () => {
    const mapa = usoPorPermiso([
      { nombre: 'Gerente', permisos: [{ id: 1 }, { id: 2 }] },
      { nombre: 'Admin', permisos: [{ id: 1 }] },
    ])
    expect(mapa.get(1)).toEqual(['Admin', 'Gerente'])
    expect(mapa.get(2)).toEqual(['Gerente'])
    expect(mapa.has(3)).toBe(false)
  })
})

describe('traducción de mensajes del Core', () => {
  it('traduce los conocidos y respeta los demás', () => {
    expect(traducirMensajeCore('Permission key already exists.')).toBe('Ya existe un permiso con esa clave.')
    expect(traducirMensajeCore('Mensaje nuevo del servidor')).toBe('Mensaje nuevo del servidor')
  })
  it('mensajeDeError aplica la traducción', () => {
    expect(mensajeDeError({ response: { data: { message: 'Permission already assigned to role.' } } }, 'x')).toBe('El rol ya tiene ese permiso.')
  })
})
