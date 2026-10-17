import React, { createContext, useContext, useState, useEffect } from "react"
import { AuthService, NutricionistaUser } from "@/lib/auth"

interface AuthContextType {
  user: NutricionistaUser | null
  loading: boolean
  error: string | null
  login: (email: string, pass: string) => Promise<boolean>
  register: (nome: string, email: string, pass: string, confirmPass: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<NutricionistaUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check and restore persistent session
    try {
      const stored = AuthService.getStoredSession()
      if (stored) {
        setUser(stored)
      }
    } catch (e) {
      console.error("Erro ao recuperar sessão:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    const res = await AuthService.signIn(email, pass)
    setLoading(false)

    if (res.error) {
      setError(res.error)
      return false
    }

    if (res.user) {
      setUser(res.user)
      return true
    }

    return false
  }

  const register = async (
    nome: string,
    email: string,
    pass: string,
    confirmPass: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    const res = await AuthService.signUp(nome, email, pass, confirmPass)
    setLoading(false)

    if (res.error) {
      setError(res.error)
      return false
    }

    if (res.user) {
      setUser(res.user)
      return true
    }

    return false
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    await AuthService.signOut()
    setUser(null)
    setError(null)
    setLoading(false)
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider")
  }
  return context
}
