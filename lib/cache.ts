/**
 * Sistema de Cache Agressivo
 * Reduz drasticamente consultas ao banco
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Limpar itens expirados
  cleanup(): void {
    const now = Date.now()
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    })
  }
}

// Instância global do cache
export const appCache = new SimpleCache()

// Limpar cache expirado a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    appCache.cleanup()
  }, 5 * 60 * 1000)
}

// Helpers para cache específico
export const cacheHelpers = {
  // Cache de usuário - 10 minutos
  setUser: (userId: string, userData: any) => {
    appCache.set(`user:${userId}`, userData, 10 * 60 * 1000)
  },
  
  getUser: (userId: string) => {
    return appCache.get(`user:${userId}`)
  },

  // Cache de cursos - 5 minutos
  setCourses: (userId: string, courses: any[]) => {
    appCache.set(`courses:${userId}`, courses, 5 * 60 * 1000)
  },
  
  getCourses: (userId: string) => {
    return appCache.get(`courses:${userId}`)
  },

  // Cache de progresso - 2 minutos
  setProgress: (userId: string, progress: any) => {
    appCache.set(`progress:${userId}`, progress, 2 * 60 * 1000)
  },
  
  getProgress: (userId: string) => {
    return appCache.get(`progress:${userId}`)
  },

  // Cache de dashboard - 3 minutos
  setDashboard: (userId: string, dashboard: any) => {
    appCache.set(`dashboard:${userId}`, dashboard, 3 * 60 * 1000)
  },
  
  getDashboard: (userId: string) => {
    return appCache.get(`dashboard:${userId}`)
  },

  // Cache de usuários (para admins) - 30 minutos
  setUsers: (users: any[]) => {
    appCache.set('users:all', users, 30 * 60 * 1000)
  },
  
  getUsers: () => {
    return appCache.get('users:all')
  },

  // Invalidar cache relacionado ao usuário
  invalidateUser: (userId: string) => {
    appCache.delete(`user:${userId}`)
    appCache.delete(`courses:${userId}`)
    appCache.delete(`progress:${userId}`)
    appCache.delete(`dashboard:${userId}`)
  }
}