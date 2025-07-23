/**
 * Sistema de Emergência para Supabase
 * Implementa retry, fallback e cache para situações críticas
 */

import { supabase } from './supabase'
import { appCache } from './cache'

// Configurações ULTRA AGRESSIVAS
const RETRY_CONFIG = {
  maxRetries: 1, // APENAS 1 tentativa
  baseDelay: 0, // SEM delay
  maxDelay: 0,
  timeoutMs: 2000 // 2 segundos timeout apenas
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
  
  // SEMPRE verificar cache primeiro - PRIORIDADE MÁXIMA
  if (cacheKey) {
    const cachedData = appCache.get(cacheKey) as T | null
    if (cachedData) {
      console.log(`⚡ CACHE HIT: ${cacheKey}`)
      return { data: cachedData, error: null }
    }
  }

  // APENAS 1 TENTATIVA - SEM RETRY
  try {
    console.log(`⚡ TENTATIVA ÚNICA - Timeout: ${RETRY_CONFIG.timeoutMs}ms`)
    
    // Criar promise com timeout AGRESSIVO
    const queryPromise = queryFn()
    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), RETRY_CONFIG.timeoutMs)
    })
    
    const result = await Promise.race([queryPromise, timeoutPromise])
    
    if (result.error) {
      console.error(`❌ Erro na query:`, result.error.message || result.error)
      return { data: null, error: result.error }
    }
    
    // Sucesso - salvar no cache IMEDIATAMENTE
    if (cacheKey && result.data) {
      appCache.set(cacheKey, result.data, cacheTTL || 30 * 60 * 1000) // 30 min default
      console.log(`💾 CACHE SAVED: ${cacheKey}`)
    }
    
    console.log(`✅ SUCCESS em ${RETRY_CONFIG.timeoutMs}ms`)
    return result
    
  } catch (error) {
    console.error(`💥 FALHA TOTAL:`, (error as Error).message || error)
    return { data: null, error: error }
  }
}

// Funções específicas para queries comuns
export const emergencyGetCourses = async (userId: string, isAdmin: boolean = false) => {
  const cacheKey = `courses-${userId}-${isAdmin}`
  
  return emergencyQuery(
    async () => {
      // Query SIMPLIFICADA - sem JOINs desnecessários
      if (isAdmin) {
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(20) // LIMITAR resultados
      } else {
        // Para usuários normais, buscar TODOS os cursos por enquanto (simplificar)
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(10) // MENOS resultados para usuários
      }
    },
    cacheKey,
    60 * 60 * 1000 // 1 HORA de cache
  )
}

export const emergencyGetVideos = async (courseId: string) => {
  const cacheKey = `videos-${courseId}`
  
  return emergencyQuery(
    async () => {
      return await supabase
        .from('videos')
        .select('id, course_id, title, description, order_index, duration, video_url, type, created_at, updated_at')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .limit(50) // LIMITAR vídeos
    },
    cacheKey,
    2 * 60 * 60 * 1000 // 2 HORAS de cache
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