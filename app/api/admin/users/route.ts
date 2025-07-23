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
    console.log('[verifyAdminUser] Cabeçalho Authorization não encontrado')
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      console.log('[verifyAdminUser] Erro ao obter usuário ou usuário não encontrado:', error?.message)
      return null
    }

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('[verifyAdminUser] Erro ao buscar perfil:', profileError.message)
      return null
    }

    if (profile?.role !== 'admin') {
      console.log('[verifyAdminUser] Usuário não é admin:', user.email, 'role:', profile?.role)
      return null
    }

    console.log('[verifyAdminUser] Admin verificado:', user.email)
    return user
  } catch (error) {
    console.log('[verifyAdminUser] Erro geral:', error)
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
    console.log('[PUT] Iniciando reset de senha')
    
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      console.log('[PUT] Acesso negado - usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { userId, password } = await request.json()
    console.log('[PUT] Dados recebidos - userId:', userId, 'password length:', password?.length)

    if (!userId || !password) {
      console.log('[PUT] Dados obrigatórios não fornecidos')
      return NextResponse.json({ error: 'ID do usuário e senha são obrigatórios' }, { status: 400 })
    }

    // Verificar se o usuário existe na auth
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users.users.find(u => u.id === userId)
    
    if (!targetUser) {
      console.log('[PUT] Usuário não encontrado na auth:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    console.log('[PUT] Usuário encontrado:', targetUser.email)

    // Resetar senha usando Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password
    })

    if (error) {
      console.error('[PUT] Erro ao resetar senha:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[PUT] Senha resetada com sucesso para:', targetUser.email)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[PUT] Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE] Iniciando deleção de usuário')
    
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      console.log('[DELETE] Acesso negado - usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    console.log('[DELETE] UserId recebido:', userId)

    if (!userId) {
      console.log('[DELETE] ID do usuário não fornecido')
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário existe na auth
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users.users.find(u => u.id === userId)
    
    if (!targetUser) {
      console.log('[DELETE] Usuário não encontrado na auth:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    console.log('[DELETE] Usuário encontrado:', targetUser.email)

    // 1. Remover perfil
    console.log('[DELETE] Removendo perfil...')
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    if (profileError) {
      console.log('[DELETE] Erro ao remover perfil:', profileError.message)
    } else {
      console.log('[DELETE] Perfil removido com sucesso')
    }

    // 2. Remover usuário da auth
    console.log('[DELETE] Removendo usuário da auth...')
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('[DELETE] Erro ao deletar usuário da auth:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[DELETE] Usuário deletado com sucesso:', targetUser.email)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[DELETE] Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}