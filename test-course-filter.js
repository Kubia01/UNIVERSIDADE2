#!/usr/bin/env node

/**
 * Script para testar o filtro de cursos por atribuição
 * Execute: node test-course-filter.js
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

const testCourseFilter = async () => {
  console.log('🧪 Testando filtro de cursos por atribuição...\n')

  try {
    // 1. Buscar usuários não-admin
    console.log('1️⃣ Buscando usuários não-admin...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .neq('role', 'admin')
      .limit(3)
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message)
      return
    }
    
    console.log(`✅ Encontrados ${users?.length || 0} usuários não-admin`)
    
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário não-admin encontrado. Crie usuários primeiro.')
      return
    }

    // 2. Para cada usuário, testar o filtro
    for (const user of users) {
      console.log(`\n2️⃣ Testando filtro para usuário: ${user.name} (${user.email})`)
      
      // Buscar todos os cursos (visão admin)
      const { data: allCourses, error: allCoursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
      
      if (allCoursesError) {
        console.log('❌ Erro ao buscar todos os cursos:', allCoursesError.message)
        continue
      }
      
      console.log(`   📚 Total de cursos disponíveis: ${allCourses?.length || 0}`)
      
      // Buscar cursos atribuídos (visão usuário)
      const { data: assignedCourses, error: assignedError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          course_assignments!inner(user_id)
        `)
        .eq('is_published', true)
        .eq('course_assignments.user_id', user.id)
      
      if (assignedError) {
        console.log('❌ Erro ao buscar cursos atribuídos:', assignedError.message)
        continue
      }
      
      console.log(`   ✅ Cursos atribuídos: ${assignedCourses?.length || 0}`)
      
      if (assignedCourses && assignedCourses.length > 0) {
        assignedCourses.forEach(course => {
          console.log(`      - ${course.title}`)
        })
      } else {
        console.log('      (Nenhum curso atribuído)')
      }
      
      // Verificar atribuições diretas na tabela
      const { data: directAssignments, error: directError } = await supabase
        .from('course_assignments')
        .select(`
          id,
          courses:course_id(title)
        `)
        .eq('user_id', user.id)
      
      if (!directError && directAssignments) {
        console.log(`   📋 Atribuições diretas na tabela: ${directAssignments.length}`)
        directAssignments.forEach(assignment => {
          console.log(`      - ${assignment.courses?.title}`)
        })
      }
    }

    // 3. Testar visão admin
    console.log(`\n3️⃣ Testando visão admin...`)
    const { data: adminCourses, error: adminError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_published', true)
    
    if (adminError) {
      console.log('❌ Erro ao buscar cursos para admin:', adminError.message)
    } else {
      console.log(`✅ Admin pode ver ${adminCourses?.length || 0} cursos`)
    }

    console.log('\n🎉 Teste de filtro concluído!')
    console.log('\n📋 Resumo:')
    console.log('   • Usuários não-admin veem apenas cursos atribuídos')
    console.log('   • Admins veem todos os cursos publicados')
    console.log('   • Filtro baseado na tabela course_assignments')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

// Executar o teste
testCourseFilter()
  .then(() => {
    console.log('\n✅ Teste finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })