'use client'

// Força renderização dinâmica para evitar problemas de SSG
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Course, Lesson, Department } from '@/lib/supabase'
import { cacheHelpers } from '@/lib/cache'
import { emergencyGetVideos, emergencyGetCourses, useFallbackData } from '@/lib/supabase-emergency'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import UserManagement from '@/components/admin/UserManagement'
import CourseManagement from '@/components/admin/CourseManagement'
import CourseAssignment from '@/components/admin/CourseAssignment'
import CourseViewer from '@/components/courses/CourseViewer'
import LessonPlayer from '@/components/courses/LessonPlayer'
import CourseModule from '@/components/courses/CourseModule'
import CoursesAndTraining from '@/components/courses/CoursesAndTraining'
import CertificateManagement from '@/components/certificates/CertificateManagement'
import CertificateViewer from '@/components/certificates/CertificateViewer'
import AdminSettings from '@/components/admin/AdminSettings'
import { PlayCircle, BookOpen, Users, Trophy, Clock, Star } from 'lucide-react'
import { DashboardSkeleton, FastLoading } from '@/components/ui/SkeletonLoader'
import AdaptiveColorDemo from '@/components/utils/AdaptiveColorDemo'
import { ConnectionStatus, useConnectionStatus } from '@/components/ui/ConnectionStatus'

// Declaração global para evitar múltiplas execuções
declare global {
  interface Window {
    __userLoadInProgress?: boolean
  }
}

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  totalWatchTime: number // em minutos
  certificatesEarned: number
  totalUsers: number
}

type AppView = 'dashboard' | 'courses' | 'certificates' | 'content' | 'users' | 'settings' | 'notifications'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<AppView>('dashboard')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showCourseModule, setShowCourseModule] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null)
  const [employees, setEmployees] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    totalWatchTime: 0,
    certificatesEarned: 0,
    totalUsers: 0
  })
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const [dashboardProgress, setDashboardProgress] = useState<{[key: string]: number}>({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const router = useRouter()
  
  // Status de conexão
  const connectionStatus = useConnectionStatus()

  // Função para formatar tempo de estudo
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours}h`
      } else {
        return `${hours}h ${remainingMinutes}min`
      }
    }
  }

  useEffect(() => {
    // Evitar múltiplas execuções simultâneas
    if (window.__userLoadInProgress) return
    window.__userLoadInProgress = true
    
    checkUser().finally(() => {
      window.__userLoadInProgress = false
    })
  }, [])

  // Monitorar mudanças no estado employees
  useEffect(() => {
    console.log('👥 [Dashboard] Estado employees mudou:', employees.length)
    if (employees.length > 0) {
      console.log('✅ [Dashboard] Employees carregados com sucesso no estado')
    }
  }, [employees])

  // Carregar dados iniciais quando user é definido pela primeira vez
  useEffect(() => {
    if (user && !loading) {
      console.log('🚀 [Dashboard] Carregamento inicial para:', user.name, 'ID:', user.id)
      loadDashboardData(user)
    }
  }, [user, loading]) // Carregar apenas quando user muda ou loading termina

  // Recarregar dados quando funcionário selecionado mudar ou quando houver trigger
  useEffect(() => {
    if (user && selectedEmployee) {
      // Proteção contra loops infinitos
      if (!selectedEmployee.id) {
        console.error('🚨 [Dashboard] Employee sem ID detectado:', selectedEmployee)
        return
      }
      
      console.log('🔄 [Dashboard] Recarregando para employee:', selectedEmployee.name, 'ID:', selectedEmployee.id)
      
      // Debounce para evitar múltiplas chamadas rápidas quando há problemas de cache
      const timeoutId = setTimeout(() => {
        loadDashboardData(selectedEmployee)
      }, 100) // Reduzir delay para melhor responsividade
      
      return () => clearTimeout(timeoutId)
    }
  }, [selectedEmployee, refreshTrigger]) // Apenas quando employee muda ou há trigger

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      console.log('getCurrentUser resultado:', currentUser)
      
      if (currentUser && currentUser.id) {
        // Verificar cache primeiro
        const cachedUser = cacheHelpers.getUser(currentUser.id) as User | null
        if (cachedUser) {
          console.log('Usuário carregado do cache:', cachedUser.name)
          setUser(cachedUser)
          setLoading(false)
          return
        }
        
        console.log('Carregando perfil para usuário ID:', currentUser.id)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        console.log('Resultado da consulta do perfil:', { profile, profileError })
        
        if (profileError) {
          console.error('Erro ao carregar perfil:', profileError)
          console.error('Código do erro:', profileError.code)
          console.error('Detalhes do erro:', profileError.details)
          console.error('Hint do erro:', profileError.hint)
          
          // Se o perfil não existe ou há erro 500, tentar criar um básico
          if (profileError.code === 'PGRST116' || profileError.code === '500' || profileError.message?.includes('500')) {
            console.log('Perfil não encontrado, tentando criar...')
            
            // Primeiro, verificar se o perfil já existe (pode ser problema de RLS)
            const { data: existingProfile, error: checkError } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', currentUser.email)
              .maybeSingle()
            
                          if (existingProfile) {
                console.log('Perfil encontrado pelo email:', existingProfile)
                setUser(existingProfile)
                return
              }
            
            // Se realmente não existe, tentar criar
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: currentUser.id,
                email: currentUser.email || '',
                name: currentUser.email?.split('@')[0] || 'Usuário',
                role: 'user',
                department: 'HR'
              }])
              .select()
              .single()
            
            if (createError) {
              console.error('Erro ao criar perfil:', createError)
              console.error('Código do erro de criação:', createError.code)
              
              // Se erro 409 (conflito), tentar buscar o perfil existente
              if (createError.code === '23505' || createError.code === '409') {
                console.log('Perfil já existe, tentando buscar novamente...')
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', currentUser.id)
                  .single()
                
                if (retryProfile) {
                  console.log('Perfil encontrado na segunda tentativa:', retryProfile)
                  setUser(retryProfile)
                  return
                }
              }
              
              router.push('/login')
              return
            } else {
              console.log('Perfil criado com sucesso:', newProfile)
              setUser(newProfile)
              return // Evitar carregar dados novamente abaixo
            }
          } else {
            router.push('/login')
            return
          }
        } else if (profile) {
          console.log('Usuário carregado:', profile.name, 'role:', profile.role)
          // Salvar no cache
          cacheHelpers.setUser(profile.id, profile)
          setUser(profile)
        } else {
          console.log('Perfil retornou null')
          router.push('/login')
          return
        }
      } else {
        console.log('getCurrentUser retornou null ou sem ID')
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (userProfile?: User) => {
    const currentUser = userProfile || user
    if (!currentUser || !currentUser.id) {
      console.log('loadDashboardData: usuário não definido ou sem ID', { userProfile, user })
      return
    }

    // Proteção contra usuários inválidos
    if (!currentUser.name || !currentUser.email) {
      console.error('🚨 [Dashboard] Usuário com dados incompletos:', currentUser)
      return
    }

    // Iniciar loading state
    setDashboardLoading(true)
    setLoadingTimeout(false)
    
    // Timeout para mostrar mensagem se demorar muito
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true)
    }, 3000) // 3 segundos

    // USAR targetUserId para cache específico do usuário
    const targetUserId = selectedEmployee?.id || currentUser.id
    
    // Validar targetUserId
    if (!targetUserId) {
      console.error('🚨 [Dashboard] targetUserId inválido')
      return
    }
    
    // Verificar cache PRIMEIRO - PRIORIDADE MÁXIMA
    const cachedDashboard = cacheHelpers.getDashboard(targetUserId) as any
    if (cachedDashboard) {
      console.log('⚡ DASHBOARD CACHE HIT para:', targetUserId)
      setStats(cachedDashboard.stats)
      setRecentCourses(cachedDashboard.recentCourses)
      setDashboardProgress(cachedDashboard.progress)
      
      // Se há employees no cache E é admin, usar do cache e retornar
      if (cachedDashboard.employees && cachedDashboard.employees.length > 0 && currentUser?.role === 'admin') {
        console.log('📊 [Dashboard] Restaurando employees do cache:', cachedDashboard.employees.length)
        setEmployees(cachedDashboard.employees)
        clearTimeout(timeoutId)
        setDashboardLoading(false)
        return
      }
      
      // Se não há employees no cache mas é admin, continuar para carregar employees
      if (currentUser?.role === 'admin') {
        console.log('📊 [Dashboard] Cache sem employees, continuando para carregar usuários')
        // Continuar execução para carregar employees
      } else {
        // Se não é admin, pode retornar
        return
      }
    }

    try {
      console.log('Carregando dados do dashboard para usuário:', currentUser.email, 'role:', currentUser.role, 'id:', currentUser.id)
      
      // USAR SISTEMA DE EMERGÊNCIA PARA CURSOS (ULTRA RÁPIDO)
      console.log('📊 [Dashboard] Carregando cursos via sistema de emergência para:', targetUserId)
      const isTargetAdmin = selectedEmployee ? selectedEmployee.role === 'admin' : currentUser.role === 'admin'
      
      const coursesResult = await emergencyGetCourses(
        isTargetAdmin ? 'admin' : targetUserId, 
        isTargetAdmin
      )
      
      let courses, coursesError
      if (coursesResult.error) {
        console.error('❌ [Dashboard] Erro ao carregar cursos:', coursesResult.error)
        courses = []
        coursesError = coursesResult.error
      } else {
        // Pegar apenas os 6 mais recentes para o dashboard
        courses = (coursesResult.data || []).slice(0, 6)
        coursesError = null
        console.log('✅ [Dashboard] Cursos carregados via cache:', courses.length)
      }

      if (coursesError) {
        console.error('Erro ao carregar cursos:', coursesError)
        setRecentCourses([])
      } else {
        setRecentCourses(courses || [])
        
        // Carregar progresso dos cursos para o dashboard (usar targetUserId)
        if (courses && courses.length > 0) {
          const courseIds = courses.map((c: Course) => c.id)
          loadDashboardProgress(courseIds, targetUserId)
        }
      }

      // CARREGAMENTO OTIMIZADO DE USUÁRIOS (SEMPRE PARA ADMINS)
      // Corrigir: Sempre manter employees carregados para usuários admin, independentemente do usuário visualizado
      // IMPORTANTE: Usar o usuário logado original (user) para verificar se é admin, não o selectedEmployee
      const originalUser = user || currentUser
      if (originalUser?.role === 'admin') {
        console.log('📊 [Dashboard] Admin detectado - carregando usuários via cache')
        
        // Verificar cache de usuários primeiro
        const cachedUsers = cacheHelpers.getUsers() as User[]
        if (cachedUsers && cachedUsers.length > 0) {
          console.log('⚡ [Dashboard] CACHE HIT: Usuários carregados do cache:', cachedUsers.length)
          setEmployees(cachedUsers)
        } else {
          console.log('📡 [Dashboard] Cache miss - carregando usuários da base')
          
          try {
            const { data: realUsers, error: realError } = await supabase
              .from('profiles')
              .select('id, name, email, department, role, avatar, created_at, updated_at')
              .order('name', { ascending: true })

            if (!realError && realUsers && realUsers.length > 0) {
              const formattedUsers: User[] = realUsers.map((u: any) => ({
                id: u.id,
                name: u.name || u.email || 'Usuário sem nome',
                email: u.email,
                department: (u.department as Department) || 'HR',
                role: (u.role as 'admin' | 'user') || 'user',
                avatar: u.avatar || '',
                created_at: u.created_at || new Date().toISOString(),
                updated_at: u.updated_at || new Date().toISOString(),
              }))
              
              console.log('✅ [Dashboard] Usuários carregados da base:', formattedUsers.length)
              
              // Usar callback para garantir atualização
              setEmployees(prev => {
                console.log('🔄 [Dashboard] Atualizando employees de', prev.length, 'para', formattedUsers.length)
                return formattedUsers
              })
              
              // Salvar no cache por 30 minutos
              cacheHelpers.setUsers(formattedUsers)
            } else {
              console.error('❌ [Dashboard] Erro ao carregar usuários:', realError)
              // CORREÇÃO: Não limpar employees se houve erro, manter lista existente
              if (employees.length === 0) {
                setEmployees([])
              }
            }
          } catch (error) {
            console.error('❌ [Dashboard] Erro no carregamento de usuários:', error)
            // CORREÇÃO: Não limpar employees se houve erro, manter lista existente
            if (employees.length === 0) {
              setEmployees([])
            }
          }
        }
      } else {
        // CORREÇÃO: Se o usuário logado não é admin, limpar apenas se não há usuário selecionado
        // Isso permite que admins vejam dados de não-admins sem perder o filtro
        if (!selectedEmployee) {
          console.log('📊 [Dashboard] Usuário não é admin - lista de funcionários não necessária')
          setEmployees([])
        } else {
          console.log('📊 [Dashboard] Mantendo lista de employees para permitir troca de usuário')
        }
      }

      // Buscar estatísticas do usuário específico (usando targetUserId já definido acima)
      // Buscar certificados do usuário específico
      const { data: certificates, error: certificatesError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', targetUserId)
      
      if (certificatesError) {
        console.error('Erro ao carregar certificados:', certificatesError)
      }

      // Buscar progresso dos cursos para calcular cursos concluídos
      let userProgress: any[] = []
      let completedCoursesCount = 0
      
      try {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('course_id, progress, completed_at')
          .eq('user_id', targetUserId)
        
        if (progressError) {
          console.error('Erro ao carregar progresso do usuário:', progressError)
          console.error('Código do erro:', progressError.code)
          console.error('Detalhes:', progressError.details)
        } else {
          userProgress = progressData || []
          // Calcular cursos concluídos (100% de progresso)
          completedCoursesCount = userProgress.filter(p => p.progress >= 100).length
          console.log('Dados do progresso do usuário:', userProgress)
          console.log('Cursos concluídos encontrados:', completedCoursesCount)
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar progresso:', error)
      }

      // Buscar tempo total de estudo das aulas concluídas
      let totalWatchTimeMinutes = 0
      
      try {
        const { data: completedLessons, error: lessonsError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', targetUserId)
          .not('completed_at', 'is', null)
        
        if (lessonsError) {
          console.error('Erro ao carregar aulas concluídas:', lessonsError)
          console.error('Código do erro:', lessonsError.code)
        } else if (completedLessons && completedLessons.length > 0) {
          console.log('Aulas concluídas encontradas:', completedLessons.length)
          
          // Buscar duração configurada das aulas concluídas
          const lessonIds = completedLessons.map(l => l.lesson_id)
          const { data: videosData, error: videosError } = await supabase
            .from('videos')
            .select('id, duration')
            .in('id', lessonIds)
          
          if (videosError) {
            console.error('Erro ao carregar dados dos vídeos:', videosError)
          } else if (videosData) {
            // Somar a duração configurada (em minutos) de todas as aulas concluídas
            totalWatchTimeMinutes = videosData.reduce((total, video) => {
              return total + (video.duration || 0)
            }, 0)
            console.log('Aulas concluídas:', videosData.length)
            console.log('Dados dos vídeos:', videosData)
            console.log('Tempo total de estudo (duração configurada):', totalWatchTimeMinutes, 'minutos')
          }
        } else {
          console.log('Nenhuma aula concluída encontrada para o usuário:', targetUserId)
        }
      } catch (error) {
        console.error('Erro inesperado ao calcular tempo de estudo:', error)
      }

      // Buscar total de certificados para admins na visão geral
      let totalCertificatesForAdmin = 0
      if (currentUser?.role === 'admin' && !selectedEmployee) {
        try {
          const { count: certificatesCount, error: certificatesCountError } = await supabase
            .from('certificates')
            .select('*', { count: 'exact', head: true })
          
          if (!certificatesCountError) {
            totalCertificatesForAdmin = certificatesCount || 0
          }
        } catch (error) {
          console.error('Erro ao contar certificados totais:', error)
        }
      }

      // Calcular estatísticas finais (manter tempo em minutos para melhor formatação)
      const finalStats = {
        totalCourses: courses?.length || 0,
        completedCourses: completedCoursesCount,
        totalWatchTime: totalWatchTimeMinutes, // Manter em minutos
        certificatesEarned: selectedEmployee ? (certificates?.length || 0) : 
                           (currentUser?.role === 'admin' && !selectedEmployee) ? totalCertificatesForAdmin : 
                           (certificates?.length || 0),
        totalUsers: currentUser?.role === 'admin' ? (employees.length || 0) : 0
      }
      
      console.log('Estatísticas finais calculadas:', finalStats)
      setStats(finalStats)
      
      // Salvar no cache
      const dashboardData = {
        stats: finalStats,
        recentCourses: courses || [],
        progress: {},
        employees: currentUser?.role === 'admin' ? employees : []
      }
      cacheHelpers.setDashboard(targetUserId, dashboardData)
      
      // Limpar loading state - sucesso
      clearTimeout(timeoutId)
      setDashboardLoading(false)
      setLoadingTimeout(false)
      
    } catch (error) {
      console.error('💥 [Dashboard] Erro crítico ao carregar dados para:', targetUserId, error)
      
      // Tentar carregar dados básicos em caso de erro
      try {
        setStats({
          totalCourses: 0,
          completedCourses: 0,
          totalWatchTime: 0,
          certificatesEarned: 0,
          totalUsers: 0
        })
        setRecentCourses([])
        setDashboardProgress({})
        
        // Se for admin e o erro foi nos employees, tentar carregar do cache
        if (currentUser?.role === 'admin') {
          const cachedUsers = cacheHelpers.getUsers() as User[]
          if (cachedUsers && cachedUsers.length > 0) {
            console.log('🔄 [Dashboard] Usando cache de usuários como fallback')
            setEmployees(cachedUsers)
          }
        }
      } catch (fallbackError) {
        console.error('💥 [Dashboard] Erro mesmo no fallback:', fallbackError)
      }
      
      // Limpar loading state - erro
      clearTimeout(timeoutId)
      setDashboardLoading(false)
      setLoadingTimeout(false)
    }
  }

  const loadDashboardProgress = async (courseIds: string[], userId: string) => {
    // Cache key específico para progresso
    const progressCacheKey = `progress-${userId}-${courseIds.join(',')}`
    
    // Verificar cache primeiro
    const cachedProgress = cacheHelpers.getProgress?.(userId) as {[key: string]: number}
    if (cachedProgress && Object.keys(cachedProgress).length > 0) {
      console.log('⚡ [Dashboard] CACHE HIT: Progresso carregado do cache')
      setDashboardProgress(cachedProgress)
      return
    }
    
    try {
      console.log('📡 [Dashboard] Carregando progresso da base para:', courseIds.length, 'cursos')
      
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('course_id, progress')
        .eq('user_id', userId)
        .in('course_id', courseIds)

      if (!error && progressData) {
        const progressMap: {[key: string]: number} = {}
        progressData.forEach(p => {
          progressMap[p.course_id] = p.progress || 0
        })
        
        setDashboardProgress(progressMap)
        console.log('✅ [Dashboard] Progresso carregado:', Object.keys(progressMap).length, 'cursos')
        
        // Salvar no cache por 15 minutos
        if (cacheHelpers.setProgress) {
          cacheHelpers.setProgress(userId, progressMap)
        }
      } else {
        console.log('📊 [Dashboard] Nenhum progresso encontrado')
        setDashboardProgress({})
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao carregar progresso:', error)
      setDashboardProgress({})
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCourseSelect = async (course: Course) => {
    console.log('[page.tsx] ⚡ CARREGAMENTO ULTRA RÁPIDO:', course.title)
    
    try {
      // Sistema de emergência OTIMIZADO
      const result = await emergencyGetVideos(course.id)
      
      let videos = result.data || []
      
      if (result.error) {
        console.error('[page.tsx] ❌ Erro ao carregar aulas:', result.error)
        
        // Usar dados de fallback se disponível
        const fallbackVideos = useFallbackData('videos', course.id)
        videos = fallbackVideos as any[]
        
        if (videos.length === 0) {
          alert('⚠️ Não foi possível carregar as aulas. Tente novamente em alguns instantes.')
          return
        }
      }
      
      const lessons = videos.map((v: any) => ({ ...v, content: v.video_url }))
      console.log('[page.tsx] ✅ Aulas carregadas:', lessons.length)
      
      const courseWithLessons = { ...course, lessons }
      setSelectedCourse(courseWithLessons)
      setShowCourseModule(true)
      setSelectedLesson(null)
      
    } catch (err) {
      console.error('[page.tsx] 💥 Erro crítico em handleCourseSelect:', err)
      
      // Fallback final - mostrar curso mesmo sem aulas
      const courseWithEmptyLessons = { 
        ...course, 
        lessons: [{
          id: 'temp-lesson',
          course_id: course.id,
          title: 'Carregando aulas...',
          description: 'As aulas estão sendo carregadas. Tente recarregar em alguns instantes.',
          order_index: 1,
          duration: 0,
          content: '',
          type: 'video' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      }
      setSelectedCourse(courseWithEmptyLessons)
      setShowCourseModule(true)
      setSelectedLesson(null)
    }
  }

  const handleLessonStart = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setShowCourseModule(false)
  }

  const handleLessonComplete = () => {
    console.log('Lesson completed')
    // Recarregar dados do dashboard após conclusão da aula
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 2000) // Aguardar 2 segundos para garantir que o progresso foi salvo
  }

  const handleLessonNavigation = (direction: 'next' | 'previous') => {
    if (!selectedCourse || !selectedLesson) return
    
    const currentIndex = selectedCourse.lessons?.findIndex(l => l.id === selectedLesson.id) || 0
    let newIndex
    
    if (direction === 'next') {
      newIndex = currentIndex + 1
    } else {
      newIndex = currentIndex - 1
    }
    
    if (selectedCourse.lessons && newIndex >= 0 && newIndex < selectedCourse.lessons.length) {
      setSelectedLesson(selectedCourse.lessons[newIndex])
    }
  }

  const renderMainContent = () => {
    // Show lesson player if a lesson is selected
    if (selectedLesson && selectedCourse && user) {
      console.log('Renderizando LessonPlayer com:', { selectedLesson, selectedCourse })
      const currentIndex = selectedCourse.lessons?.findIndex(l => l.id === selectedLesson.id) || 0
      return (
        <LessonPlayer
          course={selectedCourse}
          lesson={selectedLesson}
          user={user}
          onBack={() => {
            setSelectedLesson(null)
            setShowCourseModule(true)
          }}
          onComplete={handleLessonComplete}
          onNext={() => handleLessonNavigation('next')}
          onPrevious={() => handleLessonNavigation('previous')}
          hasNext={selectedCourse.lessons ? currentIndex < selectedCourse.lessons.length - 1 : false}
          hasPrevious={currentIndex > 0}
        />
      )
    }

    // Show course module if a course is selected
    if (showCourseModule && selectedCourse && user) {
      return (
        <CourseModule
          course={selectedCourse}
          user={user}
          onBack={() => {
            setShowCourseModule(false)
            setSelectedCourse(null)
          }}
          onLessonSelect={handleLessonStart}
        />
      )
    }

    switch (activeView) {
      case 'users':
        return user?.role === 'admin' ? <UserManagement /> : <div className="p-6 text-center">Acesso negado</div>
      
      case 'courses':
        return <CoursesAndTraining user={user!} onCourseSelect={handleCourseSelect} />
      
      case 'certificates':
        return user?.role === 'admin' ? <CertificateManagement /> : <CertificateViewer user={user!} />
      
      case 'content':
        return user?.role === 'admin' ? <CourseAssignment /> : <div className="p-6 text-center">Acesso negado</div>
      
      case 'settings':
        return user?.role === 'admin' ? <AdminSettings /> : <div className="p-6 text-center">Acesso negado</div>
      
      case 'notifications':
        return renderNotificationsView()
      
      default:
        return renderDashboardView()
    }
  }

  const renderDashboardView = () => (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedEmployee 
                ? `Dashboard de ${selectedEmployee.name}`
                : `Bem-vindo${user?.role === 'admin' ? ' ao painel administrativo' : ' à sua jornada de aprendizado'}!`
              }
            </h2>
            <p className="text-gray-600">
              {selectedEmployee 
                ? `Acompanhe o progresso de ${selectedEmployee.name} nos treinamentos`
                : user?.role === 'admin'
                ? 'Gerencie a plataforma e acompanhe o progresso dos colaboradores.'
                : 'Continue desenvolvendo suas habilidades com nossos cursos de treinamento.'
              }
            </p>
          </div>
          
          {/* Filtro de Colaboradores para Admins */}
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-4">
              <div className="min-w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por colaborador:
                </label>
                {(() => {
                  console.log('🔍 [Dashboard] Renderizando dropdown. Employees:', employees.length, employees.map(e => ({ id: e.id, name: e.name })))
                  return null
                })()}
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const employeeId = e.target.value
                    const employee = employees.find(emp => emp.id === employeeId) || null
                    console.log('👤 [Dashboard] Usuário selecionado:', employee?.name || 'Todos')
                    
                    // Limpar cache do usuário anterior se necessário para forçar atualização
                    if (selectedEmployee && window.localStorage) {
                      const oldCacheKeys = Object.keys(localStorage).filter(key => 
                        key.includes(`dashboard-${selectedEmployee.id}`) ||
                        key.includes(`courses-${selectedEmployee.id}`)
                      )
                      oldCacheKeys.forEach(key => {
                        console.log('🗑️ [Dashboard] Limpando cache anterior:', key)
                        localStorage.removeItem(key)
                      })
                    }
                    
                    // CORREÇÃO: Não limpar cache do novo usuário para melhor performance
                    // O cache será atualizado naturalmente quando necessário
                    
                    setSelectedEmployee(employee)
                  }}
                  className="adaptive-input w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors"
                  disabled={employees.length === 0}
                >
                  <option value="">
                    {employees.length === 0 ? 'Carregando usuários...' : 'Visão Geral (Todos)'}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </option>
                  ))}
                  {employees.length === 0 && (
                    <option value="" disabled>
                      Nenhum usuário encontrado
                    </option>
                  )}
                </select>
                
                {employees.length === 0 && user?.role === 'admin' && (
                  <div className="mt-1 text-xs">
                    <p className="text-blue-600">
                      ℹ️ Carregando usuários em segundo plano...
                    </p>
                    <p className="adaptive-text-muted mt-1">
                      A lista será carregada automaticamente em alguns segundos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay para Dashboard */}
      {dashboardLoading && (
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                {loadingTimeout ? 'Conectando com o servidor...' : 'Carregando dashboard...'}
              </p>
              {loadingTimeout && (
                <p className="text-xs text-gray-500">
                  Isso pode demorar alguns segundos devido à conectividade
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {selectedEmployee ? 'Cursos Acessíveis' : 'Cursos Disponíveis'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cursos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tempo de Estudo</p>
              <p className="text-2xl font-bold text-gray-900">{formatStudyTime(stats.totalWatchTime)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {selectedEmployee ? 'Certificados' : user?.role === 'admin' && !selectedEmployee ? 'Total de Certificados' : 'Certificados'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.certificatesEarned}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações específicas do colaborador selecionado */}
      {selectedEmployee && user?.role === 'admin' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            {selectedEmployee.avatar ? (
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {selectedEmployee.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                {selectedEmployee.name}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Email:</span>
                  <span className="ml-2 text-blue-700">{selectedEmployee.email}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Departamento:</span>
                  <span className="ml-2 text-blue-700">{selectedEmployee.department}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Perfil:</span>
                  <span className="ml-2 text-blue-700">
                    {selectedEmployee.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Cadastrado em:</span>
                  <span className="ml-2 text-blue-700">
                    {new Date(selectedEmployee.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Courses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedEmployee ? `Cursos para ${selectedEmployee.name}` : 'Cursos Disponíveis'}
          </h3>
          <button
            onClick={() => setActiveView('courses')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todos
          </button>
        </div>

        {recentCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCourses.map((course) => (
              <div key={course.id} className="card hover:shadow-lg transition-shadow">
                {/* Imagem de capa do curso */}
                {course.thumbnail && (
                  <div className="mb-4">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center text-xs adaptive-text-muted space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.duration || 15}min
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {course.department}
                      </span>
                    </div>
                  </div>
                </div>
                
                                 {/* Progress indicator */}
                 <div className="mb-4">
                   <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                     <span>Progresso</span>
                     <span>{dashboardProgress[course.id] || 0}%</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div 
                       className={`h-2 rounded-full transition-all duration-500 ${
                         (dashboardProgress[course.id] || 0) >= 100 
                           ? 'bg-green-500' 
                           : 'bg-blue-500'
                       }`} 
                       style={{ width: `${dashboardProgress[course.id] || 0}%` }}
                     ></div>
                   </div>
                   {(dashboardProgress[course.id] || 0) >= 100 && (
                     <div className="flex items-center text-xs text-green-600 mt-1">
                       <Trophy className="h-3 w-3 mr-1" />
                       Curso Concluído!
                     </div>
                   )}
                 </div>

                <button
                  onClick={() => setActiveView('courses')}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Acessar Curso
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="adaptive-text-muted">Nenhum curso disponível no momento.</p>
            <p className="text-sm text-gray-400 mt-2">
              Novos cursos serão adicionados em breve!
            </p>
          </div>
        )}
      </div>

      {/* Cards removidos conforme solicitado */}
    </div>
  )

  const renderNotificationsView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações</h2>
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="adaptive-text-muted">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen adaptive-bg">
        <div className="flex">
          {/* Sidebar skeleton */}
          <div className="w-64 adaptive-surface shadow-sm border-r adaptive-border h-screen">
            <div className="p-4">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-full h-10 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen adaptive-bg flex">
      {/* Banner de status de conexão */}
      <ConnectionStatus
        isConnected={connectionStatus.isOnline}
        hasError={connectionStatus.hasAnyError}
        errorMessage={connectionStatus.lastError}
        onRetry={() => {
          connectionStatus.clearError()
          setRefreshTrigger(prev => prev + 1)
        }}
      />
      
      <Sidebar 
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view as AppView)
          setSelectedCourse(null)
          setSelectedLesson(null)
          setShowCourseModule(false)
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-auto">
          {renderMainContent()}
        </main>
      </div>
      
      {/* Demo temporário do sistema de cores adaptativas */}
      <AdaptiveColorDemo />
    </div>
  )
}
