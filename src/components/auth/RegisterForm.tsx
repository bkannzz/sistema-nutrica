import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react"

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, loading, error, clearError } = useAuth()

  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formValidation, setFormValidation] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormValidation(null)
    clearError()

    if (!nome.trim()) {
      setFormValidation("Por favor, preencha o seu nome completo.")
      return
    }

    if (!email.trim() || !email.includes("@")) {
      setFormValidation("Por favor, informe um endereço de e-mail válido.")
      return
    }

    if (password.length < 9) {
      setFormValidation("A senha deve ter no mínimo 9 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setFormValidation("As senhas não coincidem. Digite novamente.")
      return
    }

    await register(nome, email, password, confirmPassword)
  }

  const activeError = formValidation || error

  return (
    <Card className="border border-slate-200/80 shadow-soft">
      <CardContent className="pt-6 sm:pt-8">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* Error Alert */}
          {activeError && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{activeError}</AlertDescription>
            </Alert>
          )}

          {/* Full Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-nome">Nome Completo</Label>
            <Input
              id="reg-nome"
              type="text"
              placeholder="Ex: Dra. Juliana Silveira"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                if (activeError) {
                  setFormValidation(null)
                  clearError()
                }
              }}
              icon={<User className="h-4 w-4" />}
              autoComplete="name"
              required
              disabled={loading}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">E-mail</Label>
            <Input
              id="reg-email"
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
              <Label htmlFor="reg-password">Senha</Label>
              <span className={`text-[11px] font-medium ${password.length >= 9 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {password.length >= 9 ? '✓ Mínimo 9 caracteres atingido' : 'Mínimo 9 caracteres'}
              </span>
            </div>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha forte (mín. 9 dígitos)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (activeError) {
                    setFormValidation(null)
                    clearError()
                  }
                }}
                icon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
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

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reg-confirm-password">Confirmar Senha</Label>
              {confirmPassword && password === confirmPassword && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Senhas conferem
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (activeError) {
                    setFormValidation(null)
                    clearError()
                  }
                }}
                icon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full text-sm font-semibold h-11 transition-all mt-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta e salvando no Neon...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar conta
              </>
            )}
          </Button>

          {/* Link to Login */}
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  clearError()
                  setFormValidation(null)
                  onSwitchToLogin()
                }}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
              >
                Faça login
              </button>
            </p>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
