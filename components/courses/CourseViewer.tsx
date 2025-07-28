'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, BookOpen, Play, Clock, Award, Filter, ChevronRight, Users, Building } from 'lucide-react'
import { supabase, Course, Department, CourseType, User } from '@/lib/supabase'
import { cacheHelpers } from '@/lib/cache'
import { CourseCardSkeleton, FastLoading } from '@/components/ui/SkeletonLoader'
import { emergencyGetCourses, emergencyGetVideos, preloadCriticalData } from '@/lib/supabase-emergency'
import { coursesCache, smartPreloader } from '@/lib/ultra-cache'

interface CourseViewerProps {
  user: User
  onCourseSelect: (course: Course) => void
}

const CourseViewer: React.FC<CourseViewerProps> = React.memo(({ user, onCourseSelect }) => {
  // Reduzir logs para performance
  const renderCount = React.useRef(0)
  renderCount.current++
  
  // Log apenas primeira renderização e depois a cada 10
  if (renderCount.current === 1 || renderCount.current % 10 === 0) {
    console.log('[CourseViewer] Render #', renderCount.current, 'user:', user?.name)
  }
  
  // CARREGAMENTO INSTANTÂNEO - Se não há usuário, mostrar dados emergenciais
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

  // Estados otimizados
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false) // SEMPRE iniciar como false para UX instantânea
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All')
  const [selectedType, setSelectedType] = useState<CourseType | 'All'>('All')
  const [showFilters, setShowFilters] = useState(false)
  const [courseLessons, setCourseLessons] = useState<{[key: string]: any[]}>({})
  const [courseProgress, setCourseProgress] = useState<{[key: string]: number}>({})
  const [connectionError, setConnectionError] = useState(false)

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

  // CARREGAMENTO INSTANTÂNEO com cache primeiro
  useEffect(() => {
    if (!user?.id) {
      console.log('[CourseViewer] ⏸️ Aguardando usuário')
      return
    }
    
    // PRIMEIRO: Verificar se já tem dados em cache IMEDIATAMENTE
    const cachedCourses = coursesCache.get(user.id, user.role === 'admin')
    if (cachedCourses && cachedCourses.length > 0) {
      console.log('[CourseViewer] ⚡ DADOS INSTANTÂNEOS do cache:', cachedCourses.length)
      setCourses(cachedCourses)
      setConnectionError(false)
      setLoading(false)
      
      // Carregar dados frescos em background sem bloquear UI
      setTimeout(() => {
        loadCourses(true) // background refresh
      }, 100)
      
      return
    }
    
    // Se não há cache, carregar imediatamente
    console.log('[CourseViewer] 🚀 Carregamento inicial para:', user.name)
    loadCourses()
  }, [user?.id])

  const loadCourses = async (backgroundRefresh = false) => {
    if (!backgroundRefresh) {
      console.log('[CourseViewer] 🎬 loadCourses() - INÍCIO')
    }
    
    // Se não é refresh em background, mostrar loading apenas se não há dados
    if (!backgroundRefresh && courses.length === 0) {
      setLoading(true)
    }
    
    try {
      // Verificar primeiro o smart preloader
      const hasQuickData = await smartPreloader.preloadUserData(user.id, user.role === 'admin')
      
      if (hasQuickData && !backgroundRefresh) {
        const quickData = coursesCache.get(user.id, user.role === 'admin')
        if (quickData) {
          console.log('[CourseViewer] ⚡ SMART PRELOADER: Dados instantâneos')
          setCourses(quickData)
          setLoading(false)
          setConnectionError(false)
          return
        }
      }
      
      // Tentar carregar dados do Supabase
      console.log('[CourseViewer] 📡 Carregando via emergencyGetCourses')
      const result = await emergencyGetCourses(user.id, user.role === 'admin')
      
      if (result.data && result.data.length > 0) {
        console.log('[CourseViewer] ✅ Cursos carregados:', result.data.length)
        setCourses(result.data)
        setConnectionError(false)
      } else if (result.error) {
        console.log('[CourseViewer] ❌ Erro no carregamento, mas mantendo interface funcionando')
        setConnectionError(true)
        
        // Se não tem dados em cache e houve erro, manter lista vazia mas sem bloquear
        if (courses.length === 0) {
          setCourses([])
        }
      }
      
    } catch (error) {
      console.error('[CourseViewer] 💥 Erro crítico:', error)
      setConnectionError(true)
      
      // Tentar dados de cache mesmo expirados
      const oldCache = coursesCache.get(user.id, user.role === 'admin')
      if (oldCache) {
        console.log('[CourseViewer] 🔄 Usando cache antigo para manter funcionalidade')
        setCourses(oldCache)
      }
    } finally {
      setLoading(false)
    }
  }

  // Otimização de filtros com useMemo para performance
  const filteredCourses = useMemo(() => {
    // Se está carregando e não tem dados, retornar array vazio
    if (loading && courses.length === 0) {
      return []
    }
    
    return courses.filter(course => {
      // Filtro de busca otimizado
      const matchesSearch = !searchTerm || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro de departamento otimizado
      const matchesDepartment = selectedDepartment === 'All' || 
        course.department === selectedDepartment ||
        (user?.role === 'admin') // Admin vê todos
      
      // Filtro de tipo
      const matchesType = selectedType === 'All' || course.type === selectedType
      
      return matchesSearch && matchesDepartment && matchesType
    })
  }, [courses, searchTerm, selectedDepartment, selectedType, user?.role, loading])

  // Carregar lições de um curso específico - OTIMIZADO
  const loadCourseLessons = useCallback(async (courseId: string) => {
    // Verificar cache primeiro
    if (courseLessons[courseId]) {
      return courseLessons[courseId]
    }
    
    try {
      const result = await emergencyGetVideos(courseId)
      if (result.data) {
        setCourseLessons(prev => ({
          ...prev,
          [courseId]: result.data || []
        }))
        return result.data
      }
    } catch (error) {
      console.error('[CourseViewer] Erro ao carregar lições:', error)
    }
    
    return []
  }, [courseLessons])

  // Handler de busca otimizado
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // Handler de filtros otimizado
  const handleDepartmentChange = useCallback((dept: Department | 'All') => {
    setSelectedDepartment(dept)
  }, [])

  const handleTypeChange = useCallback((type: CourseType | 'All') => {
    setSelectedType(type)
  }, [])

  // Função para obter progress de um curso
  const getCourseProgress = useCallback((courseId: string) => {
    return courseProgress[courseId] || 0
  }, [courseProgress])

  // Se não há cursos e não está carregando, mostrar mensagem amigável
  if (!loading && filteredCourses.length === 0 && !connectionError) {
    return (
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
        
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm || selectedDepartment !== 'All' || selectedType !== 'All' 
              ? 'Nenhum curso encontrado' 
              : 'Carregando cursos...'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedDepartment !== 'All' || selectedType !== 'All' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Aguarde enquanto carregamos os cursos disponíveis'}
          </p>
          <button
            onClick={() => loadCourses()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>
    )
  }

  // Se há erro de conexão mas tem cursos em cache, mostrar aviso discreto
  if (connectionError && filteredCourses.length > 0) {
    console.log('[CourseViewer] ⚠️ Conexão instável, mas mostrando dados em cache')
  }

  return (
    <div className="p-6">
      {/* Cabeçalho com busca e filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value as Department | 'All')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Curso
              </label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as CourseType | 'All')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {courseTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading state apenas se realmente necessário */}
      {loading && courses.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grid de cursos - SEMPRE visível se há dados */}
      {filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => onCourseSelect(course)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              {/* Thumbnail do curso */}
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-white" />
                )}
              </div>

              {/* Conteúdo do card */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.is_mandatory && (
                    <Award className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                  {course.description}
                </p>

                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} minutos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>{course.department}</span>
                  </div>
                </div>

                {/* Progress bar se há progresso */}
                {getCourseProgress(course.id) > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progresso</span>
                      <span>{getCourseProgress(course.id)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getCourseProgress(course.id)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Badge do tipo */}
                <div className="mt-3 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.type === 'onboarding' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    course.type === 'training' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    course.type === 'compliance' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    course.type === 'skills' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                    course.type === 'leadership' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {course.type === 'onboarding' ? 'Integração' :
                     course.type === 'training' ? 'Treinamento' :
                     course.type === 'compliance' ? 'Compliance' :
                     course.type === 'skills' ? 'Habilidades' :
                     course.type === 'leadership' ? 'Liderança' :
                     course.type}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador discreto de status de conexão */}
      {connectionError && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm">
              Conexão instável - mostrando dados em cache. 
              <button 
                onClick={() => loadCourses()} 
                className="ml-2 underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  )
})

CourseViewer.displayName = 'CourseViewer'

export default CourseViewer