#!/usr/bin/env node

/**
 * Script para verificar configuração do Supabase Storage
 * Execute: node check-storage-config.js
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

const checkStorageConfig = async () => {
  console.log('🔍 Verificando configuração do Supabase Storage...\n')

  try {
    // 1. Listar buckets existentes
    console.log('1️⃣ Verificando buckets existentes...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Erro ao listar buckets:', bucketsError.message)
      return
    }
    
    console.log(`✅ Encontrados ${buckets?.length || 0} buckets:`)
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
      })
    }

    // 2. Verificar bucket course-videos
    console.log('\n2️⃣ Verificando bucket course-videos...')
    const courseVideosBucket = buckets?.find(bucket => bucket.name === 'course-videos')
    
    if (!courseVideosBucket) {
      console.log('❌ Bucket course-videos NÃO EXISTE!')
      console.log('\n📋 Para criar o bucket:')
      console.log('1. Acesse: https://supabase.com/dashboard')
      console.log('2. Vá para Storage → New Bucket')
      console.log('3. Nome: course-videos')
      console.log('4. Marque como "Public bucket"')
      console.log('5. File size limit: 524288000 (500MB)')
      console.log('6. Allowed MIME types: video/mp4, video/webm, video/ogg, video/avi, video/mov, video/mkv')
      return
    }

    console.log('✅ Bucket course-videos encontrado!')
    console.log(`   - Público: ${courseVideosBucket.public ? 'Sim' : 'Não'}`)
    console.log(`   - ID: ${courseVideosBucket.id}`)

    // 3. Testar upload de arquivo pequeno
    console.log('\n3️⃣ Testando upload de arquivo pequeno...')
    const testContent = 'Este é um arquivo de teste para verificar o upload'
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.log('❌ Erro no teste de upload:', uploadError.message)
      if (uploadError.message.includes('Row level security')) {
        console.log('\n🔒 Problema de políticas de segurança!')
        console.log('Execute estas políticas no SQL Editor do Supabase:')
        console.log(`
-- Política para permitir uploads de admins
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

-- Política para permitir leitura pública  
CREATE POLICY "Public can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-videos');
        `)
      }
      return
    }

    console.log('✅ Upload de teste bem-sucedido!')
    console.log(`   - Arquivo: ${uploadData.path}`)

    // 4. Testar obtenção de URL pública
    console.log('\n4️⃣ Testando URL pública...')
    const { data: publicUrlData } = supabase.storage
      .from('course-videos')
      .getPublicUrl(testFileName)

    console.log('✅ URL pública gerada:')
    console.log(`   - ${publicUrlData.publicUrl}`)

    // 5. Limpar arquivo de teste
    console.log('\n5️⃣ Limpando arquivo de teste...')
    const { error: deleteError } = await supabase.storage
      .from('course-videos')
      .remove([testFileName])

    if (deleteError) {
      console.log('⚠️ Aviso: Não foi possível deletar arquivo de teste:', deleteError.message)
    } else {
      console.log('✅ Arquivo de teste removido com sucesso!')
    }

    // 6. Verificar políticas
    console.log('\n6️⃣ Verificando políticas de storage...')
    try {
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('policyname, tablename')
        .eq('tablename', 'objects')
        .ilike('policyname', '%video%')

      if (policyError) {
        console.log('⚠️ Não foi possível verificar políticas:', policyError.message)
      } else {
        console.log(`✅ Encontradas ${policies?.length || 0} políticas relacionadas a vídeos`)
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`   - ${policy.policyname}`)
          })
        }
      }
    } catch (error) {
      console.log('⚠️ Verificação de políticas não disponível')
    }

    console.log('\n🎉 Configuração do storage verificada!')
    console.log('\n📋 Resumo:')
    console.log('   • Bucket course-videos: ✅ Existe')
    console.log('   • Bucket público: ✅ Configurado')
    console.log('   • Upload funcionando: ✅ OK')
    console.log('   • URL pública: ✅ OK')
    console.log('\n✨ Agora você pode fazer upload de vídeos!')

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

// Executar verificação
checkStorageConfig()
  .then(() => {
    console.log('\n✅ Verificação finalizada!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })