import { describe, it, expect } from 'vitest'
import {
  LOCAL_UPSTREAM_DEFAULTS,
  DOCKER_UPSTREAM_DEFAULTS,
  upstreamUrl,
  dockerBuildArgsFromEnv,
} from '../../../deploy/loadEnv.mjs'

describe('loadEnv.mjs — RECEPCION_UPSTREAM wiring', () => {
  it('defines a local default for UPSTREAM_RECEPCION', () => {
    expect(LOCAL_UPSTREAM_DEFAULTS.UPSTREAM_RECEPCION).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  })

  it('defines a docker default for UPSTREAM_RECEPCION', () => {
    expect(DOCKER_UPSTREAM_DEFAULTS.UPSTREAM_RECEPCION).toMatch(/^http:\/\/host\.docker\.internal:\d+$/)
  })

  it('upstreamUrl returns the explicit env value when set', () => {
    const env = { UPSTREAM_RECEPCION: 'http://192.168.1.50:9000' }
    expect(upstreamUrl(env, 'RECEPCION')).toBe('http://192.168.1.50:9000')
  })

  it('upstreamUrl falls back to the local default when unset (non-docker)', () => {
    expect(upstreamUrl({}, 'RECEPCION')).toBe(LOCAL_UPSTREAM_DEFAULTS.UPSTREAM_RECEPCION)
  })

  it('upstreamUrl falls back to the docker default when unset (docker mode)', () => {
    expect(upstreamUrl({}, 'RECEPCION', { docker: true })).toBe(DOCKER_UPSTREAM_DEFAULTS.UPSTREAM_RECEPCION)
  })

  it('dockerBuildArgsFromEnv wires RECEPCION_UPSTREAM from upstreamUrl', () => {
    const env = { UPSTREAM_RECEPCION: 'http://192.168.1.50:9000' }
    const args = dockerBuildArgsFromEnv(env)
    expect(args.RECEPCION_UPSTREAM).toBe('http://192.168.1.50:9000')
  })

  it('dockerBuildArgsFromEnv defaults RECEPCION_UPSTREAM when env is empty', () => {
    const args = dockerBuildArgsFromEnv({})
    expect(args.RECEPCION_UPSTREAM).toBe(LOCAL_UPSTREAM_DEFAULTS.UPSTREAM_RECEPCION)
  })
})
