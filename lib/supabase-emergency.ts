/**
 * Sistema de Emergência para Supabase - APENAS ONLINE
 * Implementa retry e cache para situações críticas (SEM MODO OFFLINE)
 */

import { supabase } from './supabase'
import { appCache } from './cache'
import { coursesCache, videosCache } from './ultra-cache'

// Sistema de rate limiting global para evitar sobrecarga
let activeQueries = 0
const MAX_CONCURRENT_QUERIES = 3

// Configurações para conectividade - SEM FALLBACK OFFLINE
const RETRY_CONFIG = {
  maxRetries: 2, // Reduzir para 2 tentativas para melhor performance
  baseDelay: 500, // 0.5s delay base - mais rápido
  maxDelay: 2000, // 2s delay máximo - mais rápido
  timeoutMs: 8000 // 8 segundos timeout - mais rápido para evitar lentidão
}

// Função para delay com backoff exponencial
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Função para calcular delay com backoff
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1)
  return Math.min(exponentialDelay, RETRY_CONFIG.maxDelay)
}

// Wrapper para queries com retry e timeout - SEM SISTEMA OFFLINE
export const emergencyQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string,
  cacheTTL?: number
): Promise<{ data: T | null; error: any }> => {
  
  // SEMPRE verificar cache primeiro - PRIORIDADE MÁXIMA
  if (cacheKey) {
    const cachedData = appCache.get(cacheKey) as T | null
    if (cachedData) {
      console.log(`⚡ CACHE HIT: ${cacheKey}`)
      return { data: cachedData, error: null }
    }
  }

  // Rate limiting - aguardar se há muitas queries ativas
  while (activeQueries >= MAX_CONCURRENT_QUERIES) {
    console.log(`⏳ Rate limiting: Aguardando ${activeQueries} queries ativas`)
    await delay(500)
  }

  activeQueries++
  console.log(`🚀 Query iniciada (${activeQueries}/${MAX_CONCURRENT_QUERIES} ativas)`)

  try {
    // Sistema de retry com múltiplas tentativas - SEM FALLBACK OFFLINE
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`⚡ TENTATIVA ${attempt}/${RETRY_CONFIG.maxRetries} - Timeout: ${RETRY_CONFIG.timeoutMs}ms`)
        
        // Criar promise com timeout
        const queryPromise = queryFn()
        const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), RETRY_CONFIG.timeoutMs)
        })

        const result = await Promise.race([queryPromise, timeoutPromise])
        
        if (result.error) {
          console.error(`❌ Tentativa ${attempt} - Erro na query:`, result.error.message || result.error)
          
          // Se é erro 500, aguardar mais tempo antes de tentar novamente
          if (result.error.message?.includes('500') || result.error.code === '500') {
            console.log(`🛑 Erro 500 detectado - aguardando mais tempo`)
            if (attempt < RETRY_CONFIG.maxRetries) {
              await delay(5000) // 5 segundos para erro 500
              continue
            }
          }
          
          // Para outros tipos de erro, usar delay normal
          if (attempt < RETRY_CONFIG.maxRetries) {
            const delayTime = calculateDelay(attempt)
            console.log(`⏳ Aguardando ${delayTime}ms antes da próxima tentativa...`)
            await delay(delayTime)
            continue
          }
          
          return { data: null, error: result.error }
        }

        // Sucesso - salvar no cache IMEDIATAMENTE
        if (cacheKey && result.data) {
          appCache.set(cacheKey, result.data, cacheTTL || 30 * 60 * 1000) // 30 min default
          console.log(`💾 CACHE SAVED: ${cacheKey}`)
        }
        
        console.log(`✅ SUCCESS em tentativa ${attempt}`)
        return result
        
      } catch (error) {
        console.error(`❌ Tentativa ${attempt} falhou:`, (error as Error).message || error)
        
        // Se não é a última tentativa, esperar antes de tentar novamente
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delayTime = calculateDelay(attempt)
          console.log(`⏳ Aguardando ${delayTime}ms antes da próxima tentativa...`)
          await delay(delayTime)
          continue
        }
        
        // Última tentativa falhou - APENAS REPORTAR ERRO (SEM MODO OFFLINE)
        console.error(`💥 FALHA TOTAL após ${RETRY_CONFIG.maxRetries} tentativas:`, (error as Error).message || error)
        console.error('🌐 Sistema funciona apenas online - verifique a conexão')
        
        return { data: null, error: error }
      }
    }

    // Não deveria chegar aqui, mas por segurança
    return { data: null, error: new Error('Número máximo de tentativas excedido') }
  } finally {
    activeQueries--
    console.log(`✅ Query finalizada (${activeQueries}/${MAX_CONCURRENT_QUERIES} ativas)`)
  }
}

// Funções específicas para queries comuns
export const emergencyGetCourses = async (userId: string, isAdmin: boolean = false) => {
  // CORREÇÃO: Usar chave de cache correta desde o início
  const cacheUserId = isAdmin ? 'admin' : userId
  
  // VERIFICAR ULTRA CACHE PRIMEIRO
  let cachedCourses = coursesCache.get(cacheUserId, isAdmin)
  
  if (cachedCourses) {
    console.log('⚡ ULTRA CACHE HIT: Cursos')
    return { data: cachedCourses, error: null }
  }
  
  // Cache específico para cada usuário não-admin para respeitar atribuições
  const cacheKey = isAdmin ? `courses-admin-true` : `courses-user-${userId}`
  
  const result = await emergencyQuery(
    async () => {
      // Query OTIMIZADA - garantir que cursos publicados sejam sempre visíveis
      if (isAdmin) {
        // Admin vê TODOS os cursos (publicados e não publicados)
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .order('created_at', { ascending: false })
          .limit(200) // Aumentar limite para admins
      } else {
        // CORREÇÃO: Usuários normais só veem cursos atribuídos a eles
        try {
          // Tentar buscar cursos atribuídos primeiro
          const { data: assignedCourses, error: assignmentError } = await supabase
            .from('courses')
            .select(`
              id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at,
              course_assignments!inner(user_id)
            `)
            .eq('course_assignments.user_id', userId)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(100)
          
          // Se deu certo e encontrou cursos, retornar
          if (!assignmentError && assignedCourses && assignedCourses.length > 0) {
            console.log(`✅ Cursos atribuídos encontrados: ${assignedCourses.length}`)
            return { data: assignedCourses, error: null }
          }
          
          // Se tabela course_assignments não existe OU usuário não tem cursos atribuídos
          console.log('⚠️ Sem atribuições ou tabela não existe - retornando lista vazia')
          console.log('💡 Administrador deve atribuir cursos na seção "Atribuição de Cursos"')
          
          // Retornar array vazio para usuários sem atribuições
          return { data: [], error: null }
          
        } catch (error) {
          console.error('❌ Erro ao verificar atribuições:', error)
          // Em caso de erro, retornar lista vazia
          return { data: [], error: null }
        }
      }
    },
    cacheKey,
    2 * 60 * 60 * 1000 // 2 HORAS de cache - cache específico por usuário
  )
  
  // Salvar no ULTRA CACHE também - usar chave de cache correta
  if (result.data && !result.error) {
    // CORREÇÃO: Usar o mesmo cacheUserId definido no início
    coursesCache.set(cacheUserId, isAdmin, result.data)
    console.log(`✅ Cursos carregados: ${result.data.length} encontrados (cache: ${cacheKey})`)
  }
  
  return result
}

export const emergencyGetVideos = async (courseId: string) => {
  // VERIFICAR ULTRA CACHE PRIMEIRO
  const cachedVideos = videosCache.get(courseId)
  if (cachedVideos) {
    console.log('⚡ ULTRA CACHE HIT: Vídeos')
    return { data: cachedVideos, error: null }
  }
  
  const cacheKey = `videos-${courseId}`
  
  const result = await emergencyQuery(
    async () => {
      return await supabase
        .from('videos')
        .select('id, course_id, title, description, order_index, duration, video_url, type, created_at, updated_at')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .limit(200) // AUMENTAR limite para suportar mais vídeos por curso
    },
    cacheKey,
    2 * 60 * 60 * 1000 // 2 HORAS de cache
  )
  
  // Salvar no ULTRA CACHE também
  if (result.data && !result.error) {
    videosCache.set(courseId, result.data)
  }
  
  return result
}

export const emergencyGetUserProgress = async (userId: string, courseIds: string[]) => {
  const cacheKey = `emergency-progress-${userId}-${courseIds.join(',')}`
  
  return emergencyQuery(
    async () => {
      return await supabase
        .from('user_progress')
        .select('course_id, progress')
        .eq('user_id', userId)
        .in('course_id', courseIds)
    },
    cacheKey,
    2 * 60 * 1000 // 2 minutos cache
  )
}

// Função para usar dados de fallback - DESATIVADA
export const useFallbackData = (type: 'courses' | 'videos', courseId?: string) => {
  console.log(`🚨 Sistema offline desativado - não há dados de fallback para: ${type}`)
  return []
}