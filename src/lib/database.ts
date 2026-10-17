import { neon } from "@neondatabase/serverless"

// Connection string to Neon PostgreSQL
const databaseUrl =
  import.meta.env.VITE_DATABASE_URL ||
  "postgresql://neondb_owner:npg_p5fhUq7eWwTm@ep-wild-credit-b6mx60wd.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require"

export const sql = neon(databaseUrl)

export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at: string
  // Virtual computed field from latest consultation
  ultima_consulta?: string | null
}

export interface Consulta {
  id: string
  paciente_id: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at: string
}

export interface PacienteSemRetorno {
  id: string
  nome: string
  whatsapp?: string | null
  email?: string | null
  ultima_consulta: string
  dias_sem_consulta: number
  proximo_retorno?: string | null
}

export interface DashboardMetrics {
  totalPacientes: number
  consultasSemana: number
  pacientesSemRetorno: PacienteSemRetorno[]
}

/**
 * Neon Database Service for Nutrica
 * Uses transactional context to enforce Nutricionista isolation with RLS
 */
export class DatabaseService {
  /**
   * Execute transactional query isolating the current nutricionista
   */
  static async withUser<T>(
    nutricionistaId: string,
    callback: (sqlClient: typeof sql) => Promise<T>
  ): Promise<T> {
    await sql.transaction((tx: any) => [
      tx(`SELECT set_config('app.current_user_id', '${nutricionistaId}', true)`),
    ])
    return callback(sql)
  }

  /**
   * Fetch real-time dashboard metrics for the logged-in nutricionista
   */
  static async getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
    try {
      const results = await sql.transaction((tx: any) => [
        // 1. Set isolation context for RLS
        tx(`SELECT set_config('app.current_user_id', '${nutricionistaId}', true)`),

        // 2. Total active patients of this nutricionista
        tx(`
          SELECT COUNT(*)::int as total
          FROM pacientes
          WHERE nutricionista_id = '${nutricionistaId}'
        `),

        // 3. Consultations of the current week (Monday to Sunday)
        tx(`
          SELECT COUNT(*)::int as total
          FROM consultas c
          JOIN pacientes p ON p.id = c.paciente_id
          WHERE p.nutricionista_id = '${nutricionistaId}'
            AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
            AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days 23 hours 59 mins')
        `),

        // 4. Patients without return: last consultation > 30 days ago and no upcoming return scheduled
        tx(`
          SELECT 
            p.id,
            p.nome,
            p.whatsapp,
            p.email,
            latest.ultima_consulta,
            (CURRENT_DATE - latest.ultima_consulta::date)::int as dias_sem_consulta,
            latest.proximo_retorno
          FROM pacientes p
          JOIN LATERAL (
            SELECT c.data_consulta as ultima_consulta, c.proximo_retorno
            FROM consultas c
            WHERE c.paciente_id = p.id
            ORDER BY c.data_consulta DESC
            LIMIT 1
          ) latest ON true
          WHERE p.nutricionista_id = '${nutricionistaId}'
            AND latest.ultima_consulta < CURRENT_DATE - INTERVAL '30 days'
            AND (latest.proximo_retorno IS NULL OR latest.proximo_retorno <= CURRENT_DATE)
          ORDER BY latest.ultima_consulta ASC
        `)
      ])

      const totalPacientes = results[1]?.[0]?.total || 0
      const consultasSemana = results[2]?.[0]?.total || 0
      const pacientesSemRetornoRaw = results[3] || []

      const normalizeDate = (val: any): string | null => {
        if (!val) return null
        if (val instanceof Date) return val.toISOString().split("T")[0]
        return String(val)
      }

      const pacientesSemRetorno: PacienteSemRetorno[] = pacientesSemRetornoRaw.map((row: any) => ({
        id: String(row.id),
        nome: String(row.nome || ""),
        whatsapp: row.whatsapp ? String(row.whatsapp) : null,
        email: row.email ? String(row.email) : null,
        ultima_consulta: normalizeDate(row.ultima_consulta) || "",
        dias_sem_consulta: Number(row.dias_sem_consulta || 0),
        proximo_retorno: normalizeDate(row.proximo_retorno),
      }))

      return {
        totalPacientes,
        consultasSemana,
        pacientesSemRetorno,
      }
    } catch (error) {
      console.error("Erro ao carregar métricas do dashboard no Neon:", error)
      return {
        totalPacientes: 0,
        consultasSemana: 0,
        pacientesSemRetorno: [],
      }
    }
  }

  /**
   * Fetch all patients for the nutricionista including latest consultation date
   */
  static async getPacientes(nutricionistaId: string): Promise<Paciente[]> {
    try {
      const results = await sql.transaction((tx: any) => [
        tx(`SELECT set_config('app.current_user_id', '${nutricionistaId}', true)`),
        tx(`
          SELECT 
            p.*,
            (
              SELECT c.data_consulta 
              FROM consultas c 
              WHERE c.paciente_id = p.id 
              ORDER BY c.data_consulta DESC 
              LIMIT 1
            ) as ultima_consulta
          FROM pacientes p
          WHERE p.nutricionista_id = '${nutricionistaId}'
          ORDER BY p.nome ASC
        `)
      ])
      const rawList = results[1] || []
      const normalizeDate = (val: any): string | null => {
        if (!val) return null
        if (val instanceof Date) return val.toISOString().split("T")[0]
        return String(val)
      }

      return rawList.map((p: any) => ({
        ...p,
        id: String(p.id),
        nome: String(p.nome || ""),
        data_nascimento: normalizeDate(p.data_nascimento),
        created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at || ""),
        ultima_consulta: normalizeDate(p.ultima_consulta),
      })) as Paciente[]
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error)
      return []
    }
  }

  /**
   * Create new complete patient
   */
  static async createPaciente(
    nutricionistaId: string,
    data: Partial<Paciente>
  ): Promise<Paciente | null> {
    try {
      const id = crypto.randomUUID()

      const formatArray = (arr?: string[] | null) => {
        if (!arr || arr.length === 0) return "'{}'"
        const escaped = arr.map((item) => `"${item.replace(/"/g, '\\"')}"`).join(",")
        return `'{${escaped}}'`
      }

      const results = await sql.transaction((tx: any) => [
        tx(`SELECT set_config('app.current_user_id', '${nutricionistaId}', true)`),
        tx(`
          INSERT INTO pacientes (
            id,
            nutricionista_id,
            nome,
            data_nascimento,
            sexo,
            telefone,
            whatsapp,
            email,
            peso_inicial,
            altura,
            objetivos,
            objetivo_texto,
            nivel_atividade,
            patologias,
            restricoes_alimentares,
            alergias,
            medicamentos,
            suplementos,
            refeicoes_por_dia,
            horario_acorda,
            horario_dorme,
            litros_agua,
            atividade_fisica,
            atividade_fisica_descricao,
            observacoes
          ) VALUES (
            '${id}',
            '${nutricionistaId}',
            '${data.nome?.replace(/'/g, "''")}',
            ${data.data_nascimento ? `'${data.data_nascimento}'` : "NULL"},
            ${data.sexo ? `'${data.sexo.replace(/'/g, "''")}'` : "NULL"},
            ${data.telefone ? `'${data.telefone.replace(/'/g, "''")}'` : "NULL"},
            ${data.whatsapp ? `'${data.whatsapp.replace(/'/g, "''")}'` : "NULL"},
            ${data.email ? `'${data.email.replace(/'/g, "''")}'` : "NULL"},
            ${data.peso_inicial != null && !isNaN(Number(data.peso_inicial)) ? Number(data.peso_inicial) : "NULL"},
            ${data.altura != null && !isNaN(Number(data.altura)) ? Number(data.altura) : "NULL"},
            ${formatArray(data.objetivos)},
            ${data.objetivo_texto ? `'${data.objetivo_texto.replace(/'/g, "''")}'` : "NULL"},
            ${data.nivel_atividade ? `'${data.nivel_atividade.replace(/'/g, "''")}'` : "NULL"},
            ${formatArray(data.patologias)},
            ${formatArray(data.restricoes_alimentares)},
            ${formatArray(data.alergias)},
            ${data.medicamentos ? `'${data.medicamentos.replace(/'/g, "''")}'` : "NULL"},
            ${data.suplementos ? `'${data.suplementos.replace(/'/g, "''")}'` : "NULL"},
            ${data.refeicoes_por_dia != null && !isNaN(Number(data.refeicoes_por_dia)) ? Number(data.refeicoes_por_dia) : "NULL"},
            ${data.horario_acorda ? `'${data.horario_acorda.replace(/'/g, "''")}'` : "NULL"},
            ${data.horario_dorme ? `'${data.horario_dorme.replace(/'/g, "''")}'` : "NULL"},
            ${data.litros_agua != null && !isNaN(Number(data.litros_agua)) ? Number(data.litros_agua) : "NULL"},
            ${data.atividade_fisica != null ? Boolean(data.atividade_fisica) : "NULL"},
            ${data.atividade_fisica_descricao ? `'${data.atividade_fisica_descricao.replace(/'/g, "''")}'` : "NULL"},
            ${data.observacoes ? `'${data.observacoes.replace(/'/g, "''")}'` : "NULL"}
          )
          RETURNING *
        `)
      ])
      return (results[1]?.[0] as Paciente) || null
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error)
      return null
    }
  }

  /**
   * Helper to register a consultation
   */
  static async createConsulta(
    nutricionistaId: string,
    pacienteId: string,
    consultaData: Partial<Consulta>
  ): Promise<Consulta | null> {
    try {
      const id = crypto.randomUUID()
      const results = await sql.transaction((tx: any) => [
        tx(`SELECT set_config('app.current_user_id', '${nutricionistaId}', true)`),
        tx(`
          INSERT INTO consultas (
            id,
            paciente_id,
            data_consulta,
            peso,
            cintura,
            quadril,
            percentual_gordura,
            observacoes,
            proximo_retorno
          ) VALUES (
            '${id}',
            '${pacienteId}',
            '${consultaData.data_consulta}',
            ${consultaData.peso ?? "NULL"},
            ${consultaData.cintura ?? "NULL"},
            ${consultaData.quadril ?? "NULL"},
            ${consultaData.percentual_gordura ?? "NULL"},
            ${consultaData.observacoes ? `'${consultaData.observacoes.replace(/'/g, "''")}'` : "NULL"},
            ${consultaData.proximo_retorno ? `'${consultaData.proximo_retorno}'` : "NULL"}
          )
          RETURNING *
        `)
      ])
      return (results[1]?.[0] as Consulta) || null
    } catch (error) {
      console.error("Erro ao cadastrar consulta:", error)
      return null
    }
  }
}
