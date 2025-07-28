/**
 * Sistema de Emergência para Supabase - APENAS ONLINE
 * Implementa retry e cache para situações críticas (SEM MODO OFFLINE)
 */

import { supabase } from './supabase'
import { appCache } from './cache'
import { coursesCache, videosCache } from './ultra-cache'

// Configurações para conectividade - SEM FALLBACK OFFLINE
const RETRY_CONFIG = {
  maxRetries: 5, // Aumentar para 5 tentativas
  baseDelay: 500, // 500ms delay base - mais conservativo
  maxDelay: 3000, // 3s delay máximo - mais tempo
  timeoutMs: 10000 // 10 segundos timeout - bem mais generoso
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
        
        // Se não é a última tentativa, esperar antes de tentar novamente
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
}

// Função para pré-aquecer cache de usuários não-admin
export const prewarmNonAdminCache = async () => {
  console.log('🔥 [Emergency] Pré-aquecendo cache para usuários não-admin...')
  
  try {
    // Verificar se já existe cache
    const cachedCourses = coursesCache.get('users-published', false)
    if (cachedCourses) {
      console.log('⚡ [Emergency] Cache de usuários não-admin já aquecido')
      return { data: cachedCourses, error: null }
    }
    
    // Carregar cursos publicados uma vez para todos os usuários não-admin
    const result = await emergencyQuery(
      async () => {
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(100)
      },
      'courses-users-published',
      4 * 60 * 60 * 1000 // 4 horas
    )
    
    if (result.data && !result.error) {
      coursesCache.set('users-published', false, result.data)
      console.log(`🔥 [Emergency] Cache pré-aquecido: ${result.data.length} cursos publicados`)
    }
    
    return result
  } catch (error) {
    console.error('❌ [Emergency] Erro ao pré-aquecer cache:', error)
    return { data: null, error }
  }
}

// Funções específicas para queries comuns
export const emergencyGetCourses = async (userId: string, isAdmin: boolean = false) => {
  // VERIFICAR ULTRA CACHE PRIMEIRO
  let cachedCourses = coursesCache.get(userId, isAdmin)
  
  // OTIMIZAÇÃO EXTRA: Se não é admin e não tem cache específico, tentar cache compartilhado
  if (!cachedCourses && !isAdmin) {
    cachedCourses = coursesCache.get('users-published', false)
    if (cachedCourses) {
      console.log('⚡ ULTRA CACHE HIT: Cursos compartilhados para usuário não-admin')
      return { data: cachedCourses, error: null }
    }
  }
  
  if (cachedCourses) {
    console.log('⚡ ULTRA CACHE HIT: Cursos')
    return { data: cachedCourses, error: null }
  }
  
  // OTIMIZAÇÃO: Usar cache compartilhado para usuários não-admin
  // Todos os usuários não-admin veem os mesmos cursos publicados
  const cacheKey = isAdmin ? `courses-admin-true` : `courses-users-published`
  
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
        // OTIMIZAÇÃO: Usuários normais compartilham o mesmo cache de cursos publicados
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .eq('is_published', true) // GARANTIR que apenas cursos publicados sejam visíveis
          .order('created_at', { ascending: false })
          .limit(100) // Limite para usuários
      }
    },
    cacheKey,
    4 * 60 * 60 * 1000 // 4 HORAS de cache - cache mais longo para melhor performance
  )
  
  // Salvar no ULTRA CACHE também - usar cache key otimizado
  if (result.data && !result.error) {
    // Para usuários não-admin, salvar com a key compartilhada
    const optimizedUserId = isAdmin ? userId : 'users-published'
    coursesCache.set(optimizedUserId, isAdmin, result.data)
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