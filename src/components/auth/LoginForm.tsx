import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react"

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, loading, error, clearError } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formValidation, setFormValidation] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormValidation(null)
    clearError()

    if (!email.trim()) {
      setFormValidation("Por favor, preencha o seu e-mail.")
      return
    }

    if (!password) {
      setFormValidation("Por favor, informe a sua senha.")
      return
    }

    if (password.length < 9) {
      setFormValidation("A senha deve ter no mínimo 9 caracteres.")
      return
    }

    await login(email, password)
  }

  const activeError = formValidation || error

  return (
    <Card className="border border-slate-200/80 shadow-soft">
      <CardContent className="pt-6 sm:pt-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          
          {/* Error Alert */}
          {activeError && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{activeError}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (activeError) {
                  setFormValidation(null)
                  clearError()
                }
              }}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Senha</Label>
              <span className="text-[11px] text-slate-400 font-medium">Mínimo 9 caracteres</span>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="•••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (activeError) {
                    setFormValidation(null)
                    clearError()
                  }
                }}
                icon={<Lock className="h-4 w-4" />}
                autoComplete="current-password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full text-sm font-semibold h-11 transition-all mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Acessando sistema...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* Link to Register */}
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  clearError()
                  setFormValidation(null)
                  onSwitchToRegister()
                }}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
              >
                Cadastre-se
              </button>
            </p>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
