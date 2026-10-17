import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { DatabaseService, DashboardMetrics } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  Clock, 
  ChevronRight, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  ArrowUpRight,
  UserCheck
} from "lucide-react"

interface DashboardViewProps {
  onNavigateToPatient?: (patientId: string) => void
  onNavigateToPacientesTab?: () => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigateToPatient,
  onNavigateToPacientesTab 
}) => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [insertingSample, setInsertingSample] = useState<boolean>(false)

  const loadData = async (isManualRefresh = false) => {
    if (!user?.id) return
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const data = await DatabaseService.getDashboardMetrics(user.id)
      setMetrics(data)
    } catch (e) {
      console.error("Falha ao carregar métricas:", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  // Helper to add sample clinical data in Neon if database is completely empty
  const handleAddSampleData = async () => {
    if (!user?.id) return
    setInsertingSample(true)
    try {
      // 1. Paciente 1 (Sem retorno há 45 dias)
      const p1 = await DatabaseService.createPaciente(user.id, {
        nome: "Mariana Souza Ribeiro",
        whatsapp: "(11) 98765-4321",
        email: "mariana.souza@exemplo.com",
        peso_inicial: 68.5,
        altura: 1.65,
        objetivo_texto: "Emagrecimento saudável e reeducação alimentar",
      })

      if (p1?.id) {
        // Consulta há 42 dias, sem retorno agendado
        const d = new Date()
        d.setDate(d.getDate() - 42)
        await DatabaseService.createConsulta(user.id, p1.id, {
          data_consulta: d.toISOString().split("T")[0],
          peso: 67.2,
          cintura: 76,
          quadril: 101,
          percentual_gordura: 26.5,
          observacoes: "Paciente evoluiu bem, porém faltou ao agendamento seguinte.",
          proximo_retorno: null,
        })
      }

      // 2. Paciente 2 (Consulta nesta semana)
      const p2 = await DatabaseService.createPaciente(user.id, {
        nome: "Carlos Eduardo Mendes",
        whatsapp: "(11) 99123-5566",
        email: "carlos.mendes@exemplo.com",
        peso_inicial: 84.0,
        altura: 1.78,
        objetivo_texto: "Hipertrofia muscular e aumento de performance",
      })

      if (p2?.id) {
        // Consulta na data de hoje (semana atual)
        const today = new Date().toISOString().split("T")[0]
        const nextMonth = new Date()
        nextMonth.setDate(nextMonth.getDate() + 30)

        await DatabaseService.createConsulta(user.id, p2.id, {
          data_consulta: today,
          peso: 82.5,
          cintura: 82,
          quadril: 98,
          percentual_gordura: 16.8,
          observacoes: "Primeira reavaliação. Ótima adesão à dieta hiperproteica.",
          proximo_retorno: nextMonth.toISOString().split("T")[0],
        })
      }

      // 3. Paciente 3 (Ativo)
      await DatabaseService.createPaciente(user.id, {
        nome: "Beatriz Oliveira Castro",
        whatsapp: "(11) 97654-1122",
        email: "beatriz.castro@exemplo.com",
        peso_inicial: 59.0,
        altura: 1.62,
        objetivo_texto: "Controle de síndrome do intestino irritável (FODMAPs)",
      })

      await loadData()
    } catch (err) {
      console.error("Erro ao popular dados de teste:", err)
    } finally {
      setInsertingSample(false)
    }
  }

  const formatDataBr = (dataIso?: any) => {
    if (!dataIso) return "—"
    try {
      if (dataIso instanceof Date) {
        return dataIso.toLocaleDateString("pt-BR")
      }
      const str = String(dataIso).split("T")[0]
      const parts = str.split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return new Date(dataIso).toLocaleDateString("pt-BR")
    } catch {
      return String(dataIso)
    }
  }

  const firstName = user?.nome ? user.nome.split(" ")[0] : "Nutricionista"

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Neon PostgreSQL em tempo real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aqui está o resumo dos seus atendimentos e pacientes hoje.
          </p>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="rounded-xl border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Atualizar</span>
          </Button>

          {metrics.totalPacientes === 0 && (
            <Button
              size="sm"
              onClick={handleAddSampleData}
              disabled={insertingSample}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              {insertingSample ? "Carregando..." : "Gerar Dados de Exemplo"}
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Main Cards: Cards 1, 2, 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1 — Total de pacientes ativos */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total de Pacientes Ativos
                </p>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  ) : (
                    metrics.totalPacientes
                  )}
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <Users className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Cadastrados sob sua conta
              </span>
              {onNavigateToPacientesTab && (
                <button
                  onClick={onNavigateToPacientesTab}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  Ver todos <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CARD 2 — Consultas da semana */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Consultas da Semana
                </p>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  ) : (
                    metrics.consultasSemana
                  )}
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shadow-inner">
                <Calendar className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-teal-600" />
                Semana atual ({new Date().toLocaleDateString("pt-BR", { month: "short" })})
              </span>
              <span className="font-semibold text-slate-600">
                Segunda a Domingo
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3 Summary Pill / Counter */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pacientes sem Retorno
                </p>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
                  {loading ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  ) : (
                    <>
                      <span>{metrics.pacientesSemRetorno.length}</span>
                      <span className="text-xs font-medium text-slate-400">&gt;30 dias</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                <AlertCircle className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Atenção clínica necessária
              </span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Sem retorno agendado
              </span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* CARD 3 (Detalhado) — Lista de Pacientes sem retorno */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                Card 3 — Pacientes sem retorno
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500">
              Pacientes cuja última consulta foi realizada há mais de 30 dias e que não possuem próximo retorno agendado.
            </p>
          </div>

          <span className="text-xs font-bold text-amber-700 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full">
            {metrics.pacientesSemRetorno.length} paciente(s)
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Consultando dados no Neon em tempo real...
              </p>
            </div>
          ) : metrics.pacientesSemRetorno.length === 0 ? (
            // Regra do prompt: se não houver pacientes sem retorno
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Nenhum paciente sem retorno no momento
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Todos os seus pacientes estão com retornos agendados ou realizaram consulta recentemente nos últimos 30 dias.
                </p>
              </div>
            </div>
          ) : (
            // Lista com nome dos pacientes clicáveis redirecionando para o perfil
            <div className="divide-y divide-slate-100">
              {metrics.pacientesSemRetorno.map((paciente) => (
                <div
                  key={paciente.id}
                  onClick={() => onNavigateToPatient?.(paciente.id)}
                  role="button"
                  tabIndex={0}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-800 transition-colors">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate flex items-center gap-2">
                        <span>{paciente.nome}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-3 mt-0.5">
                        {paciente.whatsapp && (
                          <span>WhatsApp: {paciente.whatsapp}</span>
                        )}
                        {paciente.email && (
                          <span className="hidden sm:inline">E-mail: {paciente.email}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                        Última consulta: {formatDataBr(paciente.ultima_consulta)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {paciente.dias_sem_consulta} dias sem retorno
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
