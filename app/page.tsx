'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Course, Lesson, Department } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import UserManagement from '@/components/admin/UserManagement'
import CourseManagement from '@/components/admin/CourseManagement'
import CourseViewer from '@/components/courses/CourseViewer'
import LessonPlayer from '@/components/courses/LessonPlayer'
import CourseModule from '@/components/courses/CourseModule'
import CoursesAndTraining from '@/components/courses/CoursesAndTraining'
import CertificateManagement from '@/components/certificates/CertificateManagement'
import CertificateViewer from '@/components/certificates/CertificateViewer'
import AdminSettings from '@/components/admin/AdminSettings'
import { PlayCircle, BookOpen, Users, Trophy, Clock, Star } from 'lucide-react'

// Declaração global para evitar múltiplas execuções
declare global {
  interface Window {
    __userLoadInProgress?: boolean
  }
}

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  totalWatchTime: number
  certificatesEarned: number
  totalUsers: number
}

type AppView = 'dashboard' | 'courses' | 'certificates' | 'users' | 'settings' | 'notifications'

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
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Recarregar dados quando funcionário selecionado mudar ou quando houver trigger
  useEffect(() => {
    if (user) {
      loadDashboardData(user)
    }
  }, [selectedEmployee, refreshTrigger]) // Adicionado refreshTrigger para forçar reload

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      console.log('getCurrentUser resultado:', currentUser)
      
      if (currentUser && currentUser.id) {
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
              setTimeout(() => {
                loadDashboardData(existingProfile)
              }, 500)
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
                  setTimeout(() => {
                    loadDashboardData(retryProfile)
                  }, 500)
                  return
                }
              }
              
              router.push('/login')
              return
            } else {
              console.log('Perfil criado com sucesso:', newProfile)
              setUser(newProfile)
              // Carregar dados do dashboard para o perfil recém-criado
              setTimeout(() => {
                console.log('Carregando dados para perfil recém-criado...')
                loadDashboardData(newProfile)
              }, 500)
              return // Evitar chamar loadDashboardData novamente abaixo
            }
          } else {
            router.push('/login')
            return
          }
        } else if (profile) {
          console.log('Usuário carregado:', profile.name, 'role:', profile.role)
          setUser(profile)
        } else {
          console.log('Perfil retornou null')
          router.push('/login')
          return
        }
        
        // Carregar dados do dashboard após definir o usuário
        setTimeout(() => {
          console.log('Iniciando carregamento dos dados do dashboard...')
          loadDashboardData(profile) // Passando o profile diretamente
        }, 500)
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

    try {
      console.log('Carregando dados do dashboard para usuário:', currentUser.email, 'role:', currentUser.role, 'id:', currentUser.id)
      
      // Buscar cursos disponíveis
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (coursesError) {
        console.error('Erro ao carregar cursos:', coursesError)
        setRecentCourses([])
      } else {
        setRecentCourses(courses || [])
        
        // Carregar progresso dos cursos para o dashboard
        if (courses && courses.length > 0) {
          const courseIds = courses.map(c => c.id)
          loadDashboardProgress(courseIds, currentUser.id)
        }
      }

      // Se for admin, carregar lista de funcionários
      if (currentUser?.role === 'admin') {
        console.log('Usuário é admin - carregando lista de funcionários...')
        
        try {
          // Método simplificado: criar lista de usuários mockados para teste
          const mockUsers: User[] = [
            {
              id: currentUser.id,
              name: currentUser.name || 'Admin Principal',
              email: currentUser.email,
              department: (currentUser.department as Department) || 'HR',
              role: currentUser.role as 'admin' | 'user',
              avatar: currentUser.avatar || '',
              created_at: currentUser.created_at || new Date().toISOString(),
              updated_at: currentUser.updated_at || new Date().toISOString()
            },
            {
              id: 'mock-user-1',
              name: 'João Silva',
              email: 'joao@empresa.com',
              department: 'Engineering' as Department,
              role: 'user' as 'admin' | 'user',
              avatar: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'mock-user-2',
              name: 'Maria Santos',
              email: 'maria@empresa.com',
              department: 'HR' as Department,
              role: 'user' as 'admin' | 'user',
              avatar: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]

          console.log('Usando usuários mockados temporariamente:', mockUsers.length)
          setEmployees(mockUsers)

                    // Tentativa em background para carregar usuários reais (apenas uma vez)
          if (!window.__userLoadInProgress) {
            window.__userLoadInProgress = true
            setTimeout(async () => {
              console.log('Tentando carregar usuários reais em background...')
              
              try {
                const { data: realUsers, error: realError } = await supabase
                  .from('profiles')
                  .select('id, name, email, department, role')
                  .order('name', { ascending: true })

                if (!realError && realUsers && realUsers.length > 0) {
                  console.log('Usuários reais carregados com sucesso:', realUsers.length)
                  setEmployees(realUsers.map((u: any): User => ({
                    id: u.id,
                    name: u.name || u.email || 'Usuário sem nome',
                    email: u.email,
                    department: (u.department as Department) || 'HR',
                    role: (u.role as 'admin' | 'user') || 'user',
                    avatar: u.avatar || '',
                    created_at: u.created_at || new Date().toISOString(),
                    updated_at: u.updated_at || new Date().toISOString(),
                  })))
                } else {
                  console.log('Mantendo usuários mockados. Erro:', realError)
                }
              } catch (bgError) {
                console.log('Erro no carregamento em background:', bgError)
              } finally {
                window.__userLoadInProgress = false
              }
            }, 1000)
          }

        } catch (error) {
          console.error('Erro ao configurar usuários:', error)
          setEmployees([])
        }
      } else {
        console.log('Usuário não é admin - não carregando lista de funcionários')
        setEmployees([])
      }

      // Buscar estatísticas do usuário atual
      const targetUserId = selectedEmployee?.id || currentUser.id
      
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
          
          // Buscar tempo realmente assistido das aulas concluídas
          const { data: watchTimeData, error: watchTimeError } = await supabase
            .from('lesson_progress')
            .select('lesson_id, time_watched')
            .eq('user_id', targetUserId)
            .not('completed_at', 'is', null)
          
          if (watchTimeError) {
            console.error('Erro ao carregar tempo assistido:', watchTimeError)
          } else if (watchTimeData) {
            // Somar o tempo realmente assistido (em segundos) e converter para minutos
            const totalWatchTimeSeconds = watchTimeData.reduce((total, lesson) => {
              return total + (lesson.time_watched || 0)
            }, 0)
            totalWatchTimeMinutes = Math.round(totalWatchTimeSeconds / 60)
            console.log('Dados do tempo assistido:', watchTimeData)
            console.log('Tempo total assistido (segundos):', totalWatchTimeSeconds)
            console.log('Tempo total assistido (minutos):', totalWatchTimeMinutes)
          }
        } else {
          console.log('Nenhuma aula concluída encontrada para o usuário:', targetUserId)
        }
      } catch (error) {
        console.error('Erro inesperado ao calcular tempo de estudo:', error)
      }

      // Converter minutos para horas
      const totalWatchTimeHours = Math.round(totalWatchTimeMinutes / 60 * 10) / 10

      // Calcular estatísticas finais
      const finalStats = {
        totalCourses: courses?.length || 0,
        completedCourses: completedCoursesCount,
        totalWatchTime: totalWatchTimeHours,
        certificatesEarned: certificates?.length || 0,
        totalUsers: currentUser?.role === 'admin' ? (employees.length || 0) : 0
      }
      
      console.log('Estatísticas finais calculadas:', finalStats)
      setStats(finalStats)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const loadDashboardProgress = async (courseIds: string[], userId: string) => {
    try {
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
        console.log('Progresso do dashboard carregado:', progressMap)
      }
    } catch (error) {
      console.error('Erro ao carregar progresso do dashboard:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCourseSelect = async (course: Course) => {
    console.log('[page.tsx] handleCourseSelect chamado para:', course)
    try {
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true })
      if (error) {
        console.error('Erro ao carregar aulas do curso:', error)
      }
      const lessons = (videos || []).map((v: any) => ({ ...v, content: v.video_url }))
      console.log('[page.tsx] Aulas carregadas:', lessons)
      const courseWithLessons = { ...course, lessons }
      setSelectedCourse(courseWithLessons)
      setShowCourseModule(true)
      setSelectedLesson(null)
    } catch (err) {
      console.error('[page.tsx] Erro em handleCourseSelect:', err)
      alert('Erro inesperado ao buscar aulas do curso.')
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
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const employeeId = e.target.value
                    const employee = employees.find(emp => emp.id === employeeId) || null
                    setSelectedEmployee(employee)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <p className="text-gray-500 mt-1">
                      Se a lista não carregar, verifique as políticas RLS no Supabase.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
              <p className="text-2xl font-bold text-gray-900">{stats.totalWatchTime}h</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {selectedEmployee ? 'Certificados' : user?.role === 'admin' ? 'Total de Usuários' : 'Certificados'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedEmployee ? stats.certificatesEarned : user?.role === 'admin' ? stats.totalUsers : stats.certificatesEarned}
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
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
            <p className="text-gray-500">Nenhum curso disponível no momento.</p>
            <p className="text-sm text-gray-400 mt-2">
              Novos cursos serão adicionados em breve!
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-4">
            {selectedEmployee ? `Ações para ${selectedEmployee.name}` : 'Ações Rápidas'}
          </h4>
          <div className="space-y-3">
            <button
              onClick={() => setActiveView('courses')}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
            >
              <BookOpen className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium">
                {selectedEmployee ? 'Ver Cursos Disponíveis' : 'Explorar Cursos'}
              </span>
            </button>
            <button
              onClick={() => setActiveView('certificates')}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
            >
              <Trophy className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium">
                {selectedEmployee ? 'Certificados do Colaborador' : 'Meus Certificados'}
              </span>
            </button>
            {user?.role === 'admin' && !selectedEmployee && (
              <button
                onClick={() => setActiveView('users')}
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
              >
                <Users className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Gerenciar Usuários</span>
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-4">
            {selectedEmployee ? 'Progresso Recente' : 'Progresso Recente'}
          </h4>
          <div className="space-y-3">
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {selectedEmployee 
                  ? `${selectedEmployee.name} ainda não iniciou nenhum curso`
                  : 'Comece a assistir cursos para ver seu progresso aqui'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações</h2>
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
    </div>
  )
}
