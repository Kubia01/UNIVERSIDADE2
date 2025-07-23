#!/usr/bin/env node

/**
 * Script para publicar cursos que estão como rascunho
 * Execute: node publish-courses.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas')
  console.error('Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const publishCourses = async () => {
  console.log('📚 Verificando e publicando cursos...\n')

  try {
    // 1. Buscar todos os cursos
    console.log('1️⃣ Buscando todos os cursos...')
    const { data: allCourses, error: allError } = await supabase
      .from('courses')
      .select('id, title, is_published, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Erro ao buscar cursos:', allError.message)
      return
    }

    if (!allCourses || allCourses.length === 0) {
      console.log('⚠️ Nenhum curso encontrado na base de dados')
      console.log('💡 Crie alguns cursos primeiro usando a interface de administração')
      return
    }

    console.log(`✅ Encontrados ${allCourses.length} cursos no total`)

    // 2. Separar cursos publicados e não publicados
    const publishedCourses = allCourses.filter(c => c.is_published)
    const unpublishedCourses = allCourses.filter(c => !c.is_published)

    console.log(`   📚 Cursos já publicados: ${publishedCourses.length}`)
    console.log(`   📝 Cursos em rascunho: ${unpublishedCourses.length}`)

    // 3. Mostrar cursos publicados
    if (publishedCourses.length > 0) {
      console.log('\n2️⃣ Cursos já publicados:')
      publishedCourses.forEach((course, index) => {
        console.log(`   ${index + 1}. ✅ ${course.title}`)
      })
    }

    // 4. Mostrar cursos não publicados
    if (unpublishedCourses.length > 0) {
      console.log('\n3️⃣ Cursos em rascunho (não aparecem no frontend):')
      unpublishedCourses.forEach((course, index) => {
        console.log(`   ${index + 1}. 📝 ${course.title}`)
      })

      // 5. Perguntar se deve publicar todos
      console.log('\n4️⃣ Publicando cursos em rascunho...')
      
      const coursesToPublish = []
      
      for (const course of unpublishedCourses) {
        // Verificar se o curso tem pelo menos uma aula
        const { data: lessons, error: lessonsError } = await supabase
          .from('videos')
          .select('id, title')
          .eq('course_id', course.id)
          .limit(1)

        if (lessonsError) {
          console.log(`   ⚠️ Erro ao verificar aulas do curso "${course.title}": ${lessonsError.message}`)
          continue
        }

        if (!lessons || lessons.length === 0) {
          console.log(`   ⚠️ Pulando "${course.title}" - não tem aulas`)
          continue
        }

        coursesToPublish.push(course)
      }

      if (coursesToPublish.length === 0) {
        console.log('   ⚠️ Nenhum curso válido para publicar (todos precisam ter pelo menos 1 aula)')
        return
      }

      console.log(`\n   📋 Cursos válidos para publicação: ${coursesToPublish.length}`)
      
      // 6. Publicar cursos válidos
      for (const course of coursesToPublish) {
        try {
          const { error: updateError } = await supabase
            .from('courses')
            .update({ is_published: true })
            .eq('id', course.id)

          if (updateError) {
            console.log(`   ❌ Erro ao publicar "${course.title}": ${updateError.message}`)
          } else {
            console.log(`   ✅ Publicado: "${course.title}"`)
          }
        } catch (error) {
          console.log(`   ❌ Erro inesperado ao publicar "${course.title}": ${error.message}`)
        }
      }

      console.log('\n5️⃣ Verificando resultado...')
      
      // Verificar cursos publicados após a operação
      const { data: finalCourses, error: finalError } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .eq('is_published', true)

      if (finalError) {
        console.log('   ❌ Erro ao verificar resultado:', finalError.message)
      } else {
        console.log(`   ✅ Total de cursos publicados agora: ${finalCourses?.length || 0}`)
        
        if (finalCourses && finalCourses.length > 0) {
          console.log('   📋 Cursos que aparecerão no frontend:')
          finalCourses.forEach((course, index) => {
            console.log(`      ${index + 1}. ${course.title}`)
          })
        }
      }

    } else {
      console.log('\n✅ Todos os cursos já estão publicados!')
    }

    // 7. Teste final - simular consulta do frontend
    console.log('\n6️⃣ Testando consulta do frontend...')
    const { data: frontendTest, error: frontendError } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (frontendError) {
      console.log('   ❌ Erro na consulta frontend:', frontendError.message)
    } else {
      console.log(`   ✅ Frontend deveria mostrar ${frontendTest?.length || 0} cursos`)
    }

    console.log('\n🎉 Processo concluído!')
    console.log('\n📋 Resumo:')
    console.log(`   • Cursos encontrados: ${allCourses.length}`)
    console.log(`   • Cursos publicados: ${publishedCourses.length + (coursesToPublish?.length || 0)}`)
    console.log(`   • Cursos em rascunho: ${unpublishedCourses.length - (coursesToPublish?.length || 0)}`)
    
    if (frontendTest && frontendTest.length > 0) {
      console.log('\n✨ Os cursos devem aparecer no frontend agora!')
    } else {
      console.log('\n⚠️ Se os cursos ainda não aparecerem, execute:')
      console.log('   node diagnose-supabase-connection.js')
    }

  } catch (error) {
    console.error('❌ Erro durante publicação:', error.message)
  }
}

// Executar publicação
publishCourses()
  .then(() => {
    console.log('\n✅ Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })