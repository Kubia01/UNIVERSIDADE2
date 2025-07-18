import { supabase } from './supabase'

export async function signUp(email: string, password: string, name: string, department?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        department,
        role: 'user'
      }
    }
  })

  if (error) {
    throw error
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw error
  }

  return user
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
  })

  if (error) {
    throw error
  }
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password
  })

  if (error) {
    throw error
  }
}

export async function updateProfile(name: string, department?: string) {
  const { error } = await supabase.auth.updateUser({
    data: {
      name,
      department
    }
  })

  if (error) {
    throw error
  }
}

// Verificar se o usuário está autenticado
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Listener para mudanças no estado de autenticação
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}