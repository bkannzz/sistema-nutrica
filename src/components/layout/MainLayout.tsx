import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { PacientesView } from "@/components/pacientes/PacientesView"
import { Database } from "lucide-react"

export const MainLayout: React.FC = () => {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState<"dashboard" | "pacientes">("dashboard")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const handleNavigateToPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    setCurrentTab("pacientes")
  }

  const handleClearSelectedPatient = () => {
    setSelectedPatientId(null)
  }

  const firstName = user?.nome ? user.nome.split(" ")[0] : "Nutricionista"

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Menu Lateral Fixo com Logótipo NutricaSistema */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === "dashboard") {
            setSelectedPatientId(null)
          }
          setCurrentTab(tab)
        }}
        onNavigateToPatient={handleNavigateToPatient}
      />

      {/* 2. Área Principal com margem para a Sidebar fixa */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              NutricaSistema
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {currentTab}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Neon DB indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-medium">
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>Neon RLS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Nutricionista Avatar badge */}
            <div className="flex items-center gap-2 pl-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-300">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden md:inline">
                {user?.nome}
              </span>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" ? (
            <DashboardView
              onNavigateToPatient={handleNavigateToPatient}
              onNavigateToPacientesTab={() => setCurrentTab("pacientes")}
            />
          ) : (
            <PacientesView
              selectedPatientId={selectedPatientId}
              onClearSelectedPatient={handleClearSelectedPatient}
            />
          )}
        </main>
      </div>
    </div>
  )
}
