import type { ReceptionTransferStatus } from '../types'

/**
 * Shared status badge label/colors — extracted from identical copies in InProgressView.vue and
 * TransferDetailView.vue so a color/label change (e.g. the 'in-progress' badge) only needs to
 * happen in one place.
 */
export const STATUS_META: Record<ReceptionTransferStatus, { label: string; classes: string }> = {
  pending: { label: 'Pendiente', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  'in-progress': {
    label: 'En curso',
    classes: 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE] dark:bg-[#2B3359] dark:text-[#C7D2FE] dark:border-[#3B4272]',
  },
  confirmed: { label: 'Confirmada', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  error: { label: 'Error', classes: 'bg-red-100 text-red-700 border-red-200' },
}

export function statusMeta(status: ReceptionTransferStatus) {
  return STATUS_META[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700 border-gray-200' }
}
