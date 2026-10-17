import React from "react"
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Leaf
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface SidebarProps {
  currentTab: "dashboard" | "pacientes"
  onTabChange: (tab: "dashboard" | "pacientes") => void
  onNavigateToPatient?: (patientId: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { user, logout } = useAuth()
  const firstName = user?.nome ? user.nome.split(" ")[0] : "Nutricionista"

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
            <Leaf className="h-5 w-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
              Nutrica<span className="text-emerald-600">Sistema</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase">
              Área Clínica
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>

        {/* Option 1: Dashboard */}
        <button
          onClick={() => onTabChange("dashboard")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
            currentTab === "dashboard"
              ? "bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200/60 font-bold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <div className={`p-1.5 rounded-lg ${currentTab === "dashboard" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="flex-1">Dashboard</span>
          {currentTab === "dashboard" && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          )}
        </button>

        {/* Option 2: Pacientes */}
        <button
          onClick={() => onTabChange("pacientes")}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
            currentTab === "pacientes"
              ? "bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200/60 font-bold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <div className={`p-1.5 rounded-lg ${currentTab === "pacientes" ? "bg-emerald-600 text-white" : "text-slate-500"}`}>
            <Users className="h-4 w-4" />
          </div>
          <span className="flex-1">Pacientes</span>
          {currentTab === "pacientes" && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          )}
        </button>
      </div>

      {/* User Card & Logout Bottom */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200/80">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">
              {user?.nome || "Nutricionista"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sair do sistema"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
