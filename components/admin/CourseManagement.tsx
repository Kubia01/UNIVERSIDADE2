'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Eye, BookOpen, Play, ArrowLeft } from 'lucide-react'
import { supabase, Course, Department, CourseType } from '@/lib/supabase'
import CourseCreation from './CourseCreation'

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All')
  const [selectedType, setSelectedType] = useState<CourseType | 'All'>('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null)

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
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === 'All' || course.department === selectedDepartment
    const matchesType = selectedType === 'All' || course.type === selectedType

    return matchesSearch && matchesDepartment && matchesType
  })

  const handleCreateCourse = () => {
    setEditingCourse(null)
    setViewMode('create')
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setViewMode('edit')
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseId)

        if (error) throw error

        alert('Curso excluído com sucesso!')
        loadCourses()
      } catch (error: any) {
        console.error('Erro ao excluir curso:', error)
        alert('Erro ao excluir curso: ' + error.message)
      }
    }
  }

  const handleSaveCourse = async (courseData: any) => {
    try {
      // Remover o campo lessons antes de salvar no banco
      const { lessons, ...courseToSave } = courseData;
      if (editingCourse) {
        // Atualizar curso existente
        const { error } = await supabase
          .from('courses')
          .update(courseToSave)
          .eq('id', editingCourse.id)

        if (error) throw error
        // Atualizar as aulas (videos)
        if (lessons && editingCourse.id) {
          // Buscar aulas existentes
          const { data: existingLessons } = await supabase
            .from('videos')
            .select('id')
            .eq('course_id', editingCourse.id)
          const existingIds = (existingLessons || []).map((l: any) => l.id)
          const newLessons = lessons.filter((l: any) => !l.id)
          const updatedLessons = lessons.filter((l: any) => l.id)
          const updatedIds = updatedLessons.map((l: any) => l.id)
          const removedIds = existingIds.filter((id: string) => !updatedIds.includes(id))

          // Remover aulas excluídas
          if (removedIds.length > 0) {
            await supabase.from('videos').delete().in('id', removedIds)
          }
          // Atualizar aulas existentes
          for (const lesson of updatedLessons) {
            const { content, ...rest } = lesson;
            await supabase.from('videos').update({
              ...rest,
              video_url: lesson.content,
              updated_at: new Date().toISOString()
            }).eq('id', lesson.id)
          }
          // Inserir novas aulas
          if (newLessons.length > 0) {
            const lessonsToInsert = newLessons.map((lesson: any, idx: number) => {
              const { content, id, ...rest } = lesson;
              return {
                ...rest,
                video_url: lesson.content,
                course_id: editingCourse.id,
                order_index: idx,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            })
            await supabase.from('videos').insert(lessonsToInsert)
          }
        }
        setViewMode('list')
        setEditingCourse(null)
        setSelectedCourse(null)
        setSelectedLesson(null)
        loadCourses()
        alert('Curso atualizado com sucesso!')
      } else {
        // Criar novo curso
        const { data, error } = await supabase
          .from('courses')
          .insert([courseToSave])
          .select()
          .single()

        if (error) throw error
        // Salvar as aulas na tabela videos
        if (lessons && lessons.length > 0 && data && data.id) {
          const lessonsToInsert = lessons.map((lesson: any, idx: number) => {
            const { content, id, ...rest } = lesson;
            return {
              ...rest,
              video_url: lesson.content,
              course_id: data.id,
              order_index: idx,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
          const { error: lessonsError } = await supabase
            .from('videos')
            .insert(lessonsToInsert)
          if (lessonsError) throw lessonsError
          // Recarregar aulas do banco para garantir que os ids estejam corretos
          const { data: videos } = await supabase
            .from('videos')
            .select('*')
            .eq('course_id', data.id)
            .order('order_index', { ascending: true })
          console.log('Aulas salvas no banco:', videos)
        }
        setViewMode('list')
        setEditingCourse(null)
        setSelectedCourse(null)
        setSelectedLesson(null)
        loadCourses()
        alert('Curso criado com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao salvar curso:', error)
      alert('Erro ao salvar curso: ' + error.message)
    }
  }

  const handleTogglePublish = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id)

      if (error) throw error

      alert(`Curso ${!course.is_published ? 'publicado' : 'despublicado'} com sucesso!`)
      loadCourses()
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status: ' + error.message)
    }
  }

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

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <CourseCreation
        course={editingCourse}
        onBack={() => setViewMode('list')}
        onSave={handleSaveCourse}
      />
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Cursos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crie e gerencie cursos de treinamento para sua equipe
          </p>
        </div>
        <button
          onClick={handleCreateCourse}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Course Thumbnail */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.is_published 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {course.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(course.type)}`}>
                    {getTypeLabel(course.type)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.floor(course.duration / 60)}h {course.duration % 60}min
                  </span>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <p>Instrutor: {course.instructor}</p>
                  <p>Departamento: {course.department}</p>
                  {course.is_mandatory && (
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs font-medium mt-1">
                      Obrigatório
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      course.is_published
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {course.is_published ? 'Despublicar' : 'Publicar'}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedDepartment !== 'All' || selectedType !== 'All'
              ? 'Nenhum curso encontrado com os filtros aplicados.'
              : 'Nenhum curso criado ainda.'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Comece criando seu primeiro curso de treinamento!
          </p>
        </div>
      )}
    </div>
  )
}

export default CourseManagement