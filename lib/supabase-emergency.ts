/**
 * Sistema de Emergência para Supabase
 * Implementa retry, fallback e cache para situações críticas
 */

import { supabase } from './supabase'
import { appCache } from './cache'

// Configurações de retry
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  timeoutMs: 10000 // 10 segundos timeout
}

// Função para delay com backoff exponencial
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Função para calcular delay com backoff
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1)
  return Math.min(exponentialDelay, RETRY_CONFIG.maxDelay)
}

// Wrapper para queries com retry e timeout
export const emergencyQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string,
  cacheTTL?: number
): Promise<{ data: T | null; error: any }> => {
  
  // Verificar cache primeiro se disponível
  if (cacheKey) {
    const cachedData = appCache.get(cacheKey) as T | null
    if (cachedData) {
      console.log(`🔄 Dados carregados do cache: ${cacheKey}`)
      return { data: cachedData, error: null }
    }
  }

  let lastError: any = null
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${RETRY_CONFIG.maxRetries} para query`)
      
      // Criar promise com timeout
      const queryPromise = queryFn()
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), RETRY_CONFIG.timeoutMs)
      })
      
      const result = await Promise.race([queryPromise, timeoutPromise])
      
      if (result.error) {
        lastError = result.error
        console.error(`❌ Erro na tentativa ${attempt}:`, result.error)
        
        // Se não é o último retry, aguardar antes de tentar novamente
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = calculateDelay(attempt)
          console.log(`⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`)
          await delay(delayMs)
          continue
        }
      } else {
        // Sucesso - salvar no cache se disponível
        if (cacheKey && result.data) {
          appCache.set(cacheKey, result.data, cacheTTL)
          console.log(`💾 Dados salvos no cache: ${cacheKey}`)
        }
        
        console.log(`✅ Query bem-sucedida na tentativa ${attempt}`)
        return result
      }
      
    } catch (error) {
      lastError = error
      console.error(`❌ Erro inesperado na tentativa ${attempt}:`, error)
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delayMs = calculateDelay(attempt)
        console.log(`⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`)
        await delay(delayMs)
      }
    }
  }
  
  console.error(`💥 Todas as tentativas falharam. Último erro:`, lastError)
  return { data: null, error: lastError }
}

// Funções específicas para queries comuns
export const emergencyGetCourses = async (userId: string, isAdmin: boolean = false) => {
  const cacheKey = `emergency-courses-${userId}-${isAdmin}`
  
  return emergencyQuery(
    async () => {
      if (isAdmin) {
        return await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
      } else {
        return await supabase
          .from('courses')
          .select(`
            *,
            course_assignments!inner(user_id)
          `)
          .eq('is_published', true)
          .eq('course_assignments.user_id', userId)
          .order('created_at', { ascending: false })
      }
    },
    cacheKey,
    5 * 60 * 1000 // 5 minutos cache
  )
}

export const emergencyGetVideos = async (courseId: string) => {
  const cacheKey = `emergency-videos-${courseId}`
  
  return emergencyQuery(
    async () => {
      return await supabase
        .from('videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
    },
    cacheKey,
    10 * 60 * 1000 // 10 minutos cache
  )
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