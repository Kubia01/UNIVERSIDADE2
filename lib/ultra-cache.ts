/**
 * SISTEMA DE CACHE ULTRA AGRESSIVO
 * Cache global compartilhado entre todos os componentes
 */

// Cache global em memória
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// TTLs padrão (em milissegundos) - OTIMIZADO para performance
const DEFAULT_TTLS = {
  courses: 1 * 60 * 60 * 1000,    // 1 hora - mais agressivo
  videos: 4 * 60 * 60 * 1000,     // 4 horas
  users: 45 * 60 * 1000,          // 45 minutos - aumentado para reduzir consultas
  certificates: 60 * 60 * 1000,   // 1 hora
  assignments: 30 * 60 * 1000,    // 30 minutos
  dashboard: 30 * 60 * 1000       // 30 minutos - aumentado para melhor performance
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

  // Função para limpar cache específico
  delete: (key: string) => {
    globalCache.delete(key)
    console.log(`🗑️ CACHE DELETED: ${key}`)
  },

  // Função para limpar todo o cache
  clear: () => {
    globalCache.clear()
    console.log('🧹 CACHE CLEARED COMPLETELY')
  },

  // Função para verificar se existe no cache
  has: (key: string): boolean => {
    const cached = globalCache.get(key)
    if (!cached) return false
    
    const now = Date.now()
    const age = now - cached.timestamp
    
    if (age > cached.ttl) {
      globalCache.delete(key)
      return false
    }
    
    return true
  },

  // Função para obter estatísticas do cache
  stats: () => {
    const now = Date.now()
    const entries = Array.from(globalCache.entries())
    
    const stats = {
      totalEntries: entries.length,
      validEntries: 0,
      expiredEntries: 0,
      totalSize: 0,
      oldestEntry: null as string | null,
      newestEntry: null as string | null
    }
    
    let oldestTime = now
    let newestTime = 0
    
    entries.forEach(([key, value]) => {
      const age = now - value.timestamp
      
      if (age > value.ttl) {
        stats.expiredEntries++
      } else {
        stats.validEntries++
      }
      
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp
        stats.oldestEntry = key
      }
      
      if (value.timestamp > newestTime) {
        newestTime = value.timestamp
        stats.newestEntry = key
      }
      
      // Estimar tamanho (aproximado)
      stats.totalSize += JSON.stringify(value.data).length
    })
    
    return stats
  },

  // Limpar entradas expiradas
  cleanup: () => {
    const now = Date.now()
    const toDelete: string[] = []
    
    globalCache.forEach((value, key) => {
      const age = now - value.timestamp
      if (age > value.ttl) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => globalCache.delete(key))
    
    if (toDelete.length > 0) {
      console.log(`🧹 CACHE CLEANUP: Removidas ${toDelete.length} entradas expiradas`)
    }
    
    return toDelete.length
  }
}

// Executar limpeza automática a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    ultraCache.cleanup()
  }, 5 * 60 * 1000)
}

// Funções específicas para cada tipo de dados
export const coursesCache = {
  get: (userId: string, isAdmin: boolean) => {
    // OTIMIZAÇÃO: Usar cache compartilhado para usuários não-admin
    const cacheKey = isAdmin ? `courses-${userId}-${isAdmin}` : 'courses-users-published'
    return ultraCache.get(cacheKey)
  },
  
  set: (userId: string, isAdmin: boolean, data: any) => {
    // OTIMIZAÇÃO: Usar cache compartilhado para usuários não-admin  
    const cacheKey = isAdmin ? `courses-${userId}-${isAdmin}` : 'courses-users-published'
    ultraCache.set(cacheKey, data, DEFAULT_TTLS.courses)
  }
}

export const videosCache = {
  get: (courseId: string) => {
    return ultraCache.get(`videos-${courseId}`)
  },
  
  set: (courseId: string, data: any) => {
    ultraCache.set(`videos-${courseId}`, data, DEFAULT_TTLS.videos)
  }
}

export const usersCache = {
  get: () => {
    return ultraCache.get('users-all')
  },
  
  set: (data: any) => {
    ultraCache.set('users-all', data, DEFAULT_TTLS.users)
  }
}

export const certificatesCache = {
  get: () => {
    return ultraCache.get('certificates-all')
  },
  
  set: (data: any) => {
    ultraCache.set('certificates-all', data, DEFAULT_TTLS.certificates)
  }
}

export const assignmentsCache = {
  get: () => {
    return ultraCache.get('assignments-all')
  },
  
  set: (data: any) => {
    ultraCache.set('assignments-all', data, DEFAULT_TTLS.assignments)
  }
}

// Log do estado do cache para debug
if (typeof window !== 'undefined') {
  (window as any).ultraCacheStats = () => {
    console.log('📊 ULTRA CACHE STATS:', ultraCache.stats())
  }
}