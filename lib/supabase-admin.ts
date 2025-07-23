import { supabase } from './supabase'

// Função para obter o token de autenticação atual
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Função para criar usuário via API route
export async function createUserWithAuth(email: string, password: string, name: string, department?: string, role?: string) {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Token de autenticação não encontrado')
    }

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        password,
        name,
        department: department || 'Geral',
        role: role || 'user'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar usuário')
    }

    return { data: data.user, error: null }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { data: null, error }
  }
}

// Função para resetar senha via API route
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Token de autenticação não encontrado')
    }

    const response = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        password: newPassword
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao resetar senha')
    }

    return { error: null }
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return { error }
  }
}

// Função para deletar usuário via API route
export async function deleteUserFromAuth(userId: string) {
  try {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Token de autenticação não encontrado')
    }

    const response = await fetch(`/api/admin/users?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao deletar usuário')
    }

    return { error: null }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return { error }
  }
}