import { useToast } from '@/composables/useToast'

interface NotifyOptions {
  title: string
  message?: string
  duration?: number
}

/**
 * Wrapper estandarizado sobre useToast para reutilizar notificaciones
 * entre módulos sin duplicar formato ni prefijos.
 */
export function useModuleNotifications(moduleLabel?: string) {
  const toast = useToast()
  const prefix = moduleLabel?.trim() ? `[${moduleLabel.trim()}] ` : ''

  function withPrefix(title: string): string {
    return `${prefix}${title}`
  }

  function success(options: NotifyOptions) {
    return toast.success(withPrefix(options.title), options.message, options.duration)
  }

  function error(options: NotifyOptions) {
    return toast.error(withPrefix(options.title), options.message, options.duration)
  }

  function warning(options: NotifyOptions) {
    return toast.warning(withPrefix(options.title), options.message, options.duration)
  }

  function info(options: NotifyOptions) {
    return toast.info(withPrefix(options.title), options.message, options.duration)
  }

  return {
    success,
    error,
    warning,
    info
  }
}
