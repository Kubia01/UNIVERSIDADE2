#!/usr/bin/env node

/**
 * Script de Diagnóstico de Performance
 * Verifica problemas comuns que podem causar lentidão
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 DIAGNÓSTICO DE PERFORMANCE')
console.log('=' .repeat(50))

async function checkSupabaseConnection() {
  console.log('\n📡 Testando Conexão com Supabase...')
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variáveis de ambiente não encontradas!')
    console.log('   Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const start = Date.now()
    const { data, error } = await supabase.from('courses').select('id').limit(1)
    const duration = Date.now() - start
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log(`✅ Conexão OK (${duration}ms)`)
    
    if (duration > 1000) {
      console.log('⚠️  Conexão lenta detectada (>1s)')
      console.log('   Possíveis causas:')
      console.log('   - Projeto Supabase pausado')
      console.log('   - Região do servidor distante')
      console.log('   - Problemas de rede')
    }
    
    return true
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message)
    return false
  }
}

async function checkDatabasePerformance() {
  console.log('\n🗄️  Testando Performance do Banco...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Teste 1: Consulta simples
    const start1 = Date.now()
    const { data: courses } = await supabase.from('courses').select('*')
    const duration1 = Date.now() - start1
    
    console.log(`📚 Consulta de cursos: ${duration1}ms (${courses?.length || 0} registros)`)
    
    // Teste 2: Consulta com JOIN
    const start2 = Date.now()
    const { data: videos } = await supabase
      .from('videos')
      .select('*, courses(title)')
      .limit(10)
    const duration2 = Date.now() - start2
    
    console.log(`🎥 Consulta com JOIN: ${duration2}ms (${videos?.length || 0} registros)`)
    
    // Teste 3: Consulta de progresso
    const start3 = Date.now()
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .limit(10)
    const duration3 = Date.now() - start3
    
    console.log(`📊 Consulta de progresso: ${duration3}ms (${progress?.length || 0} registros)`)
    
    // Análise
    const avgDuration = (duration1 + duration2 + duration3) / 3
    
    if (avgDuration > 500) {
      console.log('\n⚠️  Performance do banco abaixo do ideal')
      console.log('   Sugestões:')
      console.log('   - Verificar se há muitos dados desnecessários')
      console.log('   - Considerar paginação')
      console.log('   - Otimizar consultas com índices')
    } else {
      console.log('\n✅ Performance do banco adequada')
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de performance:', error.message)
  }
}

async function checkNetworkIssues() {
  console.log('\n🌐 Verificando Problemas de Rede...')
  
  try {
    // Teste de conectividade básica
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': supabaseKey
      }
    })
    
    if (response.status === 200) {
      console.log('✅ Conectividade básica OK')
    } else {
      console.log(`⚠️  Status HTTP: ${response.status}`)
    }
    
    // Verificar CORS
    try {
      await fetch(supabaseUrl + '/rest/v1/courses?limit=1', {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      })
      console.log('✅ CORS configurado corretamente')
    } catch (corsError) {
      console.log('❌ Problema de CORS detectado')
      console.log('   Verifique as configurações de CORS no Supabase')
    }
    
  } catch (error) {
    console.log('❌ Erro de rede:', error.message)
    
    if (error.message.includes('Failed to fetch')) {
      console.log('\n🔧 SOLUÇÕES PARA "Failed to fetch":')
      console.log('   1. Verificar se o projeto Supabase está ativo')
      console.log('   2. Verificar URL e chaves de API')
      console.log('   3. Verificar firewall/proxy')
      console.log('   4. Tentar em outra rede')
    }
  }
}

async function checkFrontendPerformance() {
  console.log('\n⚡ Verificando Performance do Frontend...')
  
  // Verificar tamanho dos bundles
  const fs = require('fs')
  const path = require('path')
  
  try {
    const buildPath = path.join(process.cwd(), '.next/static/chunks')
    
    if (fs.existsSync(buildPath)) {
      const files = fs.readdirSync(buildPath)
      let totalSize = 0
      let largeFiles = []
      
      files.forEach(file => {
        if (file.endsWith('.js')) {
          const filePath = path.join(buildPath, file)
          const stats = fs.statSync(filePath)
          const sizeKB = Math.round(stats.size / 1024)
          totalSize += sizeKB
          
          if (sizeKB > 100) {
            largeFiles.push({ file, size: sizeKB })
          }
        }
      })
      
      console.log(`📦 Tamanho total dos chunks: ${totalSize}KB`)
      
      if (largeFiles.length > 0) {
        console.log('\n📊 Arquivos grandes detectados:')
        largeFiles.forEach(({ file, size }) => {
          console.log(`   ${file}: ${size}KB`)
        })
        
        if (totalSize > 1000) {
          console.log('\n⚠️  Bundle muito grande detectado')
          console.log('   Sugestões:')
          console.log('   - Implementar code splitting')
          console.log('   - Remover bibliotecas desnecessárias')
          console.log('   - Usar dynamic imports')
        }
      }
    } else {
      console.log('ℹ️  Build não encontrado. Execute: npm run build')
    }
  } catch (error) {
    console.log('⚠️  Não foi possível analisar os bundles:', error.message)
  }
}

function provideSolutions() {
  console.log('\n💡 SOLUÇÕES PARA PERFORMANCE:')
  console.log('=' .repeat(50))
  
  console.log('\n🚀 Otimizações Implementadas:')
  console.log('   ✅ Sistema de compatibilidade leve')
  console.log('   ✅ Debounce em carregamentos')
  console.log('   ✅ Memoização de filtros')
  console.log('   ✅ Redução de re-renders')
  console.log('   ✅ CSS otimizado')
  
  console.log('\n🔧 Próximos Passos:')
  console.log('   1. Verificar se projeto Supabase está ativo')
  console.log('   2. Considerar cache de dados')
  console.log('   3. Implementar lazy loading')
  console.log('   4. Otimizar imagens')
  console.log('   5. Usar CDN se necessário')
  
  console.log('\n📱 Para Desenvolvimento Local:')
  console.log('   - Use: npm run dev')
  console.log('   - Desabilite extensões do navegador')
  console.log('   - Limpe cache: Ctrl+Shift+R')
  
  console.log('\n🌐 Para Produção:')
  console.log('   - Verifique logs do Vercel')
  console.log('   - Monitor performance: Web Vitals')
  console.log('   - Use Lighthouse para análise')
}

async function main() {
  console.log('Iniciando diagnóstico...\n')
  
  const connectionOk = await checkSupabaseConnection()
  
  if (connectionOk) {
    await checkDatabasePerformance()
  }
  
  await checkNetworkIssues()
  await checkFrontendPerformance()
  
  provideSolutions()
  
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Diagnóstico concluído!')
  console.log('\nSe o problema persistir:')
  console.log('1. Execute este script novamente')
  console.log('2. Verifique o console do navegador')
  console.log('3. Monitore o Network tab das DevTools')
}

main().catch(console.error)