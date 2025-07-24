/**
 * DADOS DE FALLBACK PARA CONECTIVIDADE RUIM
 * Sistema de dados locais para quando Supabase está inacessível
 */

// Dados básicos de cursos para fallback
export const FALLBACK_COURSES = [
  {
    id: 'course-fallback-1',
    title: 'Segurança no Trabalho',
    description: 'Curso básico sobre normas de segurança e prevenção de acidentes no ambiente de trabalho.',
    type: 'obrigatorio' as const,
    duration: 45,
    instructor: 'Equipe de Segurança',
    department: 'HR' as const,
    is_published: true,
    is_mandatory: true,
    thumbnail: '',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'course-fallback-2', 
    title: 'Introdução à Empresa',
    description: 'Conheça a história, missão, valores e estrutura organizacional da empresa.',
    type: 'onboarding' as const,
    duration: 30,
    instructor: 'Recursos Humanos',
    department: 'HR' as const,
    is_published: true,
    is_mandatory: true,
    thumbnail: '',
    created_at: '2024-01-02T00:00:00.000Z'
  },
  {
    id: 'course-fallback-3',
    title: 'Comunicação Eficaz',
    description: 'Desenvolva habilidades de comunicação verbal e escrita para melhorar o relacionamento profissional.',
    type: 'desenvolvimento' as const,
    duration: 60,
    instructor: 'Consultoria Externa',
    department: 'RH' as const,
    is_published: true,
    is_mandatory: false,
    thumbnail: '',
    created_at: '2024-01-03T00:00:00.000Z'
  }
]

// Dados básicos de usuários para fallback
export const FALLBACK_USERS = [
  {
    id: 'user-fallback-1',
    name: 'Sistema em Modo Offline',
    email: 'sistema@empresa.com',
    department: 'TI' as const,
    role: 'user' as const,
    avatar: '',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }
]

// Progresso de fallback
export const FALLBACK_PROGRESS = {
  'course-fallback-1': 0,
  'course-fallback-2': 25,
  'course-fallback-3': 0
}

// Estatísticas de fallback
export const FALLBACK_STATS = {
  totalCourses: 3,
  completedCourses: 0,
  totalWatchTime: 0,
  certificatesEarned: 0,
  totalUsers: 1
}

// Função para verificar se estamos em modo offline
export const isOfflineMode = (): boolean => {
  // Verificar se há conectividade com internet
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true
  }
  
  // Verificar localStorage para flag de modo offline
  if (typeof localStorage !== 'undefined') {
    const offlineFlag = localStorage.getItem('supabase-offline-mode')
    return offlineFlag === 'true'
  }
  
  return false
}

// Função para ativar modo offline
export const enableOfflineMode = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('supabase-offline-mode', 'true')
    localStorage.setItem('supabase-offline-timestamp', new Date().toISOString())
  }
  console.log('🔌 MODO OFFLINE ATIVADO - Usando dados locais')
}

// Função para desativar modo offline
export const disableOfflineMode = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('supabase-offline-mode')
    localStorage.removeItem('supabase-offline-timestamp')
  }
  console.log('🌐 MODO ONLINE RESTAURADO')
}

// Função para verificar se deve tentar reconectar
export const shouldRetryConnection = (): boolean => {
  if (typeof localStorage === 'undefined') return true
  
  const timestamp = localStorage.getItem('supabase-offline-timestamp')
  if (!timestamp) return true
  
  const offlineTime = new Date(timestamp).getTime()
  const now = new Date().getTime()
  const timeDiff = now - offlineTime
  
  // Tentar reconectar a cada 2 minutos
  return timeDiff > 2 * 60 * 1000
}

// Obter dados de fallback baseado no tipo
export const getFallbackData = (type: 'courses' | 'users' | 'progress' | 'stats') => {
  switch (type) {
    case 'courses':
      return FALLBACK_COURSES
    case 'users': 
      return FALLBACK_USERS
    case 'progress':
      return FALLBACK_PROGRESS
    case 'stats':
      return FALLBACK_STATS
    default:
      return null
  }
}