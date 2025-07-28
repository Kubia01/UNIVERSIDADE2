'use client'

// Força renderização dinâmica para evitar problemas de SSG
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Course, Lesson, Department } from '@/lib/supabase'
import { cacheHelpers } from '@/lib/cache'
import { emergencyGetVideos, emergencyGetCourses, preloadCriticalData } from '@/lib/supabase-emergency'
import { coursesCache, smartPreloader, usersCache } from '@/lib/ultra-cache'
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
    __dashboardOptimized?: boolean
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
    if (employees.length !== 0) { // Só log quando há mudança significativa
      console.log('👥 [Dashboard] Estado employees mudou:', employees.length)
    }
  }, [employees.length])

  // Pré-carregamento inteligente quando usuário é carregado
  useEffect(() => {
    if (user && !window.__dashboardOptimized) {
      window.__dashboardOptimized = true
      console.log('🚀 [Dashboard] Iniciando otimização para usuário:', user.name)
      
      // Pré-carregar dados críticos em background
      preloadCriticalData(user.id, user.role === 'admin').catch(console.error)
      
      // Carregar dashboard data apenas se necessário
      if (activeView === 'dashboard') {
        loadDashboardData(user)
      }
    }
  }, [user, activeView])

  const checkUser = async () => {
    try {
      console.log('🔑 Verificando autenticação do usuário...')
      const authUser = await getCurrentUser()
      
      if (!authUser) {
        console.log('❌ Usuário não autenticado, redirecionando...')
        router.push('/auth/login')
        return
      }

      // Buscar dados completos do perfil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !profile) {
        console.error('❌ Erro ao carregar perfil:', error)
        router.push('/auth/login')
        return
      }

      console.log('✅ Usuário autenticado:', profile.name, 'Role:', profile.role)
      setUser(profile)
      
    } catch (error) {
      console.error('💥 Erro ao verificar usuário:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async (currentUser: User) => {
    // Verificar se dados já estão em cache para evitar carregamento desnecessário
    const cachedDashboard = cacheHelpers.getDashboard(currentUser.id) as any
    if (cachedDashboard && cachedDashboard.stats) {
      console.log('⚡ [Dashboard] Usando dados em cache')
      setStats(cachedDashboard.stats)
      if (cachedDashboard.recentCourses) {
        setRecentCourses(cachedDashboard.recentCourses)
      }
      return
    }
    
    console.log('📊 [Dashboard] Carregando dados para:', currentUser.name)
    setDashboardLoading(true)
    
    try {
      // Carregar cursos com cache inteligente
      const coursesResult = await emergencyGetCourses(currentUser.id, currentUser.role === 'admin')
      const courses = coursesResult.data || []
      
      console.log('✅ [Dashboard] Cursos carregados:', courses.length)
      setRecentCourses(courses.slice(0, 3)) // Primeiros 3 para seção "recent"
      
      // Carregar usuários apenas para admins e com cache
      if (currentUser.role === 'admin') {
        const cachedUsers = usersCache.get('all')
        if (cachedUsers) {
          console.log('⚡ [Dashboard] Usuários do cache:', cachedUsers.length)
          setEmployees(cachedUsers)
        } else {
          loadUsers()
        }
      }
      
      // Calcular estatísticas básicas
      const newStats: DashboardStats = {
        totalCourses: courses.length,
        completedCourses: 0, // Será calculado quando progresso for carregado
        totalWatchTime: courses.reduce((total: number, course: Course) => total + (course.duration || 0), 0),
        certificatesEarned: 0,
        totalUsers: currentUser.role === 'admin' ? employees.length : 1
      }
      
      setStats(newStats)
      
      // Salvar no cache para próximas visitas
      const dashboardData = {
        stats: newStats,
        recentCourses: courses.slice(0, 3)
      }
      cacheHelpers.setDashboard(currentUser.id, dashboardData)
      
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao carregar dados:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      console.log('👥 [Dashboard] Carregando usuários...')
      
      const { data: usersData, error } = await supabase
        .from('profiles') // Changed from 'users' to 'profiles' to match existing code
        .select('id, name, email, department, role, avatar, created_at, updated_at')
        .order('name', { ascending: true }) // Changed order to match existing code
        .limit(50) // Limitar para performance
      
      if (error) {
        console.error('❌ Erro ao carregar usuários:', error)
        return
      }
      
      const users = usersData || []
      console.log('✅ [Dashboard] Usuários carregados:', users.length)
      
      setEmployees(users)
      usersCache.set(users, 'all') // Salvar no cache
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar usuários:', error)
    }
  }

  // Handlers otimizados
  const handleViewChange = (view: string) => {
    setActiveView(view as AppView)
    
    // Limpar estados relacionados à visualização anterior
    if (view !== 'courses') {
      setSelectedCourse(null)
      setSelectedLesson(null)
      setShowCourseModule(false)
    }
  }

  const handleCourseSelect = (course: Course) => {
    console.log('🎯 [Dashboard] Curso selecionado:', course.title)
    setSelectedCourse(course)
    setActiveView('courses')
    setShowCourseModule(true)
  }

  const handleLessonSelect = (lesson: Lesson) => {
    console.log('📺 [Dashboard] Lição selecionada:', lesson.title)
    setSelectedLesson(lesson)
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
    setSelectedLesson(null)
    setShowCourseModule(false)
  }

  const handleEmployeeSelect = (employee: User | null) => {
    console.log('👤 [Dashboard] Employee selecionado:', employee?.name || 'Todos')
    setSelectedEmployee(employee)
    
    // Recarregar dados do dashboard para o employee selecionado
    if (employee) {
      loadDashboardData(employee)
    } else if (user) {
      loadDashboardData(user)
    }
  }

  // Loading inicial otimizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Carregando...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde um momento
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Será redirecionado para login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onViewChange={handleViewChange}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={async () => {
            await supabase.auth.signOut()
            router.push('/auth/login')
          }}
        />

        <main className="flex-1 overflow-auto">
          {/* Renderização condicional otimizada */}
          {activeView === 'dashboard' && (
            <div className="p-6">
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Bem-vindo, {selectedEmployee?.name || user.name}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Acompanhe seu progresso e explore novos cursos
                    </p>
                  </div>
                  
                  {/* Seletor de Employee para Admins */}
                  {user.role === 'admin' && employees.length > 0 && (
                    <div className="min-w-64">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filtrar por colaborador:
                      </label>
                      <select
                        value={selectedEmployee?.id || ''}
                        onChange={(e) => {
                          const employeeId = e.target.value
                          const employee = employees.find(emp => emp.id === employeeId) || null
                          handleEmployeeSelect(employee)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Visão Geral (Todos)</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} - {employee.department}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Estatísticas do Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total de Cursos
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalCourses}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Concluídos
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.completedCourses}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tempo de Estudo
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatStudyTime(stats.totalWatchTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {user.role === 'admin' ? 'Total Usuários' : 'Certificados'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.role === 'admin' ? stats.totalUsers : stats.certificatesEarned}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cursos Recentes */}
              {recentCourses.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Cursos Disponíveis
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentCourses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleCourseSelect(course)}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {course.description?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration} min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state para dashboard */}
              {dashboardLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Carregando dados do dashboard...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'courses' && !showCourseModule && (
            <CourseViewer user={selectedEmployee || user} onCourseSelect={handleCourseSelect} />
          )}

          {activeView === 'courses' && showCourseModule && selectedCourse && (
            <CourseModule
              course={selectedCourse}
              user={selectedEmployee || user}
              onBack={handleBackToCourses}
              onLessonSelect={handleLessonSelect}
            />
          )}

          {selectedLesson && selectedCourse && (
            <LessonPlayer
              lesson={selectedLesson}
              course={selectedCourse}
              user={selectedEmployee || user}
              onBack={() => setSelectedLesson(null)}
              onComplete={() => {
                console.log('Lição completada')
                // Recarregar dados se necessário
              }}
              onNext={() => {
                console.log('Próxima lição')
                // Implementar navegação para próxima lição
              }}
              onPrevious={() => {
                console.log('Lição anterior')
                // Implementar navegação para lição anterior
              }}
              hasNext={false} // Implementar lógica para verificar se há próxima lição
              hasPrevious={false} // Implementar lógica para verificar se há lição anterior
            />
          )}

          {activeView === 'content' && user.role === 'admin' && (
            <CoursesAndTraining 
              user={user}
              onCourseSelect={handleCourseSelect}
            />
          )}

          {activeView === 'users' && user.role === 'admin' && (
            <UserManagement />
          )}

          {activeView === 'certificates' && (
            <CertificateViewer user={selectedEmployee || user} />
          )}

          {activeView === 'settings' && (
            <AdminSettings />
          )}
        </main>
      </div>
    </div>
  )
}
