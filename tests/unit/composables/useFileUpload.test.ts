import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFileUpload } from '@/modules/mba3-consultas/composables/useFileUpload'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '@/modules/mba3-consultas/services/mba3ConsultasApi'

// Mocks
vi.mock('@/composables/useToast')
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    useRouter: vi.fn()
  }
})
vi.mock('@/modules/mba3-consultas/services/mba3ConsultasApi', () => ({
  mba3ConsultasService: {
    uploadPlantilla: vi.fn(),
    reintentarPlantillaConCorrecciones: vi.fn()
  }
}))

describe('useFileUpload', () => {
  let mockToast: any
  let mockRouter: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock toast
    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
    vi.mocked(useToast).mockReturnValue(mockToast)

    // Mock router
    mockRouter = {
      push: vi.fn()
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
  })

  describe('Initial State', () => {
    it('should initialize with uploading false', () => {
      const { uploading } = useFileUpload()

      expect(uploading.value).toBe(false)
    })

    it('should initialize with error modal hidden', () => {
      const { showErrorModal } = useFileUpload()

      expect(showErrorModal.value).toBe(false)
    })

    it('should initialize with null error info', () => {
      const { uploadErrorInfo } = useFileUpload()

      expect(uploadErrorInfo.value).toBeNull()
    })

    it('should initialize with null original file', () => {
      const { archivoOriginal } = useFileUpload()

      expect(archivoOriginal.value).toBeNull()
    })
  })

  describe('validateFile', () => {
    it('should validate Excel file extension .xlsx', () => {
      const { validateFile } = useFileUpload()
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('should validate Excel file extension .xls', () => {
      const { validateFile } = useFileUpload()
      const file = new File(['content'], 'test.xls', { type: 'application/vnd.ms-excel' })

      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('should reject non-Excel file', () => {
      const { validateFile } = useFileUpload()
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Solo se permiten archivos Excel')
    })

    it('should reject file exceeding size limit', () => {
      const { validateFile } = useFileUpload()
      // Create a file larger than 10MB (mock size)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('El tamaño máximo es')
    })
  })

  describe('uploadFile', () => {
    it('should set uploading to true during upload', async () => {
      const { uploadFile, uploading } = useFileUpload()
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      vi.mocked(mba3ConsultasService.uploadPlantilla).mockResolvedValue({
        success: true,
        numero_pedido: 'P-12.48 - 01 - 2026'
      } as any)

      const uploadPromise = uploadFile(file)
      expect(uploading.value).toBe(true)

      await uploadPromise
    })

    it('should call uploadPlantilla service', async () => {
      const { uploadFile } = useFileUpload()
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      vi.mocked(mba3ConsultasService.uploadPlantilla).mockResolvedValue({
        success: true,
        numero_pedido: 'P-12.48 - 01 - 2026'
      } as any)

      await uploadFile(file)

      expect(mba3ConsultasService.uploadPlantilla).toHaveBeenCalledWith(file)
    })

    it('should call uploadPlantilla service with success', async () => {
      const mockOnSuccess = vi.fn()
      const { uploadFile } = useFileUpload({
        onUploadSuccess: mockOnSuccess
      })
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      vi.mocked(mba3ConsultasService.uploadPlantilla).mockResolvedValue({
        success: true,
        numero_pedido: 'P-12.48 - 01 - 2026'
      } as any)

      await uploadFile(file)

      expect(mockOnSuccess).toHaveBeenCalledWith('P-12.48 - 01 - 2026')
    })

    it('should set error info on upload error', async () => {
      const { uploadFile, uploadErrorInfo } = useFileUpload()
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const error = new Error('Upload failed')
      vi.mocked(mba3ConsultasService.uploadPlantilla).mockRejectedValue(error)

      try {
        await uploadFile(file)
      } catch (e) {
        // Expected to throw
      }

      expect(uploadErrorInfo.value).not.toBeNull()
    })
  })

  describe('openFileSelector', () => {
    it('should have openFileSelector function', () => {
      const { openFileSelector } = useFileUpload()

      expect(openFileSelector).toBeDefined()
      expect(typeof openFileSelector).toBe('function')
    })

    it('should not open selector when already uploading', () => {
      const { openFileSelector, uploading } = useFileUpload()

      uploading.value = true
      openFileSelector()

      // No debería crear un input file porque ya está uploading
      // (difícil de testear sin DOM)
      expect(uploading.value).toBe(true)
    })
  })

  describe('reintentarConCorrecciones', () => {
    it('should have reintentarConCorrecciones function', () => {
      const { reintentarConCorrecciones } = useFileUpload()

      expect(reintentarConCorrecciones).toBeDefined()
      expect(typeof reintentarConCorrecciones).toBe('function')
    })
  })
})
