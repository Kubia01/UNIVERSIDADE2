'use client'

import React, { useState, useEffect } from 'react'
import { Search, BookOpen, Play, Clock, Award, Filter, ChevronRight, Users, Building } from 'lucide-react'
import { supabase, Course, Department, CourseType, User } from '@/lib/supabase'

interface CourseViewerProps {
  user: User
  onCourseSelect: (course: Course) => void
}

const CourseViewer: React.FC<CourseViewerProps> = ({ user, onCourseSelect }) => {
  console.log('[CourseViewer] Renderizando CourseViewer. user:', user, 'onCourseSelect:', onCourseSelect)
  
  // Se não há usuário, mostrar loading ou erro
  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All')
  const [selectedType, setSelectedType] = useState<CourseType | 'All'>('All')
  const [showFilters, setShowFilters] = useState(false)
  const [courseLessons, setCourseLessons] = useState<{[key: string]: any[]}>({})

  const departments: { value: Department | 'All'; label: string }[] = [
    { value: 'All', label: 'Todos os Departamentos' },
    { value: 'HR', label: 'Recursos Humanos' },
    { value: 'Operations', label: 'Operações' },
    { value: 'Sales', label: 'Vendas' },
    { value: 'Engineering', label: 'Engenharia' },
    { value: 'Finance', label: 'Financeiro' },
    { value: 'Marketing', label: 'Marketing' }
  ]

  const courseTypes: { value: CourseType | 'All'; label: string }[] = [
    { value: 'All', label: 'Todos os Tipos' },
    { value: 'onboarding', label: 'Integração' },
    { value: 'training', label: 'Treinamento' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'skills', label: 'Habilidades' },
    { value: 'leadership', label: 'Liderança' }
  ]

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('[CourseViewer] Cursos carregados:', data)
      setCourses(data || [])
      
      // Carregar aulas para cada curso apenas se há cursos
      if (data && data.length > 0) {
        await loadCourseLessons(data)
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const loadCourseLessons = async (courses: Course[]) => {
    try {
      const lessonsMap: {[key: string]: any[]} = {}
      
      for (const course of courses) {
        const { data: videos, error } = await supabase
          .from('videos')
          .select('*')
          .eq('course_id', course.id)
          .order('order_index', { ascending: true })
        
        if (error) {
          console.error(`Erro ao carregar aulas do curso ${course.id}:`, error)
          lessonsMap[course.id] = []
        } else {
          lessonsMap[course.id] = videos || []
        }
      }
      
      setCourseLessons(lessonsMap)
    } catch (error) {
      console.error('Erro ao carregar aulas dos cursos:', error)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = selectedDepartment === 'All' || 
                             course.department === selectedDepartment ||
                             course.department === user?.department

    const matchesType = selectedType === 'All' || course.type === selectedType

    return matchesSearch && matchesDepartment && matchesType
  })

  const getTypeColor = (type: CourseType) => {
    const colors = {
      onboarding: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      training: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      compliance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      skills: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      leadership: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    }
    return colors[type]
  }

  const getTypeLabel = (type: CourseType) => {
    const labels = {
      onboarding: 'Integração',
      training: 'Treinamento',
      compliance: 'Compliance',
      skills: 'Habilidades',
      leadership: 'Liderança'
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  console.log('[CourseViewer] Cursos carregados:', courses)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Módulos de Treinamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore os módulos de treinamento disponíveis e acesse suas aulas
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulos de treinamento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as Department | 'All')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CourseType | 'All')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {courseTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Modules Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            console.log('[CourseViewer] Renderizando card do módulo:', course)
            const lessonCount = courseLessons[course.id]?.length || 0
            return (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                {/* Module Thumbnail */}
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 h-48">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                  
                  {/* Overlay com informações */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white">
                        <span className="text-sm font-medium">
                          {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                        </span>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {Math.floor(course.duration / 60)}h {course.duration % 60}min
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge obrigatório */}
                  {course.is_mandatory && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">
                        Obrigatório
                      </span>
                    </div>
                  )}

                  {/* Badge do tipo */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(course.type)}`}>
                      {getTypeLabel(course.type)}
                    </span>
                  </div>
                </div>

                {/* Module Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">Instrutor:</span>
                      <span className="ml-1">{course.instructor}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Building className="h-4 w-4 mr-2 text-green-500" />
                      <span className="font-medium">Departamento:</span>
                      <span className="ml-1">{course.department}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">Seu Progresso</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {lessonCount > 0 ? (
                      <button
                        onClick={() => {
                          console.log('[CourseViewer] Botão Assistir Aulas clicado para módulo:', course)
                          console.log('[CourseViewer] Aulas do módulo:', courseLessons[course.id])
                          if (typeof onCourseSelect === 'function') {
                            const courseWithLessons = {
                              ...course,
                              lessons: courseLessons[course.id] || []
                            }
                            onCourseSelect(courseWithLessons)
                          } else {
                            console.error('[CourseViewer] onCourseSelect não é uma função!', onCourseSelect)
                          }
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Assistir Aulas
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Nenhuma aula disponível
                      </div>
                    )}
                    
                    {/* Info adicional */}
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                      {lessonCount > 0 ? (
                        <span>✓ {lessonCount} {lessonCount === 1 ? 'aula pronta' : 'aulas prontas'} para assistir</span>
                      ) : (
                        <span>⚠️ Este módulo ainda não possui aulas</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || selectedDepartment !== 'All' || selectedType !== 'All'
              ? 'Nenhum módulo encontrado'
              : 'Nenhum módulo disponível'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedDepartment !== 'All' || selectedType !== 'All'
              ? 'Tente ajustar os filtros para encontrar módulos.'
              : 'Novos módulos de treinamento serão adicionados em breve!'}
          </p>
        </div>
      )}

      {/* Module Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Módulos Disponíveis</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-white">{filteredCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Módulos Concluídos</p>
              <p className="text-2xl font-bold text-green-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Tempo de Estudo</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-white">0h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseViewer