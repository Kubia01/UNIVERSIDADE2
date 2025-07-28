/**
 * DADOS DE FALLBACK DESATIVADOS - SISTEMA APENAS ONLINE
 * Sistema offline foi removido para funcionar apenas em modo online
 */

// Dados básicos de cursos para fallback (DESATIVADO)
export const FALLBACK_COURSES = []

// Dados básicos de usuários para fallback (DESATIVADO)
export const FALLBACK_USERS = []

// Progresso de fallback (DESATIVADO)
export const FALLBACK_PROGRESS = {}

// Estatísticas de fallback (DESATIVADO)
export const FALLBACK_STATS = {
  totalCourses: 0,
  completedCourses: 0,
  totalWatchTime: 0,
  certificatesEarned: 0,
  totalUsers: 0
}

// Função para verificar se estamos em modo offline (SEMPRE FALSE)
export const isOfflineMode = (): boolean => {
  // SISTEMA OFFLINE DESATIVADO - SEMPRE RETORNA FALSE
  return false
}

// Função para ativar modo offline (DESATIVADA)
export const enableOfflineMode = (): void => {
  // SISTEMA OFFLINE DESATIVADO - NÃO FAZ NADA
  console.log('🌐 Sistema offline desativado - funcionando apenas online')
}

// Função para desativar modo offline (DESATIVADA)
export const disableOfflineMode = (): void => {
  // SISTEMA OFFLINE DESATIVADO - NÃO FAZ NADA
  console.log('🌐 Sistema funciona apenas online')
}

// Função para verificar se deve tentar reconectar (SEMPRE TRUE)
export const shouldRetryConnection = (): boolean => {
  // SEMPRE TENTAR RECONECTAR - SISTEMA APENAS ONLINE
  return true
}

// Obter dados de fallback baseado no tipo (SEMPRE RETORNA VAZIO)
export const getFallbackData = (type: 'courses' | 'users' | 'progress' | 'stats') => {
  // SISTEMA OFFLINE DESATIVADO - SEMPRE RETORNA DADOS VAZIOS
  switch (type) {
    case 'courses':
      return []
    case 'users': 
      return []
    case 'progress':
      return {}
    case 'stats':
      return FALLBACK_STATS
    default:
      return null
  }
}