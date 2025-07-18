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
import { PlayCircle, BookOpen, Users, Trophy, Clock, Star } from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  totalWatchTime: number
  certificatesEarned: number
}

type AppView = 'dashboard' | 'courses' | 'certificates' | 'users' | 'content' | 'settings' | 'notifications'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<AppView>('dashboard')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    totalWatchTime: 0,
    certificatesEarned: 0
  })
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadDashboardData()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      // Buscar perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error || !profile) {
        // Se não há perfil, criar um básico
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email || '',
            department: 'HR',
            role: 'user'
          }])
          .select()
          .single()

        if (createError) {
          console.error('Erro ao criar perfil:', createError)
        } else {
          setUser(newProfile)
        }
      } else {
        setUser(profile)
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Buscar cursos disponíveis
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (coursesError) throw coursesError

      setRecentCourses(courses || [])

      // Buscar estatísticas do usuário (simulado por enquanto)
      setStats({
        totalCourses: courses?.length || 0,
        completedCourses: 0,
        totalWatchTime: 0,
        certificatesEarned: 0
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    // Auto-select first lesson if available
    if (course.lessons && course.lessons.length > 0) {
      setSelectedLesson(course.lessons[0])
    }
  }

  const handleLessonStart = (lesson: Lesson) => {
    setSelectedLesson(lesson)
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
      const currentIndex = selectedCourse.lessons?.findIndex(l => l.id === selectedLesson.id) || 0
      return (
        <LessonPlayer
          course={selectedCourse}
          lesson={selectedLesson}
          user={user}
          onBack={() => setSelectedLesson(null)}
          onComplete={handleLessonComplete}
          onNext={() => handleLessonNavigation('next')}
          onPrevious={() => handleLessonNavigation('previous')}
          hasNext={selectedCourse.lessons ? currentIndex < selectedCourse.lessons.length - 1 : false}
          hasPrevious={currentIndex > 0}
        />
      )
    }

    switch (activeView) {
      case 'users':
        return user?.role === 'admin' ? <UserManagement /> : <div className="p-6 text-center">Acesso negado</div>
      
      case 'courses':
        return user?.role === 'admin' ? <CourseManagement /> : <CourseViewer user={user!} onCourseSelect={handleCourseSelect} />
      
      case 'certificates':
        return renderCertificatesView()
      
      case 'content':
        return user?.role === 'admin' ? renderContentView() : <div className="p-6 text-center">Acesso negado</div>
      
      case 'settings':
        return user?.role === 'admin' ? renderSettingsView() : <div className="p-6 text-center">Acesso negado</div>
      
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo à sua jornada de aprendizado!
        </h2>
        <p className="text-gray-600">
          Continue desenvolvendo suas habilidades com nossos cursos de treinamento.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cursos Disponíveis</p>
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
              <p className="text-sm font-medium text-gray-600">Certificados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.certificatesEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Cursos Disponíveis</h3>
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
              <div key={course.id} className="card card-hover">
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <PlayCircle className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {Math.floor(course.duration / 60)}h {course.duration % 60}min
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    course.type === 'onboarding' ? 'bg-green-100 text-green-800' :
                    course.type === 'training' ? 'bg-blue-100 text-blue-800' :
                    course.type === 'compliance' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.type === 'onboarding' ? 'Integração' :
                     course.type === 'training' ? 'Treinamento' :
                     course.type === 'compliance' ? 'Compliance' : 'Habilidades'}
                  </span>
                </div>
                <button
                  onClick={() => setActiveView('courses')}
                  className="mt-4 w-full btn-primary text-center block"
                >
                  Assistir Curso
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
          <h4 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h4>
          <div className="space-y-3">
            <button
              onClick={() => setActiveView('courses')}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
            >
              <BookOpen className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium">Explorar Cursos</span>
            </button>
            <button
              onClick={() => setActiveView('certificates')}
              className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
            >
              <Trophy className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium">Meus Certificados</span>
            </button>
            {user?.role === 'admin' && (
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
          <h4 className="font-semibold text-gray-900 mb-4">Progresso Recente</h4>
          <div className="space-y-3">
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Comece a assistir cursos para ver seu progresso aqui
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )



  const renderCertificatesView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Certificados</h2>
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  )

  const renderContentView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Conteúdo</h2>
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  )

  const renderSettingsView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h2>
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
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

  // If lesson player is active, render it full screen
  if (selectedLesson && selectedCourse && user) {
    return renderMainContent()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view as AppView)
          setSelectedCourse(null)
          setSelectedLesson(null)
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