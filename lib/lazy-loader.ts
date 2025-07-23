/**
 * SISTEMA DE CARREGAMENTO LAZY
 * Carrega dados apenas quando necessário
 */

import { emergencyGetVideos } from './supabase-emergency'
import { videosCache } from './ultra-cache'

// Estado global dos carregamentos
const loadingStates = new Map<string, boolean>()
const loadedCourses = new Set<string>()

export const lazyVideoLoader = {
  // Verificar se já está carregando
  isLoading: (courseId: string): boolean => {
    return loadingStates.get(courseId) || false
  },

  // Verificar se já foi carregado
  isLoaded: (courseId: string): boolean => {
    return loadedCourses.has(courseId)
  },

  // Carregar vídeos de um curso específico
  loadCourseVideos: async (courseId: string): Promise<any[]> => {
    // Se já está carregando, aguardar
    if (loadingStates.get(courseId)) {
      console.log(`⏳ [LazyLoader] Já carregando curso ${courseId}, aguardando...`)
      
      // Aguardar até terminar o carregamento
      while (loadingStates.get(courseId)) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Retornar do cache
      return videosCache.get(courseId) || []
    }

    // Se já foi carregado, retornar do cache
    if (loadedCourses.has(courseId)) {
      const cached = videosCache.get(courseId)
      if (cached) {
        console.log(`⚡ [LazyLoader] Cache hit para curso ${courseId}`)
        return cached
      }
    }

    console.log(`🚀 [LazyLoader] Carregando vídeos do curso ${courseId}`)
    
    // Marcar como carregando
    loadingStates.set(courseId, true)
    
    try {
      const result = await emergencyGetVideos(courseId)
      
      if (result.error) {
        console.error(`❌ [LazyLoader] Erro ao carregar curso ${courseId}:`, result.error)
        return []
      }
      
      const videos = result.data || []
      console.log(`✅ [LazyLoader] Carregados ${videos.length} vídeos do curso ${courseId}`)
      
      // Marcar como carregado
      loadedCourses.add(courseId)
      
      return videos
      
    } finally {
      // Remover estado de carregamento
      loadingStates.delete(courseId)
    }
  },

  // Carregar múltiplos cursos em batches
  loadMultipleCourses: async (courseIds: string[], batchSize: number = 3): Promise<{[key: string]: any[]}> => {
    console.log(`🚀 [LazyLoader] Carregando ${courseIds.length} cursos em batches de ${batchSize}`)
    
    const results: {[key: string]: any[]} = {}
    
    // Filtrar cursos que já estão carregados
    const toLoad = courseIds.filter(id => !loadedCourses.has(id) && !loadingStates.get(id))
    
    if (toLoad.length === 0) {
      console.log(`⚡ [LazyLoader] Todos os cursos já estão carregados`)
      // Retornar do cache
      courseIds.forEach(id => {
        results[id] = videosCache.get(id) || []
      })
      return results
    }

    console.log(`📊 [LazyLoader] ${toLoad.length} cursos precisam ser carregados`)

    // Carregar em batches
    for (let i = 0; i < toLoad.length; i += batchSize) {
      const batch = toLoad.slice(i, i + batchSize)
      
      console.log(`📦 [LazyLoader] Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} cursos`)
      
      const promises = batch.map(async (courseId) => {
        const videos = await lazyVideoLoader.loadCourseVideos(courseId)
        return { courseId, videos }
      })
      
      const batchResults = await Promise.all(promises)
      
      batchResults.forEach(({ courseId, videos }) => {
        results[courseId] = videos
      })
      
      // Pequena pausa entre batches
      if (i + batchSize < toLoad.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Adicionar cursos já carregados do cache
    courseIds.forEach(id => {
      if (!results[id]) {
        results[id] = videosCache.get(id) || []
      }
    })

    console.log(`✅ [LazyLoader] Concluído carregamento de ${courseIds.length} cursos`)
    return results
  },

  // Limpar cache de um curso específico
  clearCourse: (courseId: string) => {
    loadedCourses.delete(courseId)
    loadingStates.delete(courseId)
    videosCache.get(courseId) // Isso vai limpar do ultra cache também
    console.log(`🗑️ [LazyLoader] Cache limpo para curso ${courseId}`)
  },

  // Limpar todo o cache
  clearAll: () => {
    loadedCourses.clear()
    loadingStates.clear()
    console.log(`🧹 [LazyLoader] Todo o cache foi limpo`)
  },

  // Estatísticas
  getStats: () => {
    return {
      loadedCourses: loadedCourses.size,
      currentlyLoading: loadingStates.size,
      loadedCourseIds: Array.from(loadedCourses),
      loadingCourseIds: Array.from(loadingStates.keys())
    }
  }
}

// Expor para debug
if (typeof window !== 'undefined') {
  (window as any).lazyLoaderStats = () => {
    console.log('📊 LAZY LOADER STATS:', lazyVideoLoader.getStats())
  }
}