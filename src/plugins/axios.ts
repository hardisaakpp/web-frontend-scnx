import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
})

// Request: inyectar token en cada petición (refresh, etc.)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response: no borrar token aquí; el store decide cuándo hacer logout en 401
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default api