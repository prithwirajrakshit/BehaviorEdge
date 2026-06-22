import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const signup = (data) => api.post('/auth/signup', data)
export const login  = (data) => api.post('/auth/login', data)

// Profile
export const getProfile  = ()     => api.get('/profile/')
export const saveProfile = (data) => api.post('/profile/', data)

// Trades
export const getTrades      = ()   => api.get('/trades/')
export const logTrade       = (data) => api.post('/trades/', data)
export const getTodayTrades = ()   => api.get('/trades/today')
export const deleteTrade    = (id) => api.delete(`/trades/${id}`)

// AI Coach
export const sendMessage     = (data) => api.post('/coach/chat', data)
export const getChatHistory  = ()     => api.get('/coach/history')
export const clearChatHistory= ()     => api.delete('/coach/history')

// Dashboard
export const getDashboardStats  = ()           => api.get('/dashboard/stats')
export const getCalendar        = (y, m)       => api.get(`/dashboard/calendar?year=${y}&month=${m}`)
export const getMonthlySummary  = (y, m)       => api.get(`/dashboard/monthly-summary?year=${y}&month=${m}`)

// Rules
export const getRules    = ()          => api.get('/rules/')
export const addRule     = (data)      => api.post('/rules/', data)
export const updateRule  = (id, data)  => api.put(`/rules/${id}`, data)
export const deleteRule  = (id)        => api.delete(`/rules/${id}`)

export default api

// Pre-trade check
export const preTradeCheck = (data) => api.post('/coach/pre-trade', data)

// User Identity
export const getMe = () => api.get('/profile/me')
export const updateMe = (data) => api.put('/profile/me', data)
export const changePassword = (data) => api.post('/profile/change-password', data)
export const uploadAvatar = (formData) => api.post('/profile/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteAvatar = () => api.delete('/profile/avatar')
