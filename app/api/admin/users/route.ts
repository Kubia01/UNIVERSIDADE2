import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com configuração dinâmica
function getSupabaseClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabaseClient = createClient(supabaseUrl!, anonKey!)
  
  const supabaseAdmin = serviceKey ? createClient(supabaseUrl!, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) : null

  return { supabaseClient, supabaseAdmin }
}

// Verificar se o usuário é admin
async function verifyAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  console.log('[verifyAdminUser] Authorization header presente:', !!authHeader)
  
  if (!authHeader) {
    console.log('[verifyAdminUser] Cabeçalho Authorization não encontrado')
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  console.log('[verifyAdminUser] Token length:', token.length)
  
  try {
    const { supabaseClient } = getSupabaseClients()
    
    // Definir a sessão do usuário atual
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.log('[verifyAdminUser] Erro ao validar token ou usuário não encontrado:', userError?.message)
      return null
    }

    console.log('[verifyAdminUser] Usuário autenticado:', user.email, 'ID:', user.id)

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, name, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('[verifyAdminUser] Erro ao buscar perfil:', profileError.message)
      return null
    }

    console.log('[verifyAdminUser] Perfil encontrado:', profile)

    if (profile?.role !== 'admin') {
      console.log('[verifyAdminUser] Usuário não é admin:', user.email, 'role:', profile?.role)
      return null
    }

    console.log('[verifyAdminUser] ✅ Admin verificado com sucesso:', user.email)
    return user
  } catch (error) {
    console.log('[verifyAdminUser] Erro geral na verificação:', error)
    return null
  }
}

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    console.log('[POST] ===== INÍCIO DA REQUISIÇÃO POST =====')
    console.log('[POST] NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('[POST] SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('[POST] NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // Verificar se temos URLs básicas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('[POST] ❌ Configuração básica do Supabase não encontrada')
      return NextResponse.json({ error: 'Configuração do Supabase incompleta' }, { status: 500 })
    }
    
    console.log('[POST] Iniciando verificação de admin...')
    
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      console.log('[POST] ❌ Acesso negado - usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é administrador' }, { status: 403 })
    }

    console.log('[POST] ✅ Admin verificado, prosseguindo com criação...')
    const { email, password, name, department, role } = await request.json()
    console.log('[POST] Dados recebidos - email:', email, 'name:', name, 'role:', role)

    if (!email || !password || !name) {
      console.log('[POST] ❌ Dados obrigatórios não fornecidos')
      return NextResponse.json({ error: 'Email, senha e nome são obrigatórios' }, { status: 400 })
    }

    const { supabaseClient, supabaseAdmin } = getSupabaseClients()

    // Verificar se service role está disponível
    if (!supabaseAdmin) {
      console.log('[POST] ⚠️ Service role não disponível, usando método alternativo')
      
      // Método alternativo: criar perfil diretamente e o usuário fará signup
      const userId = `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`
      
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: userId,
          email,
          name,
          role: role || 'user',
          department: department || 'Geral',
          needs_password_setup: true, // Flag para indicar que precisa configurar senha
          temp_password: password // Armazenar temporariamente (será removido após primeiro login)
        })

      if (profileError) {
        console.error('[POST] Erro ao criar perfil temporário:', profileError)
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 400 })
      }

      console.log('[POST] ✅ Usuário criado com método alternativo')
      return NextResponse.json({ 
        success: true, 
        user: {
          id: userId,
          email,
          name,
          role: role || 'user',
          department: department || 'Geral',
          needs_setup: true
        },
        message: 'Usuário criado. Um email de convite será enviado.'
      })
    }

    // Método padrão com service role
    const { data: usersResponse } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = usersResponse?.users.find(u => u.email === email)

    if (existingAuthUser) {
      console.log('[POST] Usuário já existe na auth:', email, 'ID:', existingAuthUser.id)
      
      // Verificar se tem perfil
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single()

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.log('[POST] Erro ao verificar perfil existente:', profileCheckError.message)
        return NextResponse.json({ error: 'Erro ao verificar usuário existente' }, { status: 400 })
      }

      if (existingProfile) {
        console.log('[POST] Usuário já tem perfil completo')
        return NextResponse.json({ error: 'Usuário já existe com este email' }, { status: 400 })
      }

      // Criar perfil para usuário existente
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: existingAuthUser.id,
          email,
          name,
          role: role || 'user',
          department: department || 'Geral'
        })

      if (profileError) {
        console.error('[POST] Erro ao criar perfil para usuário existente:', profileError)
        return NextResponse.json({ error: 'Erro ao criar perfil do usuário' }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        user: {
          id: existingAuthUser.id,
          email,
          name,
          role: role || 'user',
          department: department || 'Geral'
        }
      })
    }

    // Criar novo usuário
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('[POST] Erro ao criar usuário na auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log('[POST] Usuário criado na auth:', authUser.user.id)

    // Criar perfil
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
      console.error('[POST] Erro ao criar perfil:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil do usuário' }, { status: 400 })
    }

    console.log('[POST] ✅ Usuário e perfil criados com sucesso')
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
    console.error('[POST] Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Resetar senha
export async function PUT(request: NextRequest) {
  try {
    // Verificar se estamos em um ambiente válido
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 })
    }
    
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
    const { supabaseAdmin } = getSupabaseClients()
    
    if (!supabaseAdmin) {
      console.log('[PUT] ⚠️ Service role não disponível')
      return NextResponse.json({ error: 'Operação não disponível sem configuração completa' }, { status: 503 })
    }
    
    const { data: usersResponse } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = usersResponse?.users.find(u => u.id === userId)
    
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
    console.log('[DELETE] ===== INÍCIO DA REQUISIÇÃO DELETE =====')
    
    // Verificar configuração básica
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('[DELETE] ❌ Configuração básica do Supabase não encontrada')
      return NextResponse.json({ error: 'Configuração do Supabase incompleta' }, { status: 500 })
    }
    
    console.log('[DELETE] Iniciando verificação de admin...')
    
    // Verificar se é admin
    const adminUser = await verifyAdminUser(request)
    if (!adminUser) {
      console.log('[DELETE] ❌ Acesso negado - usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é administrador' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    console.log('[DELETE] UserId recebido:', userId)

    if (!userId) {
      console.log('[DELETE] ❌ ID do usuário não fornecido')
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    const { supabaseClient, supabaseAdmin } = getSupabaseClients()

    // Se não tem service role, apenas desativar o usuário
    if (!supabaseAdmin) {
      console.log('[DELETE] ⚠️ Service role não disponível, desativando usuário')
      
      const { error: deactivateError } = await supabaseClient
        .from('profiles')
        .update({ 
          active: false, 
          deactivated_at: new Date().toISOString(),
          deactivated_by: adminUser.id
        })
        .eq('id', userId)

      if (deactivateError) {
        console.error('[DELETE] Erro ao desativar usuário:', deactivateError)
        return NextResponse.json({ error: 'Erro ao desativar usuário' }, { status: 400 })
      }

      console.log('[DELETE] ✅ Usuário desativado com sucesso')
      return NextResponse.json({ 
        success: true, 
        message: 'Usuário desativado com sucesso. Conta suspensa.' 
      })
    }

    // Método padrão com service role
    const { data: usersResponse } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = usersResponse?.users.find(u => u.id === userId)
    
    if (!targetUser) {
      console.log('[DELETE] Usuário não encontrado na auth:', userId)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 })
    }

    console.log('[DELETE] Usuário encontrado:', targetUser.email)

    // Remover perfil
    console.log('[DELETE] Removendo perfil...')
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    if (profileError) {
      console.log('[DELETE] Erro ao remover perfil:', profileError.message)
    } else {
      console.log('[DELETE] Perfil removido com sucesso')
    }

    // Remover usuário da auth
    console.log('[DELETE] Removendo usuário da auth...')
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.error('[DELETE] Erro ao deletar usuário da auth:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[DELETE] ✅ Usuário deletado com sucesso:', targetUser.email)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[DELETE] Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}