import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { DatabaseService, Paciente } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NovoPacienteForm } from "@/components/pacientes/NovoPacienteForm"
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  ArrowLeft, 
  Phone, 
  Mail, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ArrowUpRight
} from "lucide-react"

interface PacientesViewProps {
  selectedPatientId?: string | null
  onClearSelectedPatient?: () => void
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  selectedPatientId,
  onClearSelectedPatient,
}) => {
  const { user } = useAuth()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")
  const [activePatient, setActivePatient] = useState<Paciente | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const loadPacientes = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await DatabaseService.getPacientes(user.id)
      setPacientes(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPacientes()
  }, [user?.id])

  // If patient ID provided externally (e.g. from Dashboard Card 3)
  useEffect(() => {
    if (selectedPatientId && pacientes.length > 0) {
      const found = pacientes.find((p) => p.id === selectedPatientId)
      if (found) {
        setActivePatient(found)
        setIsCreatingNew(false)
      }
    }
  }, [selectedPatientId, pacientes])

  const handlePatientCreated = (novoPaciente: Paciente) => {
    setIsCreatingNew(false)
    setActivePatient(novoPaciente)
    setSuccessToast(`Paciente "${novoPaciente.nome}" cadastrado com sucesso!`)
    loadPacientes()
    setTimeout(() => {
      setSuccessToast(null)
    }, 5000)
  }

  const formatDataBr = (dataIso?: any) => {
    if (!dataIso) return "—"
    try {
      if (dataIso instanceof Date) {
        return dataIso.toLocaleDateString("pt-BR")
      }
      const clean = String(dataIso).split("T")[0]
      const parts = clean.split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return new Date(dataIso).toLocaleDateString("pt-BR")
    } catch {
      return String(dataIso)
    }
  }

  // Filtragem de busca por nome
  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  // =========================================================================
  // TELA 1: FORMULÁRIO DE CADASTRO (PÁGINA NOVA)
  // =========================================================================
  if (isCreatingNew) {
    return (
      <NovoPacienteForm
        onSuccess={handlePatientCreated}
        onCancel={() => setIsCreatingNew(false)}
      />
    )
  }

  // =========================================================================
  // TELA 2: PERFIL DO PACIENTE (PRONTUÁRIO CLÍNICO)
  // =========================================================================
  if (activePatient) {
    const imc =
      activePatient.peso_inicial && activePatient.altura
        ? (
            activePatient.peso_inicial /
            (activePatient.altura * activePatient.altura)
          ).toFixed(1)
        : null

    return (
      <div className="space-y-6">
        {/* Toast de Sucesso */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Back navigation bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActivePatient(null)
              onClearSelectedPatient?.()
            }}
            className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a lista de pacientes
          </Button>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Prontuário Ativo &bull; Neon RLS
          </span>
        </div>

        {/* Patient Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                {activePatient.nome.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {activePatient.nome}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Ativo
                  </span>
                  {activePatient.sexo && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      {activePatient.sexo}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                  {activePatient.whatsapp && (
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      {activePatient.whatsapp}
                    </span>
                  )}
                  {activePatient.telefone && activePatient.telefone !== activePatient.whatsapp && (
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {activePatient.telefone}
                    </span>
                  )}
                  {activePatient.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-emerald-600" />
                      {activePatient.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Cadastrado em {formatDataBr(activePatient.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Consulta
              </Button>
            </div>
          </div>
        </div>

        {/* Antropometria & Dados Clínicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Peso Inicial
              </p>
              <div className="text-2xl font-black text-slate-900">
                {activePatient.peso_inicial ? `${activePatient.peso_inicial} kg` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Altura
              </p>
              <div className="text-2xl font-black text-slate-900">
                {activePatient.altura ? `${Math.round(activePatient.altura * 100)} cm` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                IMC Calculado
              </p>
              <div className="text-2xl font-black text-slate-900">
                {imc ? `${imc}` : "—"}{" "}
                <span className="text-xs font-semibold text-emerald-600">kg/m²</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardContent className="p-5 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Última Consulta
              </p>
              <div className="text-2xl font-black text-slate-900">
                {formatDataBr(activePatient.ultima_consulta)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes Clínicos e Hábitos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna 1: Objetivos e Patologias */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Histórico Clínico e Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Objetivos:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient.objetivos && activePatient.objetivos.length > 0 ? (
                    activePatient.objetivos.map((o) => (
                      <span key={o} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {o}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Nenhum objetivo selecionado</span>
                  )}
                </div>
                {activePatient.objetivo_texto && (
                  <p className="mt-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {activePatient.objetivo_texto}
                  </p>
                )}
              </div>

              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nível de Atividade:
                </p>
                <p className="font-semibold text-slate-800">
                  {activePatient.nivel_atividade || "Não informado"}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Patologias / Condições:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient.patologias && activePatient.patologias.length > 0 ? (
                    activePatient.patologias.map((p) => (
                      <span key={p} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-semibold border border-red-200">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Nenhuma registrada</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Restrições & Alergias:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient.restricoes_alimentares?.map((r) => (
                    <span key={r} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                      Restrição: {r}
                    </span>
                  ))}
                  {activePatient.alergias?.map((a) => (
                    <span key={a} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                      Alergia: {a}
                    </span>
                  ))}
                  {(!activePatient.restricoes_alimentares || activePatient.restricoes_alimentares.length === 0) &&
                   (!activePatient.alergias || activePatient.alergias.length === 0) && (
                    <span className="text-slate-500 italic">Nenhuma restrição ou alergia registrada</span>
                  )}
                </div>
              </div>

              {(activePatient.medicamentos || activePatient.suplementos) && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {activePatient.medicamentos && (
                    <div>
                      <span className="font-bold text-slate-500">Medicamentos:</span> {activePatient.medicamentos}
                    </div>
                  )}
                  {activePatient.suplementos && (
                    <div>
                      <span className="font-bold text-slate-500">Suplementos:</span> {activePatient.suplementos}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coluna 2: Hábitos e Rotina */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Hábitos e Rotina Diária
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Refeições / dia:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {activePatient.refeicoes_por_dia ? `${activePatient.refeicoes_por_dia} refeições` : "—"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Água / dia:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {activePatient.litros_agua ? `${activePatient.litros_agua} litros` : "—"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Horário Acorda:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {activePatient.horario_acorda || "—"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block font-semibold">Horário Dorme:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {activePatient.horario_dorme || "—"}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Atividade Física:
                </p>
                <p className="font-medium text-slate-800">
                  {activePatient.atividade_fisica === true
                    ? `Sim — ${activePatient.atividade_fisica_descricao || "Sem detalhes"}`
                    : activePatient.atividade_fisica === false
                    ? "Não pratica"
                    : "Não informado"}
                </p>
              </div>

              {activePatient.observacoes && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Observações Gerais:
                  </p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {activePatient.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    )
  }

  // =========================================================================
  // TELA 3: LISTAGEM DE PACIENTES (TELA PRINCIPAL DA ABA)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header bar com título e Botão "Novo Paciente" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento e prontuário completo de pacientes cadastrados.
          </p>
        </div>

        {/* Botão Novo Paciente que redireciona para o formulário de cadastro */}
        <Button
          onClick={() => setIsCreatingNew(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs self-start sm:self-auto font-bold px-4 h-11"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Paciente
        </Button>
      </div>

      {/* Campo de busca por nome no topo da listagem */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
        />
      </div>

      {/* Tabela / Lista de Pacientes */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Carregando lista de pacientes do Neon...
            </div>
          ) : filteredPacientes.length === 0 ? (
            // Regra do prompt: "Nenhum paciente cadastrado ainda"
            <div className="p-12 text-center max-w-sm mx-auto space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {search ? "Nenhum paciente encontrado com esse nome" : "Nenhum paciente cadastrado ainda"}
              </h4>
              <p className="text-xs text-slate-500">
                {search
                  ? "Tente buscar por outro termo ou limpe a busca."
                  : "Clique em 'Novo Paciente' acima para cadastrar seu primeiro paciente."}
              </p>
              {!search && (
                <Button
                  size="sm"
                  onClick={() => setIsCreatingNew(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Paciente
                </Button>
              )}
            </div>
          ) : (
            // Cada paciente da lista deve exibir: nome, objetivo e data da última consulta
            // E ser clicável redirecionando para o perfil
            <div className="divide-y divide-slate-100">
              {filteredPacientes.map((p) => {
                const objetivoDisplay =
                  (p.objetivos && p.objetivos.length > 0 ? p.objetivos.join(", ") : null) ||
                  p.objetivo_texto ||
                  "Objetivo não informado"

                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePatient(p)}
                    role="button"
                    tabIndex={0}
                    className="p-4 sm:px-6 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    {/* Avatar & Nome */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate flex items-center gap-2">
                          <span>{p.nome}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        
                        {/* Exibe: Objetivo */}
                        <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">Objetivo:</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {objetivoDisplay}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Exibe: Data da Última Consulta & Seta */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="hidden sm:block">
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Última Consulta
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {formatDataBr(p.ultima_consulta)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
