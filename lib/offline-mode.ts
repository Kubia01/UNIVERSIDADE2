/**
 * MODO OFFLINE COMPLETO
 * Sistema funciona 100% sem Supabase quando há falhas críticas
 */

export const OFFLINE_DATA = {
  // Dados completos de cursos
  courses: [
    {
      id: '0da59ce5-5a65-4ba5-96e2-fb28cca19bfb',
      title: 'Cadastro de empresas no CRM',
      description: 'Aprenda como cadastrar empresas no sistema CRM de forma eficiente.',
      type: 'training' as const,
      duration: 22,
      instructor: 'Equipe Técnica',
      department: 'Sales',
      is_published: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '44700197-7955-4926-ab04-9279fa6424c1',
      title: 'Como fazer um planejamento de vendas no Portal CRM',
      description: 'Aprenda o passo a passo para lançar o planejamento de vendas no portal CRM',
      type: 'training' as const,
      duration: 53,
      instructor: 'Equipe de Vendas',
      department: 'Sales',
      is_published: true,
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z'
    },
    {
      id: 'f38f1441-81b1-4c36-919f-0ae025ba1b2b',
      title: 'Mensagem Diretoria',
      description: 'Mensagem importante da diretoria para todos os colaboradores.',
      type: 'training' as const,
      duration: 2,
      instructor: 'Diretoria',
      department: 'HR',
      is_published: true,
      created_at: '2024-01-03T00:00:00.000Z',
      updated_at: '2024-01-03T00:00:00.000Z'
    },
    {
      id: '4fa6946c-7d65-410c-b456-9d8d9672cb25',
      title: 'Gestão de Resultados',
      description: 'Técnicas avançadas de gestão de resultados e performance.',
      type: 'training' as const,
      duration: 34,
      instructor: 'Gerência',
      department: 'Operations',
      is_published: true,
      created_at: '2024-01-04T00:00:00.000Z',
      updated_at: '2024-01-04T00:00:00.000Z'
    }
  ],

  // Vídeos/aulas para cada curso
  videos: {
    '0da59ce5-5a65-4ba5-96e2-fb28cca19bfb': [
      {
        id: 'video-1-1',
        course_id: '0da59ce5-5a65-4ba5-96e2-fb28cca19bfb',
        title: 'Introdução ao CRM',
        description: 'Conceitos básicos do sistema CRM.',
        order_index: 1,
        duration: 5,
        video_url: 'https://example.com/video1.mp4',
        type: 'video' as const,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'video-1-2',
        course_id: '0da59ce5-5a65-4ba5-96e2-fb28cca19bfb',
        title: 'Cadastrando Empresas',
        description: 'Passo a passo para cadastrar empresas.',
        order_index: 2,
        duration: 10,
        video_url: 'https://example.com/video2.mp4',
        type: 'video' as const,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'video-1-3',
        course_id: '0da59ce5-5a65-4ba5-96e2-fb28cca19bfb',
        title: 'Validação de Dados',
        description: 'Como validar os dados inseridos.',
        order_index: 3,
        duration: 7,
        video_url: 'https://example.com/video3.mp4',
        type: 'video' as const,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    ],
    
    '44700197-7955-4926-ab04-9279fa6424c1': [
      {
        id: 'video-2-1',
        course_id: '44700197-7955-4926-ab04-9279fa6424c1',
        title: 'Planejamento Estratégico',
        description: 'Fundamentos do planejamento de vendas.',
        order_index: 1,
        duration: 15,
        video_url: 'https://example.com/video4.mp4',
        type: 'video' as const,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      },
      {
        id: 'video-2-2',
        course_id: '44700197-7955-4926-ab04-9279fa6424c1',
        title: 'Usando o Portal CRM',
        description: 'Navegação e funcionalidades do portal.',
        order_index: 2,
        duration: 20,
        video_url: 'https://example.com/video5.mp4',
        type: 'video' as const,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      },
      {
        id: 'video-2-3',
        course_id: '44700197-7955-4926-ab04-9279fa6424c1',
        title: 'Relatórios e Análises',
        description: 'Gerando relatórios de vendas.',
        order_index: 3,
        duration: 18,
        video_url: 'https://example.com/video6.mp4',
        type: 'video' as const,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      }
    ],

    'f38f1441-81b1-4c36-919f-0ae025ba1b2b': [
      {
        id: 'video-3-1',
        course_id: 'f38f1441-81b1-4c36-919f-0ae025ba1b2b',
        title: 'Mensagem da Diretoria',
        description: 'Comunicado oficial da diretoria.',
        order_index: 1,
        duration: 2,
        video_url: 'https://example.com/video7.mp4',
        type: 'video' as const,
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z'
      }
    ],

    '4fa6946c-7d65-410c-b456-9d8d9672cb25': [
      {
        id: 'video-4-1',
        course_id: '4fa6946c-7d65-410c-b456-9d8d9672cb25',
        title: 'Fundamentos da Gestão',
        description: 'Conceitos básicos de gestão de resultados.',
        order_index: 1,
        duration: 12,
        video_url: 'https://example.com/video8.mp4',
        type: 'video' as const,
        created_at: '2024-01-04T00:00:00.000Z',
        updated_at: '2024-01-04T00:00:00.000Z'
      },
      {
        id: 'video-4-2',
        course_id: '4fa6946c-7d65-410c-b456-9d8d9672cb25',
        title: 'Métricas e KPIs',
        description: 'Definindo e acompanhando indicadores.',
        order_index: 2,
        duration: 15,
        video_url: 'https://example.com/video9.mp4',
        type: 'video' as const,
        created_at: '2024-01-04T00:00:00.000Z',
        updated_at: '2024-01-04T00:00:00.000Z'
      },
      {
        id: 'video-4-3',
        course_id: '4fa6946c-7d65-410c-b456-9d8d9672cb25',
        title: 'Planos de Ação',
        description: 'Criando planos de ação eficazes.',
        order_index: 3,
        duration: 7,
        video_url: 'https://example.com/video10.mp4',
        type: 'video' as const,
        created_at: '2024-01-04T00:00:00.000Z',
        updated_at: '2024-01-04T00:00:00.000Z'
      }
    ]
  },

  // Dados de usuários
  users: [
    {
      id: '9c29865f-3634-415c-8625-a431c86f696d',
      email: 'adm.sp1@interlub.com',
      name: 'Kauan Kubia',
      department: 'HR',
      role: 'admin',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'user-2',
      email: 'user1@company.com',
      name: 'João Silva',
      department: 'Sales',
      role: 'user',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'user-3',
      email: 'user2@company.com',
      name: 'Maria Santos',
      department: 'Operations',
      role: 'user',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ],

  // Progresso simulado
  progress: {
    '9c29865f-3634-415c-8625-a431c86f696d': {
      '0da59ce5-5a65-4ba5-96e2-fb28cca19bfb': 75,
      '44700197-7955-4926-ab04-9279fa6424c1': 100,
      'f38f1441-81b1-4c36-919f-0ae025ba1b2b': 100,
      '4fa6946c-7d65-410c-b456-9d8d9672cb25': 50
    }
  }
}

// Estado global do modo offline
let isOfflineMode = false
let offlineReason = ''

export const enableOfflineMode = (reason: string = 'Problemas de conectividade') => {
  isOfflineMode = true
  offlineReason = reason
  console.log('🚨 MODO OFFLINE ATIVADO:', reason)
  
  // Salvar no localStorage para persistir entre reloads
  if (typeof window !== 'undefined') {
    localStorage.setItem('offline-mode', 'true')
    localStorage.setItem('offline-reason', reason)
  }
}

export const disableOfflineMode = () => {
  isOfflineMode = false
  offlineReason = ''
  console.log('✅ MODO OFFLINE DESATIVADO')
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('offline-mode')
    localStorage.removeItem('offline-reason')
  }
}

export const getOfflineStatus = () => {
  // Verificar localStorage na inicialização
  if (typeof window !== 'undefined' && !isOfflineMode) {
    const savedMode = localStorage.getItem('offline-mode')
    const savedReason = localStorage.getItem('offline-reason')
    if (savedMode === 'true') {
      isOfflineMode = true
      offlineReason = savedReason || 'Modo offline ativo'
    }
  }
  
  return {
    isOffline: isOfflineMode,
    reason: offlineReason
  }
}

// Funções para simular queries do Supabase
export const offlineGetCourses = (userId: string, isAdmin: boolean = false) => {
  console.log('📱 OFFLINE: Carregando cursos locais')
  
  // Simular delay mínimo
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: OFFLINE_DATA.courses,
        error: null
      })
    }, 100) // 100ms apenas
  })
}

export const offlineGetVideos = (courseId: string) => {
  console.log('📱 OFFLINE: Carregando vídeos locais para curso:', courseId)
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const videos = (OFFLINE_DATA.videos as any)[courseId] || []
      resolve({
        data: videos,
        error: null
      })
    }, 50) // 50ms apenas
  })
}

export const offlineGetUserProgress = (userId: string, courseIds: string[]) => {
  console.log('📱 OFFLINE: Carregando progresso local')
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const userProgress = (OFFLINE_DATA.progress as any)[userId] || {}
      const progressData = courseIds.map(courseId => ({
        course_id: courseId,
        progress: userProgress[courseId] || 0,
        user_id: userId
      }))
      
      resolve({
        data: progressData,
        error: null
      })
    }, 30) // 30ms apenas
  })
}

export const offlineGetDashboardStats = (userId: string) => {
  console.log('📱 OFFLINE: Calculando estatísticas locais')
  
  const userProgress = (OFFLINE_DATA.progress as any)[userId] || {}
  const completedCourses = Object.values(userProgress).filter((p: any) => p >= 100).length
  const totalCourses = OFFLINE_DATA.courses.length
  const totalWatchTime = OFFLINE_DATA.courses.reduce((acc, course) => acc + course.duration, 0)
  
  return {
    totalCourses,
    completedCourses,
    totalWatchTime,
    certificatesEarned: completedCourses,
    totalUsers: OFFLINE_DATA.users.length
  }
}

// Detectar automaticamente quando ativar modo offline
export const autoDetectOfflineMode = () => {
  // Ativar modo offline se houver muitos erros consecutivos
  let errorCount = 0
  const maxErrors = 2 // Apenas 2 erros para ativar
  
  return {
    reportError: (error: any) => {
      errorCount++
      console.log(`❌ Erro ${errorCount}/${maxErrors}:`, error?.message || error)
      
      if (errorCount >= maxErrors && !isOfflineMode) {
        enableOfflineMode('Muitos erros de conectividade detectados')
        return true // Indica que modo offline foi ativado
      }
      return false
    },
    
    reportSuccess: () => {
      if (errorCount > 0) {
        errorCount = Math.max(0, errorCount - 1) // Reduzir contador em caso de sucesso
      }
    },
    
    reset: () => {
      errorCount = 0
    }
  }
}