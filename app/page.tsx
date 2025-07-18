'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { PlayCircle, BookOpen, Users, Trophy, Clock, Star } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalCourses: number
  completedCourses: number
  totalWatchTime: number
  certificatesEarned: number
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
      setUser(currentUser)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                Universidade Corporativa
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Olá, {user?.user_metadata?.name || user?.email}
              </span>
              <Link
                href="/profile"
                className="text-primary-600 hover:text-primary-700"
              >
                Perfil
              </Link>
              <button
                onClick={() => {
                  supabase.auth.signOut()
                  router.push('/login')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Link
              href="/courses"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todos
            </Link>
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
                      course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.level === 'beginner' ? 'Iniciante' :
                       course.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                    </span>
                  </div>
                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-4 w-full btn-primary text-center block"
                  >
                    Assistir Curso
                  </Link>
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
              <Link
                href="/courses"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Explorar Cursos</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Meu Perfil</span>
              </Link>
              <Link
                href="/certificates"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trophy className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Meus Certificados</span>
              </Link>
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
      </main>
    </div>
  )
}