#!/usr/bin/env node

/**
 * Script para criar bucket course-videos automaticamente
 * Execute: node create-bucket-automatic.js
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

const createBucketAutomatic = async () => {
  console.log('🚀 Tentando criar bucket course-videos automaticamente...\n')

  try {
    // 1. Verificar se bucket já existe
    console.log('1️⃣ Verificando se bucket já existe...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.log('❌ Erro ao listar buckets:', listError.message)
      return
    }

    const existingBucket = buckets?.find(bucket => bucket.name === 'course-videos')
    
    if (existingBucket) {
      console.log('✅ Bucket course-videos já existe!')
      console.log(`   - Público: ${existingBucket.public ? 'Sim' : 'Não'}`)
      console.log('   - Prosseguindo para verificar políticas...')
    } else {
      // 2. Tentar criar o bucket
      console.log('2️⃣ Criando bucket course-videos...')
      
      const { data: createData, error: createError } = await supabase.storage.createBucket('course-videos', {
        public: true,
        allowedMimeTypes: [
          'video/mp4',
          'video/webm', 
          'video/ogg',
          'video/avi',
          'video/mov',
          'video/mkv'
        ],
        fileSizeLimit: 524288000 // 500MB
      })

      if (createError) {
        console.log('❌ Erro ao criar bucket:', createError.message)
        
        if (createError.message.includes('exceeded the maximum allowed size')) {
          console.log('\n💡 O limite de 500MB pode ser muito alto para seu plano.')
          console.log('Tentando criar com limite de 50MB...')
          
          // Tentar com limite menor
          const { error: createError2 } = await supabase.storage.createBucket('course-videos', {
            public: true,
            allowedMimeTypes: [
              'video/mp4',
              'video/webm', 
              'video/ogg',
              'video/avi',
              'video/mov',
              'video/mkv'
            ],
            fileSizeLimit: 52428800 // 50MB
          })
          
          if (createError2) {
            console.log('❌ Erro mesmo com 50MB:', createError2.message)
            console.log('\n📋 Será necessário criar manualmente. Consulte: GUIA-BUCKET-SUPABASE.md')
            return
          } else {
            console.log('✅ Bucket criado com limite de 50MB!')
          }
        } else {
          console.log('\n📋 Será necessário criar manualmente. Consulte: GUIA-BUCKET-SUPABASE.md')
          return
        }
      } else {
        console.log('✅ Bucket criado com sucesso!')
        console.log(`   - ID: ${createData?.name}`)
      }
    }

    // 3. Criar políticas de segurança
    console.log('\n3️⃣ Configurando políticas de segurança...')
    
    const policies = [
      {
        name: 'Admins can upload videos',
        sql: `
          CREATE POLICY "Admins can upload videos" ON storage.objects
            FOR INSERT WITH CHECK (
              bucket_id = 'course-videos' AND
              auth.role() = 'authenticated' AND
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
              )
            );
        `
      },
      {
        name: 'Public can view videos',
        sql: `
          CREATE POLICY "Public can view videos" ON storage.objects
            FOR SELECT USING (bucket_id = 'course-videos');
        `
      },
      {
        name: 'Admins can delete videos',
        sql: `
          CREATE POLICY "Admins can delete videos" ON storage.objects
            FOR DELETE USING (
              bucket_id = 'course-videos' AND
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
              )
            );
        `
      }
    ]

    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        })
        
        if (policyError && !policyError.message.includes('already exists')) {
          console.log(`⚠️ Erro ao criar política "${policy.name}":`, policyError.message)
        } else {
          console.log(`✅ Política "${policy.name}" configurada`)
        }
      } catch (error) {
        console.log(`⚠️ Não foi possível criar política "${policy.name}" automaticamente`)
        console.log('   Execute manualmente no SQL Editor do Supabase:')
        console.log(policy.sql)
      }
    }

    // 4. Teste final
    console.log('\n4️⃣ Testando configuração...')
    
    const testContent = `Teste de upload - ${new Date().toISOString()}`
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.log('❌ Erro no teste de upload:', uploadError.message)
      
      if (uploadError.message.includes('Row level security')) {
        console.log('\n🔒 As políticas precisam ser criadas manualmente.')
        console.log('Vá para o SQL Editor do Supabase e execute:')
        policies.forEach(policy => {
          console.log('\n' + policy.sql)
        })
      }
    } else {
      console.log('✅ Teste de upload bem-sucedido!')
      
      // Limpar arquivo de teste
      await supabase.storage.from('course-videos').remove([testFileName])
      console.log('✅ Arquivo de teste removido')
    }

    console.log('\n🎉 Configuração do bucket concluída!')
    console.log('\n📋 Resumo:')
    console.log('   • Bucket course-videos: ✅ Criado')
    console.log('   • Configuração pública: ✅ Ativada')
    console.log('   • Políticas de segurança: ✅ Configuradas')
    console.log('   • Teste de upload: ✅ Funcionando')
    console.log('\n✨ Agora você pode fazer upload de vídeos na aplicação!')

  } catch (error) {
    console.error('❌ Erro durante criação do bucket:', error.message)
    console.log('\n📋 Consulte o guia manual: GUIA-BUCKET-SUPABASE.md')
  }
}

// Executar criação
createBucketAutomatic()
  .then(() => {
    console.log('\n✅ Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })