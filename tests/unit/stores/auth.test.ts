import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import type { AuthCapabilities } from '@/stores/auth'
import api from '@/plugins/axios'

// Mock del módulo axios
vi.mock('@/plugins/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Crear instancia limpia de Pinia
    setActivePinia(createPinia())
    
    // Mock de localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    globalThis.localStorage = localStorageMock as unknown as Storage
    
    // Limpiar mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with null values when no token in localStorage', () => {
      const localStorageMock = localStorage as any
      localStorageMock.getItem.mockReturnValue(null)
      
      const authStore = useAuthStore()
      
      expect(authStore.token).toBeNull()
      expect(authStore.user).toBeNull()
      expect(authStore.role).toBeNull()
      expect(authStore.userData).toBeNull()
      expect(authStore.capabilities).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should initialize with token from localStorage if available', () => {
      const localStorageMock = localStorage as any
      localStorageMock.getItem.mockReturnValue('mock-token-123')
      
      const authStore = useAuthStore()
      
      expect(authStore.token).toBe('mock-token-123')
      expect(authStore.isAuthenticated).toBe(true)
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
          expiresIn: 3600,
          user: {
            id: '123',
            userName: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            roles: ['User'],
            permissions: ['odcsap.view', 'mabel.view']
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      }
      
      const mockMeResponse = {
        data: {
          user: mockResponse.data.user,
          capabilities: {
            can_view_odc_sap: false,
            can_manage_order: true,
            can_view_order_list: true,
            mabel_view: true
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)
      vi.mocked(api.get).mockResolvedValue(mockMeResponse)

      const authStore = useAuthStore()
      const result = await authStore.login({
        username: 'testuser',
        password: 'password123'
      })

      expect(result).toBe(true)
      expect(authStore.token).toBe(mockResponse.data.token)
      expect(authStore.user).toBe('testuser')
      expect(authStore.userData?.userName).toBe('testuser')
      expect(authStore.userData?.roles).toEqual(['User'])
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.data.token)
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user))
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${mockResponse.data.token}`)
    })

    it('should return false on login failure', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))

      const authStore = useAuthStore()
      const result = await authStore.login({
        username: 'wronguser',
        password: 'wrongpassword'
      })

      expect(result).toBe(false)
      // Token puede ser null o undefined si no se inicializó
      expect(authStore.token).toBeFalsy()
      expect(authStore.userData).toBeFalsy()
    })

    it('should call fetchMe after successful login', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          expiresIn: 3600,
          user: {
            id: '123',
            userName: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            roles: ['User'],
            permissions: ['odcsap.view']
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      }

      const mockMeResponse = {
        data: {
          user: mockResponse.data.user,
          capabilities: {
            can_view_odc_sap: false,
            can_manage_order: true,
            can_view_order_list: true,
            mabel_view: false
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)
      vi.mocked(api.get).mockResolvedValue(mockMeResponse)

      const authStore = useAuthStore()
      await authStore.login({
        username: 'testuser',
        password: 'password123'
      })

      expect(api.get).toHaveBeenCalledWith('/Auth/me')
      expect(authStore.capabilities).toEqual(mockMeResponse.data.capabilities)
    })
  })

  describe('fetchMe', () => {
    it('should fetch user data and capabilities', async () => {
      const mockMeResponse = {
        data: {
          user: {
            id: '123',
            userName: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            roles: ['Admin'],
            permissions: ['odc.view', 'odcsap.view', 'mabel.view']
          },
          capabilities: {
            can_view_odc_sap: true,
            can_manage_order: true,
            can_view_order_list: true,
            mabel_view: true
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      }

      vi.mocked(api.get).mockResolvedValue(mockMeResponse)

      const authStore = useAuthStore()
      authStore.token = 'test-token'
      
      await authStore.fetchMe()

      expect(authStore.userData).toEqual(mockMeResponse.data.user)
      expect(authStore.capabilities).toEqual(mockMeResponse.data.capabilities)
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockMeResponse.data.user))
    })

    it('should not fetch if no token present', async () => {
      const authStore = useAuthStore()
      authStore.token = null
      
      await authStore.fetchMe()

      expect(api.get).not.toHaveBeenCalled()
    })

    it('should logout on 401 error', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: { status: 401 }
      })

      const authStore = useAuthStore()
      authStore.token = 'expired-token'
      authStore.userData = { id: '123', userName: 'test', email: 'test@test.com', fullName: 'Test', roles: ['User'], permissions: [] }
      
      await authStore.fetchMe()

      expect(authStore.token).toBeNull()
      expect(authStore.userData).toBeNull()
    })
  })

  describe('Logout', () => {
    it('should clear all auth state', () => {
      const authStore = useAuthStore()
      authStore.token = 'test-token'
      authStore.user = 'testuser'
      authStore.role = 'Admin'
      authStore.userData = {
        id: '123',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['Admin'],
        permissions: ['odc.view']
      }
      authStore.capabilities = { can_view_odc_sap: true }

      authStore.logout()

      expect(authStore.token).toBeNull()
      expect(authStore.user).toBeNull()
      expect(authStore.role).toBeNull()
      expect(authStore.userData).toBeNull()
      expect(authStore.capabilities).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
      expect(api.defaults.headers.common['Authorization']).toBeUndefined()
    })
  })

  describe('Getters - Capabilities', () => {
    it('canViewOdcSap should return true only when capability is true', () => {
      const authStore = useAuthStore()
      
      // Without capabilities
      expect(authStore.canViewOdcSap).toBe(false)
      
      // With capability = true
      authStore.capabilities = { can_view_odc_sap: true }
      expect(authStore.canViewOdcSap).toBe(true)
      
      // With capability = false
      authStore.capabilities = { can_view_odc_sap: false }
      expect(authStore.canViewOdcSap).toBe(false)
    })

    it('canManageOrder should return true only when capability is true', () => {
      const authStore = useAuthStore()
      
      expect(authStore.canManageOrder).toBe(false)
      
      authStore.capabilities = { can_manage_order: true }
      expect(authStore.canManageOrder).toBe(true)
      
      authStore.capabilities = { can_manage_order: false }
      expect(authStore.canManageOrder).toBe(false)
    })

    it('canViewOrderList should return true only when capability is true', () => {
      const authStore = useAuthStore()
      
      expect(authStore.canViewOrderList).toBe(false)
      
      authStore.capabilities = { can_view_order_list: true }
      expect(authStore.canViewOrderList).toBe(true)
    })

    it('canViewMabel should return true only when capability is true', () => {
      const authStore = useAuthStore()
      
      expect(authStore.canViewMabel).toBe(false)
      
      authStore.capabilities = { mabel_view: true }
      expect(authStore.canViewMabel).toBe(true)
    })

    it('should handle multiple capabilities correctly', () => {
      const authStore = useAuthStore()
      authStore.capabilities = {
        can_view_odc_sap: true,
        can_manage_order: false,
        can_view_order_list: true,
        mabel_view: true
      }

      expect(authStore.canViewOdcSap).toBe(true)
      expect(authStore.canManageOrder).toBe(false)
      expect(authStore.canViewOrderList).toBe(true)
      expect(authStore.canViewMabel).toBe(true)
    })
  })

  describe('Getters - Roles and Permissions', () => {
    it('isAdmin should return true for Admin role', () => {
      const authStore = useAuthStore()
      
      authStore.userData = {
        id: '123',
        userName: 'admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        roles: ['Admin'],
        permissions: []
      }

      expect(authStore.isAdmin).toBe(true)
    })

    it('isAdmin should return false for non-Admin role', () => {
      const authStore = useAuthStore()
      
      authStore.userData = {
        id: '123',
        userName: 'user',
        email: 'user@example.com',
        fullName: 'Regular User',
        roles: ['User'],
        permissions: []
      }

      expect(authStore.isAdmin).toBe(false)
    })

    it('userPermissions should return permissions from userData', () => {
      const authStore = useAuthStore()
      
      authStore.userData = {
        id: '123',
        userName: 'user',
        email: 'user@example.com',
        fullName: 'User',
        roles: ['User'],
        permissions: ['odc.view', 'odcsap.view', 'mabel.view']
      }

      expect(authStore.userPermissions).toEqual(['odc.view', 'odcsap.view', 'mabel.view'])
    })

    it('userRoles should return roles from userData', () => {
      const authStore = useAuthStore()
      
      authStore.userData = {
        id: '123',
        userName: 'user',
        email: 'user@example.com',
        fullName: 'User',
        roles: ['User', 'Viewer'],
        permissions: []
      }

      expect(authStore.userRoles).toEqual(['User', 'Viewer'])
    })

    it('fullName should return fullName from userData', () => {
      const authStore = useAuthStore()
      
      authStore.userData = {
        id: '123',
        userName: 'jdoe',
        email: 'jdoe@example.com',
        fullName: 'John Doe',
        roles: ['User'],
        permissions: []
      }

      expect(authStore.fullName).toBe('John Doe')
    })

    it('userName should return userName from userData', () => {
      const authStore = useAuthStore()
      
      authStore.userData = {
        id: '123',
        userName: 'jdoe',
        email: 'jdoe@example.com',
        fullName: 'John Doe',
        roles: ['User'],
        permissions: []
      }

      expect(authStore.userName).toBe('jdoe')
    })
  })

  describe('Helper Methods', () => {
    it('hasRole should return true if user has the role', () => {
      const authStore = useAuthStore()
      authStore.userData = {
        id: '123',
        userName: 'user',
        email: 'user@example.com',
        fullName: 'User',
        roles: ['Admin', 'User'],
        permissions: []
      }

      expect(authStore.hasRole('Admin')).toBe(true)
      expect(authStore.hasRole('User')).toBe(true)
      expect(authStore.hasRole('SuperAdmin')).toBe(false)
    })

    it('hasPermission should return true if user has the permission', () => {
      const authStore = useAuthStore()
      authStore.userData = {
        id: '123',
        userName: 'user',
        email: 'user@example.com',
        fullName: 'User',
        roles: ['User'],
        permissions: ['odc.view', 'mabel.view']
      }

      expect(authStore.hasPermission('odc.view')).toBe(true)
      expect(authStore.hasPermission('mabel.view')).toBe(true)
      expect(authStore.hasPermission('admin.access')).toBe(false)
    })

    it('hasAnyPermission should return true if user has any of the permissions', () => {
      const authStore = useAuthStore()
      authStore.userData = {
        id: '123',
        userName: 'user',
        email: 'user@example.com',
        fullName: 'User',
        roles: ['User'],
        permissions: ['odc.view', 'mabel.view']
      }

      expect(authStore.hasAnyPermission(['odc.view', 'admin.access'])).toBe(true)
      expect(authStore.hasAnyPermission(['admin.access', 'superadmin.access'])).toBe(false)
      expect(authStore.hasAnyPermission([])).toBe(false)
    })
  })

  describe('initializeAuth', () => {
    it('should initialize auth from localStorage with valid token', () => {
      const mockUser = {
        id: '123',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['User'],
        permissions: ['odcsap.view']
      }

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InRlc3R1c2VyIiwicm9sZSI6WyJVc2VyIl0sImV4cCI6OTk5OTk5OTk5OX0.test'

      const localStorageMock = localStorage as any
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return mockToken
        if (key === 'user') return JSON.stringify(mockUser)
        return null
      })

      const authStore = useAuthStore()
      authStore.initializeAuth()

      expect(authStore.token).toBe(mockToken)
      expect(authStore.userData).toEqual(mockUser)
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`)
    })

    it('should logout if token is expired', () => {
      // Token con exp en el pasado
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InRlc3R1c2VyIiwicm9sZSI6WyJVc2VyIl0sImV4cCI6MTYwMDAwMDAwMH0.test'

      const localStorageMock = localStorage as any
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'token') return expiredToken
        return null
      })

      const authStore = useAuthStore()
      authStore.initializeAuth()

      expect(authStore.token).toBeNull()
      expect(authStore.userData).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })
  })
})
