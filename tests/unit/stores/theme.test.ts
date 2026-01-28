import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('Theme Store', () => {
  beforeEach(() => {
    // Crear una instancia limpia de Pinia para cada test
    setActivePinia(createPinia())
    
    // Mock de localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    }
    global.localStorage = localStorageMock as any
    
    // Mock de document.documentElement
    global.document.documentElement.classList = {
      add: vi.fn(),
      remove: vi.fn(),
    } as any
    
    // Mock de window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('should initialize with light theme by default', () => {
    const themeStore = useThemeStore()
    
    expect(themeStore.currentTheme).toBe('light')
    expect(themeStore.isDark).toBe(false)
  })

  it('should toggle theme from light to dark', () => {
    const themeStore = useThemeStore()
    
    themeStore.toggleTheme()
    
    expect(themeStore.currentTheme).toBe('dark')
    expect(themeStore.isDark).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('should toggle theme from dark to light', () => {
    const themeStore = useThemeStore()
    
    // Primero cambiar a dark
    themeStore.setTheme('dark')
    
    // Luego toggle de vuelta a light
    themeStore.toggleTheme()
    
    expect(themeStore.currentTheme).toBe('light')
    expect(themeStore.isDark).toBe(false)
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should set theme to dark', () => {
    const themeStore = useThemeStore()
    
    themeStore.setTheme('dark')
    
    expect(themeStore.currentTheme).toBe('dark')
    expect(themeStore.isDark).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('should set theme to light', () => {
    const themeStore = useThemeStore()
    
    themeStore.setTheme('light')
    
    expect(themeStore.currentTheme).toBe('light')
    expect(themeStore.isDark).toBe(false)
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should apply dark class to document when theme is dark', () => {
    const themeStore = useThemeStore()
    const addClassMock = vi.fn()
    document.documentElement.classList.add = addClassMock
    
    themeStore.setTheme('dark')
    
    expect(addClassMock).toHaveBeenCalledWith('dark')
  })

  it('should remove dark class from document when theme is light', () => {
    const themeStore = useThemeStore()
    const removeClassMock = vi.fn()
    document.documentElement.classList.remove = removeClassMock
    
    themeStore.setTheme('light')
    
    expect(removeClassMock).toHaveBeenCalledWith('dark')
  })

  it('should initialize theme from localStorage if available', () => {
    const localStorageMock = localStorage as any
    localStorageMock.getItem.mockReturnValue('dark')
    
    const themeStore = useThemeStore()
    themeStore.initTheme()
    
    expect(themeStore.currentTheme).toBe('dark')
    expect(themeStore.isDark).toBe(true)
  })

  it('should use system preference when localStorage is empty', () => {
    const localStorageMock = localStorage as any
    localStorageMock.getItem.mockReturnValue(null)
    
    // Simular preferencia de sistema en dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    
    const themeStore = useThemeStore()
    themeStore.initTheme()
    
    expect(themeStore.currentTheme).toBe('dark')
    expect(themeStore.isDark).toBe(true)
  })
})
