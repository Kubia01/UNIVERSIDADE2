import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente admin para operações que requerem privilégios elevados
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Função para criar usuário com tratamento de erro robusto
export async function createUserWithAuth(email: string, password: string) {
  try {
    // Tentar usar o Admin API se disponível
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (error) {
      console.error('Erro no Admin API:', error)
      
      // Fallback: tentar criar usuário normal e depois confirmar
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
        email,
        password
      })

      if (signUpError) {
        throw signUpError
      }

      return { data: signUpData, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { data: null, error }
  }
}

// Função para resetar senha com tratamento de erro robusto
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    // Tentar usar o Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return { error }
  }
}

// Função para deletar usuário com tratamento de erro robusto
export async function deleteUserFromAuth(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error('Erro ao deletar usuário da auth:', error)
    }

    return { error }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return { error }
  }
}