import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { DatabaseService, Paciente } from "@/lib/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Check, 
  User, 
  Activity, 
  Clock, 
  Plus, 
  Sparkles, 
  AlertCircle
} from "lucide-react"

interface NovoPacienteFormProps {
  onSuccess: (paciente: Paciente) => void
  onCancel: () => void
}

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal")
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // --- ABA 1: PESSOAL ---
  const [nome, setNome] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [sexo, setSexo] = useState<string>("")
  const [telefone, setTelefone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")

  // --- ABA 2: CLÍNICO ---
  const [pesoAtual, setPesoAtual] = useState("")
  const [alturaCm, setAlturaCm] = useState("")
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([])
  const [objetivoLivre, setObjetivoLivre] = useState("")
  const [nivelAtividade, setNivelAtividade] = useState("")
  
  const [patologias, setPatologias] = useState<string[]>([])
  const [novaPatologia, setNovaPatologia] = useState("")

  const [restricoes, setRestricoes] = useState<string[]>([])
  const [novaRestricao, setNovaRestricao] = useState("")

  const [alergias, setAlergias] = useState<string[]>([])
  const [novaAlergia, setNovaAlergia] = useState("")

  const [medicamentos, setMedicamentos] = useState("")
  const [suplementos, setSuplementos] = useState("")

  // --- ABA 3: HÁBITOS ---
  const [refeicoesPorDia, setRefeicoesPorDia] = useState("")
  const [horarioAcorda, setHorarioAcorda] = useState("")
  const [horarioDorme, setHorarioDorme] = useState("")
  const [litrosAgua, setLitrosAgua] = useState("")
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null)
  const [atividadeDescricao, setAtividadeDescricao] = useState("")
  const [observacoes, setObservacoes] = useState("")

  // Formatações auxiliares
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "")
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim()
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim()
  }

  // Idade calculada automaticamente a partir da data de nascimento
  const calcularIdade = (dataNasc: string): number | null => {
    if (!dataNasc) return null
    try {
      const birth = new Date(dataNasc)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age >= 0 ? age : null
    } catch {
      return null
    }
  }

  // Cálculo de IMC automático: peso(kg) / (altura(m)²)
  const calcularImc = () => {
    const p = parseFloat(pesoAtual)
    const altCm = parseFloat(alturaCm)
    if (!p || !altCm || altCm <= 0) return null
    const altM = altCm / 100
    const imc = p / (altM * altM)
    return isFinite(imc) ? imc.toFixed(1) : null
  }

  const getImcClassificacao = (imcNum: number) => {
    if (imcNum < 18.5) return { texto: "Abaixo do peso", cor: "text-amber-600 bg-amber-50" }
    if (imcNum < 24.9) return { texto: "Peso normal", cor: "text-emerald-700 bg-emerald-50" }
    if (imcNum < 29.9) return { texto: "Sobrepeso", cor: "text-amber-700 bg-amber-50" }
    return { texto: "Obesidade", cor: "text-red-700 bg-red-50" }
  }

  // Conversão inteligente de horário digitado (ex: 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30)
  const formatarHorario = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (!clean) return ""
    if (clean.length === 1 || clean.length === 2) {
      const h = parseInt(clean, 10)
      if (h >= 0 && h <= 23) {
        return `${String(h).padStart(2, "0")}:00`
      }
    } else if (clean.length === 3) {
      const h = parseInt(clean.substring(0, 1), 10)
      const m = parseInt(clean.substring(1, 3), 10)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    } else if (clean.length >= 4) {
      const h = parseInt(clean.substring(0, 2), 10)
      const m = parseInt(clean.substring(2, 4), 10)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    }
    return val
  }

  // Helper de toggle para múltipla escolha com regra "Nenhum"
  const toggleSelectionWithNenhum = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === "Nenhum") {
      if (currentList.includes("Nenhum")) {
        setList([])
      } else {
        setList(["Nenhum"])
      }
      return
    }

    const withoutNenhum = currentList.filter((x) => x !== "Nenhum")
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((x) => x !== item))
    } else {
      setList([...withoutNenhum, item])
    }
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!user?.id) {
      setErrorMessage("Sessão expirada. Por favor faça login novamente.")
      return
    }

    if (!nome.trim()) {
      setActiveTab("pessoal")
      setErrorMessage("O campo Nome Completo é obrigatório.")
      return
    }

    setSaving(true)
    try {
      const altM = alturaCm ? parseFloat(alturaCm) / 100 : null

      const created = await DatabaseService.createPaciente(user.id, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        email: email.trim() || null,
        peso_inicial: pesoAtual ? parseFloat(pesoAtual) : null,
        altura: altM,
        objetivos: objetivosSelecionados,
        objetivo_texto: objetivoLivre.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias,
        restricoes_alimentares: restricoes,
        alergias,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda || null,
        horario_dorme: horarioDorme || null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() : null,
        observacoes: observacoes.trim() || null,
      })

      if (created) {
        onSuccess(created)
      } else {
        setErrorMessage("Não foi possível cadastrar o paciente. Tente novamente.")
      }
    } catch (err: any) {
      console.error("Erro no cadastro:", err)
      setErrorMessage(err?.message || "Ocorreu um erro ao salvar os dados no Neon.")
    } finally {
      setSaving(false)
    }
  }

  const idadeCalculada = calcularIdade(dataNascimento)
  const imcCalculado = calcularImc()
  const imcInfo = imcCalculado ? getImcClassificacao(parseFloat(imcCalculado)) : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header bar com voltar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a lista
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Cadastrar Novo Paciente
            </h1>
            <p className="text-xs text-slate-500">
              Preencha o formulário clínico estruturado para salvar no banco Neon.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/70">
        <button
          type="button"
          onClick={() => setActiveTab("pessoal")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "pessoal"
              ? "bg-white text-emerald-800 shadow-sm border border-emerald-200/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4" />
          <span>1. Pessoal</span>
          {nome.trim() && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("clinico")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "clinico"
              ? "bg-white text-emerald-800 shadow-sm border border-emerald-200/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>2. Clínico</span>
          {(pesoAtual || alturaCm || objetivosSelecionados.length > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("habitos")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "habitos"
              ? "bg-white text-emerald-800 shadow-sm border border-emerald-200/50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>3. Hábitos</span>
          {(refeicoesPorDia || litrosAgua) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            
            {/* ============================================================== */}
            {/* ABA 1 — PESSOAL */}
            {/* ============================================================== */}
            {activeTab === "pessoal" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Dados Pessoais
                  </h3>
                  <p className="text-xs text-slate-500">
                    Informações básicas e contato do paciente.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Carolina Almeida Prado"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  {/* Data de Nascimento & Sexo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Data de Nascimento
                        </label>
                        {idadeCalculada !== null && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {idadeCalculada} anos
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Sexo
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Feminino", "Masculino", "Outro"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSexo(s)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                              sexo === s
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contato: Telefone, WhatsApp, E-mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        placeholder="(11) 3456-7890"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                        placeholder="(11) 98765-4321"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="paciente@exemplo.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("clinico")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm"
                  >
                    Avançar para Clínico &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ABA 2 — CLÍNICO */}
            {/* ============================================================== */}
            {activeTab === "clinico" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Histórico Clínico e Antropometria
                  </h3>
                  <p className="text-xs text-slate-500">
                    Medidas corporais, condições patológicas e restrições.
                  </p>
                </div>

                {/* Medidas: Peso, Altura, IMC automático */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Peso Atual
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={pesoAtual}
                        onChange={(e) => setPesoAtual(e.target.value)}
                        placeholder="70.5"
                        className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-800"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Altura
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        placeholder="170"
                        className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-800"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      IMC (Automático)
                    </label>
                    <div className="h-[42px] px-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">
                        {imcCalculado ? `${imcCalculado} kg/m²` : "—"}
                      </span>
                      {imcInfo && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${imcInfo.cor}`}>
                          {imcInfo.texto}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivo */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Objetivo do Paciente (Múltipla escolha)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Emagrecer",
                      "Ganhar massa",
                      "Controlar diabetes",
                      "Saúde geral",
                      "Performance esportiva",
                      "Reeducação alimentar"
                    ].map((obj) => {
                      const isSelected = objetivosSelecionados.includes(obj)
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setObjetivosSelecionados(objetivosSelecionados.filter((o) => o !== obj))
                            } else {
                              setObjetivosSelecionados([...objetivosSelecionados, obj])
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected && <Check className="inline h-3.5 w-3.5 mr-1" />}
                          {obj}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="text"
                    value={objetivoLivre}
                    onChange={(e) => setObjetivoLivre(e.target.value)}
                    placeholder="Adicionar detalhes ou outro objetivo específico..."
                    className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Nível de atividade física */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nível de Atividade Física (Seleção única)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      "Sedentário",
                      "Levemente ativo",
                      "Moderadamente ativo",
                      "Muito ativo",
                      "Extremamente ativo"
                    ].map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => setNivelAtividade(nivel)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                          nivelAtividade === nivel
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias ou condições de saúde */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Patologias ou Condições de Saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Nenhum",
                      "Diabetes",
                      "Hipertensão",
                      "Hipotireoidismo",
                      "Hipertireoidismo",
                      "Síndrome do ovário policístico",
                      "Doença celíaca",
                      "Colesterol alto"
                    ].map((p) => {
                      const isSelected = patologias.includes(p)
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleSelectionWithNenhum(patologias, setPatologias, p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? p === "Nenhum"
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected && <Check className="inline h-3.5 w-3.5 mr-1" />}
                          {p}
                        </button>
                      )
                    })}
                  </div>
                  {/* Custom Patologias adicionadas */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={novaPatologia}
                      onChange={(e) => setNovaPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (novaPatologia.trim()) {
                            setPatologias(patologias.filter((x) => x !== "Nenhum").concat(novaPatologia.trim()))
                            setNovaPatologia("")
                          }
                        }
                      }}
                      placeholder="Digitar outra patologia e pressionar enter ou +"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (novaPatologia.trim()) {
                          setPatologias(patologias.filter((x) => x !== "Nenhum").concat(novaPatologia.trim()))
                          setNovaPatologia("")
                        }
                      }}
                      className="rounded-xl border-slate-200"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Nenhum", "Lactose", "Glúten", "Açúcar", "Carne vermelha", "Frutos do mar"].map((r) => {
                      const isSelected = restricoes.includes(r)
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleSelectionWithNenhum(restricoes, setRestricoes, r)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? r === "Nenhum"
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected && <Check className="inline h-3.5 w-3.5 mr-1" />}
                          {r}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={novaRestricao}
                      onChange={(e) => setNovaRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (novaRestricao.trim()) {
                            setRestricoes(restricoes.filter((x) => x !== "Nenhum").concat(novaRestricao.trim()))
                            setNovaRestricao("")
                          }
                        }
                      }}
                      placeholder="Adicionar outra restrição alimentar..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (novaRestricao.trim()) {
                          setRestricoes(restricoes.filter((x) => x !== "Nenhum").concat(novaRestricao.trim()))
                          setNovaRestricao("")
                        }
                      }}
                      className="rounded-xl border-slate-200"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias Alimentares */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Alergias Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Nenhum", "Amendoim", "Leite", "Ovo", "Soja", "Trigo", "Frutos do mar"].map((a) => {
                      const isSelected = alergias.includes(a)
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleSelectionWithNenhum(alergias, setAlergias, a)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? a === "Nenhum"
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected && <Check className="inline h-3.5 w-3.5 mr-1" />}
                          {a}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={novaAlergia}
                      onChange={(e) => setNovaAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (novaAlergia.trim()) {
                            setAlergias(alergias.filter((x) => x !== "Nenhum").concat(novaAlergia.trim()))
                            setNovaAlergia("")
                          }
                        }
                      }}
                      placeholder="Adicionar outra alergia alimentar..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (novaAlergia.trim()) {
                          setAlergias(alergias.filter((x) => x !== "Nenhum").concat(novaAlergia.trim()))
                          setNovaAlergia("")
                        }
                      }}
                      className="rounded-xl border-slate-200"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Medicamentos Contínuos
                    </label>
                    <textarea
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      placeholder="Ex: Metformina 500mg (1x ao dia), Levotiroxina 50mcg..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Suplementos em Uso
                    </label>
                    <textarea
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      placeholder="Ex: Whey protein isolado, Creatina 5g, Vitamina D 2000UI..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("pessoal")}
                    className="rounded-xl border-slate-200"
                  >
                    &larr; Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("habitos")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm"
                  >
                    Avançar para Hábitos &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ABA 3 — HÁBITOS */}
            {/* ============================================================== */}
            {activeTab === "habitos" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Hábitos de Vida e Rotina
                  </h3>
                  <p className="text-xs text-slate-500">
                    Horários, ingestão hídrica, atividade física e observações.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Refeições por dia */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quantas refeições faz por dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      placeholder="Ex: 4"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Litros de água */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quantidade de água por dia
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        placeholder="Ex: 2.5"
                        className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        litros
                      </span>
                    </div>
                  </div>

                  {/* Horário que acorda com conversão automática */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Horário que acorda
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Ex: 6 → 06:00 | 630 → 06:30
                      </span>
                    </div>
                    <input
                      type="text"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => setHorarioAcorda(formatarHorario(horarioAcorda))}
                      placeholder="06:30"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Horário que dorme com conversão automática */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Horário que dorme
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Ex: 23 → 23:00 | 2230 → 22:30
                      </span>
                    </div>
                    <input
                      type="text"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => setHorarioDorme(formatarHorario(horarioDorme))}
                      placeholder="23:00"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Pratica Atividade Física */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pratica atividade física?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPraticaAtividade(true)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        praticaAtividade === true
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPraticaAtividade(false)
                        setAtividadeDescricao("")
                      }}
                      className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        praticaAtividade === false
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {praticaAtividade === true && (
                    <div className="pt-2 animate-in fade-in">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Qual atividade e frequência semanal?
                      </label>
                      <input
                        type="text"
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                        placeholder="Ex: Musculação 4x na semana e corrida aos sábados"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Observações Gerais (Texto livre)
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Comentários adicionais da anamnese, preferências, rotina de trabalho..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("clinico")}
                    className="rounded-xl border-slate-200"
                  >
                    &larr; Voltar
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="rounded-xl border-slate-200"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md px-6 text-sm font-bold"
                    >
                      {saving ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Salvando no Neon...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Salvar Paciente
                        </>
                      )}
                    </Button>
                  </div>
                </div>

              </div>
            )}

          </CardContent>
        </Card>
      </form>
    </div>
  )
}
