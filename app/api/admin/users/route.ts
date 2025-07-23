import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com Service Role Key (apenas no servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Verificar se o usuário é admin
async function verifyAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      return null
    }

    // Verificar se é admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { email, password, name, department, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 })
    }

    // 1. Criar usuário na autenticação
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('Erro ao criar usuário na auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        name,
        role: role || 'user',
        department: department || 'Geral'
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      // Se falhar ao criar perfil, remover usuário da auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil do usuário' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: authUser.user.id,
        email,
        name,
        role: role || 'user',
        department: department || 'Geral'
      }
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Resetar senha
export async function PUT(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: 'ID do usuário e senha são obrigatórios' }, { status: 400 })
    }

    // Resetar senha usando Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password
    })

    if (error) {
      console.error('Erro ao resetar senha:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    // 1. Remover perfil
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 2. Remover usuário da auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Erro ao deletar usuário:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}