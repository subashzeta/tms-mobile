import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'https://tms-momentum-api.vercel.app/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync('auth_token')
    }
    return Promise.reject(err)
  }
)

export default client
