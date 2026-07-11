import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as SecureStore from 'expo-secure-store'
import { auth as authApi } from '../api/endpoints'
import type { User } from '../types'

function normalizeRole(role: string): string {
  return role?.toLowerCase() ?? ''
}

function normalizeUser(user: any): User {
  if (!user) return user
  return { ...user, role: normalizeRole(user.role) }
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    restoreSession()
  }, [])

  const restoreSession = async () => {
    try {
      const stored = await SecureStore.getItemAsync('auth_token')
      if (stored) {
        setToken(stored)
        const userData = await authApi.me()
        setUser(normalizeUser(userData))
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token').catch(() => {})
    } finally {
      setIsLoading(false)
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    await SecureStore.setItemAsync('auth_token', res.token)
    setToken(res.token)
    setUser(normalizeUser(res.user))
  }, [])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token').catch(() => {})
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
