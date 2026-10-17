import React from "react"
import { Leaf, ShieldCheck, Sparkles, Activity, Apple, HeartPulse } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-mesh py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Background Accents */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500" />
      
      {/* Container */}
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Visual Column (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-2xl relative overflow-hidden min-h-[580px]">
          {/* Subtle decorative glow circles */}
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                <Leaf className="h-6 w-6 text-emerald-400 fill-emerald-400/20" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Nutri<span className="text-emerald-400 font-extrabold">System</span>
                </span>
                <span className="text-[11px] font-medium text-emerald-300/80 uppercase tracking-widest">
                  Gestão para Nutricionistas
                </span>
              </div>
            </div>
          </div>

          {/* Center Content / Highlights */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              Plataforma Clínica Inteligente
            </div>

            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Potencialize o atendimento aos seus pacientes com precisão.
            </h1>

            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Planos alimentares personalizados, prontuário seguro no Neon com RLS e acompanhamento antropométrico de alto nível em um só lugar.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Activity className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-slate-200">Evolução Antropométrica</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Apple className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-slate-200">Planos em JSONB</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-emerald-700/50 flex items-center justify-between text-xs text-emerald-200/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Row Level Security (RLS) Ativado</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <HeartPulse className="h-4 w-4" />
              <span>Nutrição de Alta Performance</span>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          {/* Logo on Mobile */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Leaf className="h-5 w-5 fill-white/20" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Nutri<span className="text-emerald-600">System</span>
            </span>
          </div>

          {/* Header text */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {subtitle}
            </p>
          </div>

          {/* Children / Form */}
          {children}
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} NutriSystem &bull; Todos os direitos reservados.
      </footer>
    </div>
  )
}
