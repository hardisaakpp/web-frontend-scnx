export const LOGIN_REDIRECT_URL =
  (import.meta.env.VITE_LOGIN_REDIRECT_URL as string) ||
  `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

function isLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/login/')
}

export function clearStoredSession(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  if (isLoginPath(window.location.pathname)) return
  window.location.href = LOGIN_REDIRECT_URL
}

export function attachUnauthorizedRedirect(
  instance: any,
  options?: { ignoreUrlIncludes?: string[] }
): void {
  instance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      const status = error?.response?.status
      const requestUrl = String(error?.config?.url || '').toLowerCase()
      const ignore = options?.ignoreUrlIncludes?.some((part) => requestUrl.includes(part.toLowerCase())) || false

      if (status === 401 && !ignore) {
        clearStoredSession()
        redirectToLogin()
      }
      return Promise.reject(error)
    }
  )
}
