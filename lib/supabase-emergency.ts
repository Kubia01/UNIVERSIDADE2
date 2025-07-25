/**
 * Sistema de Emergência para Supabase
 * Implementa retry, fallback e cache para situações críticas
 */

import { supabase } from './supabase'
import { appCache } from './cache'
import { coursesCache, videosCache } from './ultra-cache'

// Configurações ULTRA AGRESSIVAS para conectividade ruim
const RETRY_CONFIG = {
  maxRetries: 3, // 3 tentativas rápidas
  baseDelay: 200, // 200ms delay base - muito rápido  
  maxDelay: 800, // 800ms delay máximo - muito rápido
  timeoutMs: 3000 // 3 segundos timeout - ultra agressivo
}

// Função para delay com backoff exponencial
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Função para calcular delay com backoff
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1)
  return Math.min(exponentialDelay, RETRY_CONFIG.maxDelay)
}

// Wrapper para queries com retry e timeout + sistema offline
export const emergencyQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string,
  cacheTTL?: number,
  fallbackType?: 'courses' | 'users' | 'progress' | 'stats'
): Promise<{ data: T | null; error: any }> => {
  
  // SEMPRE verificar cache primeiro - PRIORIDADE MÁXIMA
  if (cacheKey) {
    const cachedData = appCache.get(cacheKey) as T | null
    if (cachedData) {
      console.log(`⚡ CACHE HIT: ${cacheKey}`)
      return { data: cachedData, error: null }
    }
  }

  // Se estamos em modo offline E não é uma tentativa de reconexão, usar fallback
  if (isOfflineMode() && !shouldRetryConnection()) {
    console.log('🔌 MODO OFFLINE - Usando dados de fallback')
    if (fallbackType) {
      const fallbackData = getFallbackData(fallbackType) as T
      return { data: fallbackData, error: null }
    }
  }

  // Sistema de retry com múltiplas tentativas
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
      
      // Última tentativa falhou - ativar modo offline
      console.error(`💥 FALHA TOTAL após ${RETRY_CONFIG.maxRetries} tentativas:`, (error as Error).message || error)
      
      // Ativar modo offline para evitar tentativas futuras desnecessárias
      enableOfflineMode()
      
      // Tentar usar dados de fallback
      if (fallbackType) {
        console.log('🔌 Ativando dados de fallback após falha total')
        const fallbackData = getFallbackData(fallbackType) as T
        return { data: fallbackData, error: null }
      }
      
      return { data: null, error: error }
    }
  }

  // Não deveria chegar aqui, mas por segurança
  return { data: null, error: new Error('Número máximo de tentativas excedido') }
}

// Funções específicas para queries comuns
export const emergencyGetCourses = async (userId: string, isAdmin: boolean = false) => {
  // VERIFICAR ULTRA CACHE PRIMEIRO
  const cachedCourses = coursesCache.get(userId, isAdmin)
  if (cachedCourses) {
    console.log('⚡ ULTRA CACHE HIT: Cursos')
    return { data: cachedCourses, error: null }
  }
  
  const cacheKey = `courses-${userId}-${isAdmin}`
  
  const result = await emergencyQuery(
    async () => {
      // Query OTIMIZADA - campos essenciais para performance (sem updated_at)
      if (isAdmin) {
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .order('created_at', { ascending: false })
          .limit(100) // AUMENTAR limite para suportar mais cursos
      } else {
        // Para usuários normais, buscar TODOS os cursos - campos essenciais
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .order('created_at', { ascending: false })
          .limit(50) // AUMENTAR limite para usuários também
      }
    },
    cacheKey,
    60 * 60 * 1000, // 1 HORA de cache
    'courses' // Usar dados de fallback em caso de falha
  )
  
  // Salvar no ULTRA CACHE também
  if (result.data && !result.error) {
    coursesCache.set(userId, isAdmin, result.data)
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

// Dados de fallback para emergência
export const EMERGENCY_FALLBACK_DATA = {
  courses: [
    {
      id: 'fallback-1',
      title: 'Curso Temporário 1',
      description: 'Dados sendo carregados...',
      type: 'training',
      duration: 30,
      instructor: 'Sistema',
      department: 'HR',
      is_published: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-2', 
      title: 'Curso Temporário 2',
      description: 'Dados sendo carregados...',
      type: 'training',
      duration: 45,
      instructor: 'Sistema',
      department: 'Operations',
      is_published: true,
      created_at: new Date().toISOString()
    }
  ],
  
  videos: [
    {
      id: 'fallback-video-1',
      course_id: 'fallback-1',
      title: 'Carregando aulas...',
      description: 'As aulas estão sendo carregadas. Tente novamente em alguns instantes.',
      order_index: 1,
      duration: 0,
      video_url: null
    }
  ]
}

// Função para usar dados de fallback
export const useFallbackData = (type: 'courses' | 'videos', courseId?: string) => {
  console.log(`🚨 Usando dados de fallback para: ${type}`)
  
  switch (type) {
    case 'courses':
      return EMERGENCY_FALLBACK_DATA.courses
    case 'videos':
      return EMERGENCY_FALLBACK_DATA.videos.filter(v => 
        !courseId || v.course_id === courseId
      )
    default:
      return []
  }
}