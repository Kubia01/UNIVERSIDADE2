'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Course, Lesson } from '@/lib/supabase'
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
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Recarregar dados quando funcionário selecionado mudar
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboardData()
    }
  }, [selectedEmployee])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        if (profile) {
          setUser(profile)
          // Carregar dados do dashboard após definir o usuário
          setTimeout(() => loadDashboardData(), 100)
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!user) return

    try {
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
      }

      // Se for admin, carregar lista de funcionários
      if (user?.role === 'admin') {
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true })
        
        if (usersError) {
          console.error('Erro ao carregar usuários:', usersError)
          setEmployees([])
        } else {
          console.log('Usuários carregados:', allUsers)
          setEmployees(allUsers || [])
        }
      }

      // Buscar estatísticas básicas
      const { data: certificates, error: certificatesError } = await supabase
        .from('certificates')
        .select('*')
      
      if (certificatesError) {
        console.error('Erro ao carregar certificados:', certificatesError)
      }

      // Calcular estatísticas simples
      setStats({
        totalCourses: courses?.length || 0,
        completedCourses: 0,
        totalWatchTime: 0,
        certificatesEarned: certificates?.length || 0,
        totalUsers: employees.length || 0
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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
    // Here you would typically save progress to the database
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
                >
                  <option value="">Visão Geral (Todos)</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </option>
                  ))}
                </select>
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
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum curso disponível no momento.</p>
            <p className="text-sm text-gray-400 mt-2">
              Novos cursos serão adicionados em breve!
            </p>
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