import { describe, expect, it } from 'vitest'
import {
  agruparPorModulo,
  filtrarPermisos,
  mensajeDeError,
  nombreRolDuplicado,
  validarNombreRol,
  ROL_NOMBRE_MAX,
} from '@/modules/usuarios/utils/roles'
import type { Permiso } from '@/modules/usuarios/types'

const p = (id: number, key: string, module: string, description = ''): Permiso => ({ id, key, module, description })

describe('validarNombreRol', () => {
  it.each(['Desarrollador', 'Dev Xia', 'Jefe-de_Tienda.2', 'Ñandú', 'A1'])('acepta %s', nombre => {
    expect(validarNombreRol(nombre)).toBe('')
  })

  it.each(['', '   ', 'a', '-inicio', ' _inicio', 'rol<script>', 'rol/otro', 'rol;x'])('rechaza %j', nombre => {
    expect(validarNombreRol(nombre)).not.toBe('')
  })

  it('aplica el límite de longitud tras recortar espacios', () => {
    expect(validarNombreRol(`  ${'a'.repeat(ROL_NOMBRE_MAX)}  `)).toBe('')
    expect(validarNombreRol('a'.repeat(ROL_NOMBRE_MAX + 1))).toMatch(/superar/)
  })
})

describe('nombreRolDuplicado', () => {
  const roles = [{ id: '1', name: 'Admin' }, { id: '2', name: 'Gerente' }]
  it('compara sin distinguir mayúsculas ni espacios en los extremos', () => {
    expect(nombreRolDuplicado('  gerente ', roles)).toBe(true)
    expect(nombreRolDuplicado('Otro', roles)).toBe(false)
  })
  it('ignora el rol que se está editando', () => {
    expect(nombreRolDuplicado('Gerente', roles, '2')).toBe(false)
    expect(nombreRolDuplicado('Admin', roles, '2')).toBe(true)
  })
})

describe('agruparPorModulo', () => {
  it('agrupa y ordena módulos y permisos', () => {
    const grupos = agruparPorModulo([p(1, 'z.view', 'zeta'), p(2, 'a.edit', 'alfa'), p(3, 'a.view', 'alfa')])
    expect(grupos.map(g => g.modulo)).toEqual(['alfa', 'zeta'])
    expect(grupos[0].permisos.map(x => x.key)).toEqual(['a.edit', 'a.view'])
  })
  it('manda los permisos sin módulo a "general"', () => {
    expect(agruparPorModulo([p(1, 'x', '')])[0].modulo).toBe('general')
  })
})

describe('filtrarPermisos', () => {
  const lista = [p(1, 'odcsap.view', 'odc', 'ODC SAP - funcionalidades de El Rayo'), p(2, 'xia.tecnico', 'xia', 'Documentación técnica')]
  it('busca en clave, descripción y módulo, sin tildes ni mayúsculas', () => {
    expect(filtrarPermisos(lista, 'TECNICA').map(x => x.id)).toEqual([2])
    expect(filtrarPermisos(lista, 'rayo').map(x => x.id)).toEqual([1])
    expect(filtrarPermisos(lista, 'odc').map(x => x.id)).toEqual([1])
  })
  it('sin texto devuelve todo', () => {
    expect(filtrarPermisos(lista, '  ')).toHaveLength(2)
  })
})

describe('mensajeDeError', () => {
  it('prefiere el mensaje que devuelve el Core', () => {
    expect(mensajeDeError({ response: { data: { message: 'Ya existe un rol llamado "X".' } } }, 'fallo')).toBe('Ya existe un rol llamado "X".')
  })
  it('acepta cuerpos de texto y ProblemDetails', () => {
    expect(mensajeDeError({ response: { data: 'Role requerido' } }, 'fallo')).toBe('Role requerido')
    expect(mensajeDeError({ response: { data: { title: 'Bad Request' } } }, 'fallo')).toBe('Bad Request')
  })
  it('usa el respaldo si no hay nada útil', () => {
    expect(mensajeDeError(new Error('Network Error'), 'No se pudo')).toBe('No se pudo')
    expect(mensajeDeError({ response: { data: {} } }, 'No se pudo')).toBe('No se pudo')
  })
})
