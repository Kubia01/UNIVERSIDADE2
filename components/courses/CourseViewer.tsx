'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, BookOpen, Play, Clock, Award, Filter, ChevronRight, Users, Building } from 'lucide-react'
import { supabase, Course, Department, CourseType, User } from '@/lib/supabase'
import { cacheHelpers } from '@/lib/cache'
import { CourseCardSkeleton, FastLoading } from '@/components/ui/SkeletonLoader'
import { emergencyGetCourses, emergencyGetVideos, useFallbackData } from '@/lib/supabase-emergency'

interface CourseViewerProps {
  user: User
  onCourseSelect: (course: Course) => void
}

const CourseViewer: React.FC<CourseViewerProps> = React.memo(({ user, onCourseSelect }) => {
  // Reduzir logs excessivos
  const renderCount = React.useRef(0)
  renderCount.current++
  
  if (renderCount.current % 5 === 1) { // Log apenas a cada 5 renders
    console.log('[CourseViewer] Render #', renderCount.current, 'user:', user?.name)
  }
  
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
  const [loading, setLoading] = useState(false) // Iniciar como false
  const [initialized, setInitialized] = useState(false) // Controle de inicialização
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

  useEffect(() => {
    // APENAS carregar se user existe e não foi inicializado
    if (!user?.id) {
      console.log('[CourseViewer] ⏸️ Aguardando usuário')
      return
    }
    
    if (initialized) {
      console.log('[CourseViewer] ✅ Já inicializado')
      return
    }
    
    console.log('[CourseViewer] 🚀 Iniciando carregamento para usuário:', user.name)
    setInitialized(true)
    
    // Timeout de segurança para forçar finalização do loading
    const safetyTimeoutId = setTimeout(() => {
      if (loading) {
        console.log('[CourseViewer] ⚠️ Timeout de segurança - forçando finalização')
        setLoading(false)
      }
    }, 10000) // 10 segundos timeout de segurança
    
    // Debounce para evitar múltiplas chamadas
    const timeoutId = setTimeout(() => {
      loadCourses().finally(() => {
        clearTimeout(safetyTimeoutId)
      })
    }, 300) // Aumentar debounce para 300ms
    
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeoutId)
    }
  }, [user?.id, initialized]) // Adicionar initialized como dependência

  const loadCourses = async () => {
    // EVITAR múltiplas chamadas simultâneas
    if (loading) {
      console.log('[CourseViewer] ⏸️ JÁ CARREGANDO - Ignorando')
      return
    }
    
    console.log('[CourseViewer] ⚡ CARREGAMENTO ULTRA RÁPIDO')
    setLoading(true)
    setConnectionError(false)

    try {
      // USAR CHAVE CONSISTENTE - admin usa 'admin', usuários normais usam user.id
      const queryUserId = user.role === 'admin' ? 'admin' : user.id
      console.log(`[CourseViewer] 🔑 Usando cache key: courses-${queryUserId}-${user.role === 'admin'}`)
      const result = await emergencyGetCourses(queryUserId, user.role === 'admin')
      
      if (result.error) {
        console.error('[CourseViewer] ❌ Erro após todas as tentativas:', result.error)
        
        // Verificar se há dados no cache mesmo expirados
        const expiredCache = cacheHelpers.getCourses(queryUserId)
        if (expiredCache) {
          console.log('[CourseViewer] 🔄 Usando cache expirado como fallback')
          setCourses(expiredCache as Course[])
          setLoading(false)
          return
        }
        
        // Usar dados de fallback como último recurso
        console.log('[CourseViewer] 🚨 Usando dados de fallback')
        const fallbackCourses = useFallbackData('courses') as Course[]
        setCourses(fallbackCourses)
        setConnectionError(true)
        setLoading(false)
        return
      }

      const courses = result.data || []
      console.log(`[CourseViewer] 📚 Cursos recebidos:`, courses.length, courses.map((c: Course) => ({ id: c.id, title: c.title })))
      setCourses(courses)
      
      // Carregar aulas e progresso em background se há cursos
      if (courses.length > 0) {
        // Não aguardar essas operações para não bloquear a UI
        loadCourseLessons(courses).catch(console.error)
        loadCourseProgress(courses.map((course: any) => course.id)).catch(console.error)
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
      setCourses([])
      
      // Mostrar alerta específico para problemas de conectividade
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage && (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS'))) {
        console.error('🚨 PROBLEMA DE CONECTIVIDADE DETECTADO!')
        console.error('Possíveis causas:')
        console.error('1. Projeto Supabase pausado ou offline')
        console.error('2. URL do Supabase incorreta no .env.local')
        console.error('3. Chaves de API inválidas')
        console.error('4. Problemas de rede/firewall')
        console.error('Execute: node diagnose-supabase-connection.js')
        setConnectionError(true)
      }
    } finally {
      setLoading(false)
      console.log('[CourseViewer] ✅ Carregamento finalizado')
    }
  }

  const loadCourseProgress = async (courseIds: string[]) => {
    try {
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('course_id, progress')
        .eq('user_id', user.id)
        .in('course_id', courseIds)

      if (!error && progressData) {
        const progressMap: {[key: string]: number} = {}
        progressData.forEach(p => {
          progressMap[p.course_id] = p.progress || 0
        })
        setCourseProgress(progressMap)
        console.log('Progresso dos cursos carregado:', progressMap)
      }
    } catch (error) {
      console.error('Erro ao carregar progresso dos cursos:', error)
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

  // Memoizar filtros para evitar recálculos desnecessários
  const filteredCourses = useMemo(() => {
    const filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = selectedDepartment === 'All' || 
                               course.department === selectedDepartment ||
                               course.department === user?.department

      const matchesType = selectedType === 'All' || course.type === selectedType

      return matchesSearch && matchesDepartment && matchesType
    })
    
    if (renderCount.current % 5 === 1) { // Log apenas a cada 5 renders
      console.log(`[CourseViewer] 🔍 Cursos filtrados:`, filtered.length, 'de', courses.length, 'total')
    }
    
    return filtered
  }, [courses, searchTerm, selectedDepartment, selectedType, user?.department])

  const getTypeColor = useCallback((type: CourseType) => {
    const colors = {
      onboarding: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      training: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      compliance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      skills: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      leadership: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    }
    return colors[type]
  }, [])

  const getTypeLabel = useCallback((type: CourseType) => {
    const labels = {
      onboarding: 'Integração',
      training: 'Treinamento',
      compliance: 'Compliance',
      skills: 'Habilidades',
      leadership: 'Liderança'
    }
    return labels[type]
  }, [])

  // Mostrar loading apenas se não inicializou E não tem cursos
  if (loading && !initialized && courses.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="w-96 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Course grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
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

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Problema de Conectividade
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>Não foi possível carregar os cursos. Possíveis causas:</p>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Projeto Supabase pausado ou offline</li>
                  <li>Configuração incorreta das variáveis de ambiente</li>
                  <li>Problemas de rede ou firewall</li>
                </ul>
                <p className="mt-2">
                  <strong>Solução:</strong> Execute <code className="bg-red-100 dark:bg-red-800 px-1 rounded">node diagnose-supabase-connection.js</code> no terminal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules Grid */}
      {!connectionError && filteredCourses.length > 0 ? (
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
                      <span>{courseProgress[course.id] || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${courseProgress[course.id] || 0}%` }}
                      ></div>
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
              : user.role === 'admin' 
                ? 'Nenhum módulo disponível'
                : 'Nenhum curso atribuído'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedDepartment !== 'All' || selectedType !== 'All'
              ? 'Tente ajustar os filtros para encontrar módulos.'
              : user.role === 'admin'
                ? 'Novos módulos de treinamento serão adicionados em breve!'
                : 'Entre em contato com o administrador para solicitar acesso aos cursos de treinamento.'}
          </p>
          {user.role !== 'admin' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Dica:</strong> O administrador precisa atribuir cursos específicos para você na aba "Atribuição de Cursos".
              </p>
            </div>
          )}
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-green-200 dark:border-green-600 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-600 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Módulos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-purple-200 dark:border-purple-600 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tempo de Estudo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default CourseViewer