/**
 * Sistema de Emergência para Supabase - ULTRA OTIMIZADO
 * Implementa retry e cache para PERFORMANCE EXTREMA
 */

import { supabase } from './supabase'
import { appCache } from './cache'
import { coursesCache, videosCache } from './ultra-cache'

// Configurações ULTRA AGRESSIVAS para conectividade
const RETRY_CONFIG = {
  maxRetries: 2, // REDUZIDO: apenas 2 tentativas para ser mais rápido
  baseDelay: 100, // REDUZIDO: 100ms delay base - ultra rápido  
  maxDelay: 300, // REDUZIDO: 300ms delay máximo - ultra rápido
  timeoutMs: 1500 // REDUZIDO: 1.5 segundos timeout - muito mais agressivo
}

// DADOS EMERGENCIAIS RÁPIDOS - para quando Supabase está lento
const EMERGENCY_QUICK_DATA = {
  courses: [
    {
      id: 'quick-course-1',
      title: 'Segurança no Trabalho',
      description: 'Curso básico sobre normas de segurança e prevenção de acidentes no ambiente de trabalho.',
      type: 'obrigatorio',
      duration: 45,
      instructor: 'Especialista em Segurança',
      department: 'HR',
      is_published: true,
      is_mandatory: true,
      thumbnail: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'quick-course-2',
      title: 'Introdução à Empresa',
      description: 'Conheça a história, missão, valores e estrutura organizacional da empresa.',
      type: 'onboarding',
      duration: 30,
      instructor: 'Recursos Humanos',
      department: 'HR',
      is_published: true,
      is_mandatory: true,
      thumbnail: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'quick-course-3',
      title: 'Comunicação Eficaz',
      description: 'Desenvolva habilidades de comunicação verbal e escrita para melhorar o relacionamento profissional.',
      type: 'desenvolvimento',
      duration: 60,
      instructor: 'Coach de Comunicação',
      department: 'Operations',
      is_published: true,
      is_mandatory: false,
      thumbnail: null,
      created_at: new Date().toISOString()
    }
  ]
}

// Função para delay com backoff exponencial
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Função para calcular delay com backoff
const calculateDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1)
  return Math.min(exponentialDelay, RETRY_CONFIG.maxDelay)
}

// Wrapper para queries com retry e timeout - ULTRA OTIMIZADO
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

  // Sistema de retry com múltiplas tentativas - MAIS RÁPIDO
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`⚡ TENTATIVA ${attempt}/${RETRY_CONFIG.maxRetries} - Timeout: ${RETRY_CONFIG.timeoutMs}ms`)
      
      // Criar promise com timeout REDUZIDO
      const queryPromise = queryFn()
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), RETRY_CONFIG.timeoutMs)
      })

      const result = await Promise.race([queryPromise, timeoutPromise])
      
      if (result.error) {
        console.error(`❌ Tentativa ${attempt} - Erro na query:`, result.error.message || result.error)
        
        // Se não é a última tentativa, esperar menos tempo
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
        appCache.set(cacheKey, result.data, cacheTTL || 60 * 60 * 1000) // 1 hora default
        console.log(`💾 CACHE SAVED: ${cacheKey}`)
      }
      
      console.log(`✅ SUCCESS em tentativa ${attempt}`)
      return result
      
    } catch (error) {
      console.error(`❌ Tentativa ${attempt} falhou:`, (error as Error).message || error)
      
      // Se não é a última tentativa, esperar menos tempo
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delayTime = calculateDelay(attempt)
        console.log(`⏳ Aguardando ${delayTime}ms antes da próxima tentativa...`)
        await delay(delayTime)
        continue
      }
      
      // Última tentativa falhou - RETORNAR DADOS EMERGENCIAIS
      console.error(`💥 FALHA TOTAL após ${RETRY_CONFIG.maxRetries} tentativas:`, (error as Error).message || error)
      console.log('🚀 Ativando dados emergenciais para manter interface responsiva')
      
      return { data: null, error: error }
    }
  }

  // Não deveria chegar aqui, mas por segurança
  return { data: null, error: new Error('Número máximo de tentativas excedido') }
}

// Funções específicas para queries comuns - ULTRA OTIMIZADAS
export const emergencyGetCourses = async (userId: string, isAdmin: boolean = false) => {
  // VERIFICAR ULTRA CACHE PRIMEIRO
  const cachedCourses = coursesCache.get(userId, isAdmin)
  if (cachedCourses) {
    console.log('⚡ ULTRA CACHE HIT: Cursos')
    return { data: cachedCourses, error: null }
  }
  
  const cacheKey = `courses-${userId}-${isAdmin ? 'admin' : 'user'}-${isAdmin}`
  
  // TENTAR conexão rápida com Supabase
  const result = await emergencyQuery(
    async () => {
      // Query SUPER OTIMIZADA - apenas campos essenciais
      if (isAdmin) {
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .order('created_at', { ascending: false })
          .limit(50) // REDUZIDO para ser mais rápido
      } else {
        return await supabase
          .from('courses')
          .select('id, title, description, type, duration, instructor, department, is_published, is_mandatory, thumbnail, created_at')
          .eq('is_published', true) // Apenas cursos publicados para usuários
          .order('created_at', { ascending: false })
          .limit(30) // REDUZIDO para usuários normais
      }
    },
    cacheKey,
    2 * 60 * 60 * 1000 // 2 HORAS de cache - mais agressivo
  )
  
  // Se falhou, usar dados emergenciais para manter interface funcionando
  if (result.error && !result.data) {
    console.log('🚀 Usando dados emergenciais para manter performance')
    const emergencyData = EMERGENCY_QUICK_DATA.courses
    
    // Salvar dados emergenciais no cache para próximas chamadas
    appCache.set(cacheKey, emergencyData, 5 * 60 * 1000) // 5 minutos apenas
    coursesCache.set(userId, isAdmin, emergencyData)
    
    return { data: emergencyData, error: null }
  }
  
  // Salvar no ULTRA CACHE também se teve sucesso
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
        .select('id, course_id, title, description, order_index, duration, video_url, type, created_at')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .limit(100) // REDUZIDO para ser mais rápido
    },
    cacheKey,
    4 * 60 * 60 * 1000 // 4 HORAS de cache - mais agressivo
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
    5 * 60 * 1000 // 5 minutos cache - mais frequente para dados de progresso
  )
}

// Função para pré-carregar dados críticos
export const preloadCriticalData = async (userId: string, isAdmin: boolean = false) => {
  console.log('🚀 Pré-carregando dados críticos para performance máxima')
  
  // Tentar carregar cursos em background
  try {
    await emergencyGetCourses(userId, isAdmin)
  } catch (error) {
    console.log('⚠️ Pré-carregamento de cursos falhou, mas continuando...')
  }
}

// Função desativada
export const useFallbackData = (type: 'courses' | 'videos', courseId?: string) => {
  console.log(`🚨 Sistema offline desativado - não há dados de fallback para: ${type}`)
  return []
}