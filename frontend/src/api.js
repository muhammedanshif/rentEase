import axios from 'axios'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API = axios.create({ baseURL: `${BASE_URL}/api` })
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
export const UPLOADS = `${BASE_URL}/api/uploads`
export default API
