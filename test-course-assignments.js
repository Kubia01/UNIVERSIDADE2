#!/usr/bin/env node

/**
 * Script para testar a funcionalidade de atribuição de cursos
 * Execute: node test-course-assignments.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testCourseAssignments = async () => {
  console.log('🧪 Testando funcionalidade de atribuição de cursos...\n')

  try {
    // 1. Testar se a tabela existe
    console.log('1️⃣ Verificando se a tabela course_assignments existe...')
    const { data: assignments, error: tableError } = await supabase
      .from('course_assignments')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.code === '42P01') {
      console.log('❌ Tabela course_assignments não existe!')
      console.log('📋 Execute primeiro: node setup-course-assignments.js')
      return
    } else if (tableError) {
      console.log('⚠️ Erro ao acessar tabela:', tableError.message)
    } else {
      console.log('✅ Tabela course_assignments existe e está acessível')
    }

    // 2. Testar se há usuários
    console.log('\n2️⃣ Verificando usuários disponíveis...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .limit(5)
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message)
      return
    }
    
    console.log(`✅ Encontrados ${users?.length || 0} usuários`)
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role}`)
      })
    }

    // 3. Testar se há cursos
    console.log('\n3️⃣ Verificando cursos disponíveis...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, type')
      .limit(5)
    
    if (coursesError) {
      console.log('❌ Erro ao buscar cursos:', coursesError.message)
      return
    }
    
    console.log(`✅ Encontrados ${courses?.length || 0} cursos`)
    if (courses && courses.length > 0) {
      courses.forEach(course => {
        console.log(`   - ${course.title} (${course.type})`)
      })
    }

    // 4. Verificar atribuições existentes
    console.log('\n4️⃣ Verificando atribuições existentes...')
    const { data: existingAssignments, error: assignError } = await supabase
      .from('course_assignments')
      .select(`
        id,
        assigned_at,
        profiles:user_id(name, email),
        courses:course_id(title)
      `)
      .limit(10)
    
    if (assignError) {
      console.log('⚠️ Erro ao buscar atribuições:', assignError.message)
    } else {
      console.log(`✅ Encontradas ${existingAssignments?.length || 0} atribuições`)
      if (existingAssignments && existingAssignments.length > 0) {
        existingAssignments.forEach(assignment => {
          console.log(`   - ${assignment.profiles?.name} -> ${assignment.courses?.title}`)
        })
      }
    }

    // 5. Verificar políticas de segurança
    console.log('\n5️⃣ Verificando políticas de segurança...')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'course_assignments')
    
    if (policyError) {
      console.log('⚠️ Não foi possível verificar políticas:', policyError.message)
    } else {
      console.log(`✅ Encontradas ${policies?.length || 0} políticas de segurança`)
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}`)
        })
      }
    }

    console.log('\n🎉 Teste concluído com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`   • Usuários: ${users?.length || 0}`)
    console.log(`   • Cursos: ${courses?.length || 0}`)
    console.log(`   • Atribuições: ${existingAssignments?.length || 0}`)
    console.log(`   • Políticas: ${policies?.length || 0}`)
    
    if (users?.length === 0) {
      console.log('\n⚠️ Aviso: Nenhum usuário encontrado. Crie usuários primeiro.')
    }
    
    if (courses?.length === 0) {
      console.log('\n⚠️ Aviso: Nenhum curso encontrado. Crie cursos primeiro.')
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

// Executar o teste
testCourseAssignments()
  .then(() => {
    console.log('\n✅ Teste finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })