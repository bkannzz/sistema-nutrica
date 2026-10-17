import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { MainLayout } from "@/components/layout/MainLayout"
import { Leaf, Loader2 } from "lucide-react"

export const App: React.FC = () => {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  // Loading state while restoring session
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 animate-pulse">
          <Leaf className="h-7 w-7" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          Carregando NutricaSistema...
        </div>
      </div>
    )
  }

  // If user is authenticated, redirect straight to MainLayout (Dashboard & Pacientes)
  if (user) {
    return <MainLayout />
  }

  // If not authenticated, render Login or Register screen
  return (
    <AuthLayout
      title={authMode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
      subtitle={
        authMode === "login"
          ? "Informe seus dados para acessar o prontuário dos seus pacientes"
          : "Cadastre-se para começar a gerenciar consultas e dietas com precisão"
      }
    >
      {authMode === "login" ? (
        <LoginForm onSwitchToRegister={() => setAuthMode("register")} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setAuthMode("login")} />
      )}
    </AuthLayout>
  )
}

export default App
