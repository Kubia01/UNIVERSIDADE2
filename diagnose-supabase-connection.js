#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de conexão com Supabase
 * Execute: node diagnose-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Diagnóstico da Conexão Supabase\n')

// Verificar variáveis de ambiente
console.log('1️⃣ Verificando variáveis de ambiente...')
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Definida' : '❌ Não encontrada'}`)
console.log(`   ANON_KEY: ${supabaseAnonKey ? '✅ Definida' : '❌ Não encontrada'}`)
console.log(`   SERVICE_KEY: ${supabaseServiceKey ? '✅ Definida' : '❌ Não encontrada'}`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Variáveis de ambiente obrigatórias não encontradas!')
  console.error('Verifique se o arquivo .env.local existe e contém:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui')
  process.exit(1)
}

// Verificar formato da URL
console.log('\n2️⃣ Verificando formato da URL...')
const urlPattern = /^https:\/\/[a-z0-9]+\.supabase\.co$/
if (urlPattern.test(supabaseUrl)) {
  console.log('   ✅ Formato da URL está correto')
} else {
  console.log('   ⚠️ Formato da URL pode estar incorreto')
  console.log(`   URL atual: ${supabaseUrl}`)
  console.log('   Formato esperado: https://[projeto].supabase.co')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

const runDiagnostics = async () => {
  try {
    // Teste 1: Conectividade básica
    console.log('\n3️⃣ Testando conectividade básica...')
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1).single()
      if (error) {
        console.log('   ⚠️ Erro na consulta básica:', error.message)
      } else {
        console.log('   ✅ Conectividade básica funcionando')
      }
    } catch (error) {
      console.log('   ❌ Falha na conectividade:', error.message)
    }

    // Teste 2: Verificar tabelas existentes
    console.log('\n4️⃣ Verificando tabelas existentes...')
    const tablesToCheck = ['profiles', 'courses', 'videos', 'course_assignments']
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`   ❌ Tabela ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Tabela ${table}: OK (${data?.length || 0} registros testados)`)
        }
      } catch (error) {
        console.log(`   ❌ Tabela ${table}: Erro de conexão`)
      }
    }

    // Teste 3: Verificar cursos especificamente
    console.log('\n5️⃣ Verificando cursos...')
    try {
      const { data: allCourses, error: allError } = await supabase
        .from('courses')
        .select('id, title, is_published, created_at')
        .order('created_at', { ascending: false })

      if (allError) {
        console.log('   ❌ Erro ao buscar cursos:', allError.message)
      } else {
        console.log(`   ✅ Total de cursos encontrados: ${allCourses?.length || 0}`)
        
        if (allCourses && allCourses.length > 0) {
          console.log('   📋 Cursos encontrados:')
          allCourses.slice(0, 5).forEach((course, index) => {
            console.log(`      ${index + 1}. ${course.title} (${course.is_published ? 'Publicado' : 'Rascunho'})`)
          })
          
          // Verificar cursos publicados
          const publishedCourses = allCourses.filter(c => c.is_published)
          console.log(`   📚 Cursos publicados: ${publishedCourses.length}`)
          
          if (publishedCourses.length === 0) {
            console.log('   ⚠️ PROBLEMA ENCONTRADO: Nenhum curso está marcado como publicado!')
            console.log('   💡 Solução: Vá para "Gerenciar Cursos" e publique os cursos')
          }
        } else {
          console.log('   ⚠️ Nenhum curso encontrado na base de dados')
        }
      }
    } catch (error) {
      console.log('   ❌ Erro crítico ao verificar cursos:', error.message)
    }

    // Teste 4: Verificar RLS (Row Level Security)
    console.log('\n6️⃣ Verificando políticas RLS...')
    if (supabaseAdmin) {
      try {
        const { data: policies, error: policyError } = await supabaseAdmin
          .from('pg_policies')
          .select('policyname, tablename')
          .in('tablename', ['courses', 'profiles', 'videos'])

        if (policyError) {
          console.log('   ⚠️ Não foi possível verificar políticas:', policyError.message)
        } else {
          console.log(`   ✅ Políticas RLS encontradas: ${policies?.length || 0}`)
          const coursesPolicies = policies?.filter(p => p.tablename === 'courses') || []
          console.log(`   📋 Políticas para tabela 'courses': ${coursesPolicies.length}`)
          
          if (coursesPolicies.length === 0) {
            console.log('   ⚠️ AVISO: Nenhuma política RLS para tabela courses')
            console.log('   💡 Isso pode causar problemas de acesso')
          }
        }
      } catch (error) {
        console.log('   ⚠️ Não foi possível verificar RLS:', error.message)
      }
    } else {
      console.log('   ⚠️ Service key não disponível - pulando verificação RLS')
    }

    // Teste 5: Simular consulta do frontend
    console.log('\n7️⃣ Simulando consulta do frontend...')
    try {
      const { data: frontendCourses, error: frontendError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (frontendError) {
        console.log('   ❌ Erro na simulação frontend:', frontendError.message)
        console.log('   🔍 Este é provavelmente o mesmo erro que aparece no navegador')
      } else {
        console.log(`   ✅ Simulação frontend OK: ${frontendCourses?.length || 0} cursos`)
        
        if (frontendCourses && frontendCourses.length > 0) {
          console.log('   📋 Cursos que apareceriam no frontend:')
          frontendCourses.forEach((course, index) => {
            console.log(`      ${index + 1}. ${course.title}`)
          })
        }
      }
    } catch (error) {
      console.log('   ❌ Erro crítico na simulação:', error.message)
    }

    // Teste 6: Verificar status do projeto Supabase
    console.log('\n8️⃣ Verificando status do projeto...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
      
      console.log(`   Status HTTP: ${response.status}`)
      
      if (response.status === 200) {
        console.log('   ✅ Projeto Supabase está online')
      } else if (response.status === 401) {
        console.log('   ⚠️ Problema de autenticação - verifique as chaves')
      } else if (response.status >= 500) {
        console.log('   ❌ Servidor Supabase com problemas')
      } else {
        console.log('   ⚠️ Status inesperado')
      }
    } catch (error) {
      console.log('   ❌ Não foi possível conectar ao Supabase:', error.message)
    }

    // Resumo e recomendações
    console.log('\n🎯 RESUMO E RECOMENDAÇÕES:')
    console.log('=' .repeat(50))
    
    // Verificar se é problema de CORS/520
    if (supabaseUrl.includes('universidade-2.vercel.app')) {
      console.log('❌ PROBLEMA CRÍTICO: URL do Supabase está incorreta!')
      console.log('   A URL não deve conter "universidade-2.vercel.app"')
      console.log('   Deve ser algo como: https://[projeto].supabase.co')
      console.log('   Corrija no arquivo .env.local')
    } else {
      console.log('✅ URL do Supabase parece correta')
    }
    
    console.log('\n📋 Próximos passos recomendados:')
    console.log('1. Verifique se há cursos publicados (is_published = true)')
    console.log('2. Confirme se as políticas RLS estão configuradas')
    console.log('3. Teste a conexão em ambiente local vs produção')
    console.log('4. Verifique se o projeto Supabase não foi pausado')
    
  } catch (error) {
    console.error('\n❌ Erro fatal durante diagnóstico:', error.message)
  }
}

// Executar diagnóstico
runDiagnostics()
  .then(() => {
    console.log('\n✅ Diagnóstico concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })