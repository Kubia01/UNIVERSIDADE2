/**
 * SISTEMA DE CACHE ULTRA AGRESSIVO - PERFORMANCE EXTREMA
 * Cache global compartilhado entre todos os componentes
 */

// Cache global em memória - OTIMIZADO
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// TTLs ULTRA AGRESSIVOS (em milissegundos) - PERFORMANCE EXTREMA
const DEFAULT_TTLS = {
  courses: 3 * 60 * 60 * 1000,    // 3 horas - MUITO mais agressivo
  videos: 6 * 60 * 60 * 1000,     // 6 horas - dados raramente mudam
  users: 2 * 60 * 60 * 1000,      // 2 horas - aumentado significativamente
  certificates: 4 * 60 * 60 * 1000, // 4 horas - dados estáticos
  assignments: 2 * 60 * 60 * 1000,  // 2 horas - aumentado
  dashboard: 1 * 60 * 60 * 1000,    // 1 hora - dados de dashboard
  emergency: 10 * 60 * 1000         // 10 minutos - dados emergenciais
}

export const ultraCache = {
  // Função para salvar no cache
  set: (key: string, data: any, ttl?: number) => {
    const defaultTtl = DEFAULT_TTLS.courses // Padrão para cursos
    const finalTtl = ttl || defaultTtl
    
    globalCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: finalTtl
    })
    
    console.log(`💾 ULTRA CACHE SET: ${key} (TTL: ${Math.round(finalTtl/1000/60)}min)`)
  },

  // Função para recuperar do cache
  get: (key: string): any | null => {
    const cached = globalCache.get(key)
    
    if (!cached) {
      console.log(`❌ CACHE MISS: ${key}`)
      return null
    }
    
    const now = Date.now()
    const age = now - cached.timestamp
    
    // Verificar se expirou
    if (age > cached.ttl) {
      console.log(`⏰ CACHE EXPIRED: ${key} (${Math.round(age/1000)}s old)`)
      globalCache.delete(key)
      return null
    }
    
    console.log(`⚡ CACHE HIT: ${key} (${Math.round(age/1000)}s old)`)
    return cached.data
  },

  // Função para forçar atualização - mas manter cache antigo até nova data chegar
  refresh: async (key: string, refreshFn: () => Promise<any>, ttl?: number) => {
    console.log(`🔄 CACHE REFRESH: ${key}`)
    
    try {
      const newData = await refreshFn()
      if (newData) {
        ultraCache.set(key, newData, ttl)
        return newData
      }
    } catch (error) {
      console.log(`⚠️ CACHE REFRESH FAILED: ${key}, mantendo dados antigos`)
      // Retornar dados antigos mesmo expirados em caso de erro
      const cached = globalCache.get(key)
      return cached?.data || null
    }
  },

  // Limpar cache expirado
  cleanup: () => {
    const now = Date.now()
    let cleaned = 0
    
    globalCache.forEach((cached, key) => {
      if (now - cached.timestamp > cached.ttl) {
        globalCache.delete(key)
        cleaned++
      }
    })
    
    if (cleaned > 0) {
      console.log(`🧹 CACHE CLEANUP: ${cleaned} itens removidos`)
    }
  },

  // Estatísticas do cache
  stats: () => {
    const total = globalCache.size
    const now = Date.now()
    let expired = 0
    
    globalCache.forEach((cached) => {
      if (now - cached.timestamp > cached.ttl) {
        expired++
      }
    })
    
    return {
      total,
      active: total - expired,
      expired
    }
  },

  // Limpar tudo
  clear: () => {
    globalCache.clear()
    console.log('🧹 CACHE CLEARED COMPLETELY')
  }
}

// Cache específico para cursos - ULTRA OTIMIZADO
export const coursesCache = {
  generateKey: (userId: string, isAdmin: boolean) => {
    return `courses-${isAdmin ? 'admin' : 'user'}-${userId}`
  },
  
  set: (userId: string, isAdmin: boolean, data: any) => {
    const key = coursesCache.generateKey(userId, isAdmin)
    ultraCache.set(key, data, DEFAULT_TTLS.courses)
  },
  
  get: (userId: string, isAdmin: boolean) => {
    const key = coursesCache.generateKey(userId, isAdmin)
    return ultraCache.get(key)
  },
  
  // Cache global para todos os admins
  setGlobal: (data: any) => {
    ultraCache.set('courses-global-admin', data, DEFAULT_TTLS.courses)
  },
  
  getGlobal: () => {
    return ultraCache.get('courses-global-admin')
  }
}

// Cache específico para vídeos
export const videosCache = {
  generateKey: (courseId: string) => {
    return `videos-${courseId}`
  },
  
  set: (courseId: string, data: any) => {
    const key = videosCache.generateKey(courseId)
    ultraCache.set(key, data, DEFAULT_TTLS.videos)
  },
  
  get: (courseId: string) => {
    const key = videosCache.generateKey(courseId)
    return ultraCache.get(key)
  }
}

// Cache específico para usuários
export const usersCache = {
  generateKey: (filterType: string = 'all') => {
    return `users-${filterType}`
  },
  
  set: (data: any, filterType: string = 'all') => {
    const key = usersCache.generateKey(filterType)
    ultraCache.set(key, data, DEFAULT_TTLS.users)
  },
  
  get: (filterType: string = 'all') => {
    const key = usersCache.generateKey(filterType)
    return ultraCache.get(key)
  }
}

// Cache específico para progresso
export const progressCache = {
  generateKey: (userId: string, courseIds?: string[]) => {
    const suffix = courseIds ? `-${courseIds.join(',')}` : ''
    return `progress-${userId}${suffix}`
  },
  
  set: (userId: string, data: any, courseIds?: string[]) => {
    const key = progressCache.generateKey(userId, courseIds)
    ultraCache.set(key, data, 30 * 60 * 1000) // 30 minutos para progresso
  },
  
  get: (userId: string, courseIds?: string[]) => {
    const key = progressCache.generateKey(userId, courseIds)
    return ultraCache.get(key)
  }
}

// Sistema de pré-carregamento inteligente
export const smartPreloader = {
  // Pré-carregar dados essenciais quando o usuário faz login
  preloadUserData: async (userId: string, isAdmin: boolean) => {
    console.log('🚀 SMART PRELOADER: Iniciando pré-carregamento inteligente')
    
    // Verificar se já tem dados básicos em cache
    const hasCourses = coursesCache.get(userId, isAdmin)
    
    if (!hasCourses) {
      console.log('🎯 SMART PRELOADER: Dados não encontrados, solicitando pré-carregamento')
      // Dados não estão em cache, sinalizar necessidade de carregamento
      return false
    } else {
      console.log('✅ SMART PRELOADER: Dados já disponíveis em cache')
      return true
    }
  },
  
  // Marcar dados como "stale" para refresh em background
  markStale: (keys: string[]) => {
    keys.forEach(key => {
      const cached = globalCache.get(key)
      if (cached) {
        // Reduzir TTL para forçar refresh mais cedo
        cached.ttl = Math.min(cached.ttl, 5 * 60 * 1000) // Máximo 5 minutos
        globalCache.set(key, cached)
      }
    })
  }
}

// Cleanup automático a cada 30 minutos
setInterval(() => {
  ultraCache.cleanup()
}, 30 * 60 * 1000)

// Log estatísticas a cada 10 minutos
setInterval(() => {
  const stats = ultraCache.stats()
  console.log(`📊 CACHE STATS: ${stats.active}/${stats.total} ativos, ${stats.expired} expirados`)
}, 10 * 60 * 1000)

// Log do estado do cache para debug
if (typeof window !== 'undefined') {
  (window as any).ultraCacheStats = () => {
    console.log('📊 ULTRA CACHE STATS:', ultraCache.stats())
  }
}