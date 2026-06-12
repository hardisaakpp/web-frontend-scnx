/**
 * API principal del Core — retrocompatibilidad.
 *
 * Los módulos que ya importaban `import api from '@/services/api'`
 * (usuarios, reposiciones, etc.) siguen funcionando sin cambios.
 */
import { coreApi } from '@/lib/http'

export default coreApi
