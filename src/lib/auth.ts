/**
 * Neon Auth & Nutricionista service
 */

export interface NutricionistaUser {
  id: string
  nome: string
  email: string
  created_at?: string
  token?: string
}

export interface AuthResponse {
  user: NutricionistaUser | null
  error: string | null
}

const STORAGE_KEY = "nutrisystem_auth_session"
const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || "https://ep-wild-credit-b6mx60wd.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth"

export class AuthService {
  /**
   * Retrieves active session from localStorage
   */
  static getStoredSession(): NutricionistaUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return null
      return JSON.parse(data) as NutricionistaUser
    } catch {
      return null
    }
  }

  /**
   * Saves active session to localStorage
   */
  static setStoredSession(user: NutricionistaUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }

  /**
   * Clears session from localStorage
   */
  static clearStoredSession() {
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Sign in with Email and Password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase()
    
    if (!cleanEmail || !password) {
      return { user: null, error: "Por favor, preencha todos os campos." }
    }

    if (password.length < 9) {
      return { user: null, error: "A senha deve ter no mínimo 9 caracteres." }
    }

    try {
      // 1. Try Neon Auth endpoint (Better Auth / Neon Auth)
      const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
        }),
      }).catch(() => null)

      if (response && response.ok) {
        const data = await response.json()
        const userObj = data.user || data
        const loggedUser: NutricionistaUser = {
          id: userObj.id || crypto.randomUUID(),
          nome: userObj.name || userObj.nome || cleanEmail.split("@")[0],
          email: cleanEmail,
          created_at: userObj.createdAt || new Date().toISOString(),
          token: data.token || data.session?.token,
        }
        this.setStoredSession(loggedUser)
        return { user: loggedUser, error: null }
      }

      // Check if user was previously registered in local cache or fallback
      const registeredUsers = this.getRegisteredUsers()
      const existing = registeredUsers.find(
        (u) => u.email === cleanEmail && u.passwordHash === btoa(password)
      )

      if (existing) {
        const loggedUser: NutricionistaUser = {
          id: existing.id,
          nome: existing.nome,
          email: existing.email,
          created_at: existing.created_at,
        }
        this.setStoredSession(loggedUser)
        return { user: loggedUser, error: null }
      }

      // If user exists with different password
      const userWithEmail = registeredUsers.find((u) => u.email === cleanEmail)
      if (userWithEmail) {
        return { user: null, error: "Senha incorreta. Verifique os dados digitados e tente novamente." }
      }

      return {
        user: null,
        error: "E-mail não cadastrado ou credenciais inválidas. Verifique seu e-mail e senha.",
      }
    } catch (err: any) {
      return {
        user: null,
        error: "Ocorreu um erro ao tentar entrar. Verifique sua conexão e tente novamente.",
      }
    }
  }

  /**
   * Sign up (Register) new Nutricionista
   */
  static async signUp(
    nome: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<AuthResponse> {
    const cleanNome = nome.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanNome) {
      return { user: null, error: "Por favor, informe seu nome completo." }
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { user: null, error: "Por favor, informe um e-mail válido." }
    }

    if (password.length < 9) {
      return { user: null, error: "A senha deve ter no mínimo 9 caracteres." }
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { user: null, error: "As senhas não coincidem. Verifique e tente novamente." }
    }

    try {
      // 1. Check if email already registered locally
      const registeredUsers = this.getRegisteredUsers()
      if (registeredUsers.some((u) => u.email === cleanEmail)) {
        return {
          user: null,
          error: "Este e-mail já está cadastrado no sistema. Faça login ou use outro e-mail.",
        }
      }

      let userId = crypto.randomUUID()
      let createdAt = new Date().toISOString()
      let token: string | undefined = undefined

      // 2. Try Neon Auth API
      const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanNome,
          email: cleanEmail,
          password: password,
        }),
      }).catch(() => null)

      if (response && response.ok) {
        const data = await response.json()
        const userObj = data.user || data
        if (userObj.id) userId = userObj.id
        if (userObj.createdAt) createdAt = userObj.createdAt
        token = data.token || data.session?.token
      }

      // 3. Save Nutricionista profile record
      const newUser: NutricionistaUser = {
        id: userId,
        nome: cleanNome,
        email: cleanEmail,
        created_at: createdAt,
        token,
      }

      // Save into Neon database nutricionistas table
      try {
        const { sql } = await import("@/lib/database")
        await sql`
          INSERT INTO nutricionistas (id, nome, email, created_at)
          VALUES (${userId}, ${cleanNome}, ${cleanEmail}, ${createdAt})
          ON CONFLICT (id) DO UPDATE SET nome = ${cleanNome}
        `
      } catch (dbErr) {
        console.warn("Neon direct insert warning (will fallback to local cache):", dbErr)
      }

      // Store in users registry
      registeredUsers.push({
        ...newUser,
        passwordHash: btoa(password),
      })
      localStorage.setItem("nutrisystem_users_db", JSON.stringify(registeredUsers))

      // Set active session
      this.setStoredSession(newUser)

      return { user: newUser, error: null }
    } catch (err: any) {
      return {
        user: null,
        error: "Não foi possível concluir o cadastro no momento. Tente novamente.",
      }
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      await fetch(`${NEON_AUTH_URL}/sign-out`, {
        method: "POST",
      }).catch(() => {})
    } finally {
      this.clearStoredSession()
    }
  }

  private static getRegisteredUsers(): Array<NutricionistaUser & { passwordHash: string }> {
    try {
      const data = localStorage.getItem("nutrisystem_users_db")
      if (!data) return []
      return JSON.parse(data)
    } catch {
      return []
    }
  }
}
