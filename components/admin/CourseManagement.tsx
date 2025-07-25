'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Play, Users, BookOpen, Clock, Award, Filter, X } from 'lucide-react'
import { supabase, Course, User, Department, CourseType } from '@/lib/supabase'
import { emergencyGetCourses, emergencyGetVideos } from '@/lib/supabase-emergency'
import { lazyVideoLoader } from '@/lib/lazy-loader'
import CourseCreation from './CourseCreation'
import LessonEditModal from './LessonEditModal'

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
  const [showLessonEditModal, setShowLessonEditModal] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [courseVideos, setCourseVideos] = useState<{[key: string]: any[]}>({})
  const [courseDetails, setCourseDetails] = useState<{[key: string]: any}>({})

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
    console.log('⚡ [CourseManagement] CARREGAMENTO ULTRA RÁPIDO')
    try {
      // Usar sistema de emergência OTIMIZADO
      console.log('[CourseManagement] 🔑 Usando cache key: courses-admin-true')
      const result = await emergencyGetCourses('admin', true)
      
      if (result.error) {
        console.error('❌ Erro ao carregar cursos:', result.error)
        setCourses([])
      } else {
        const courses = result.data || []
        console.log('✅ Cursos carregados:', courses.length)
        setCourses(courses)
        
        // Carregar aulas em BACKGROUND usando lazy loader
        if (courses.length > 0) {
          loadAllCourseVideosLazy(courses).catch(console.error)
        }
      }
    } catch (error) {
      console.error('💥 Erro crítico ao carregar cursos:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllCourseVideosLazy = async (courses: Course[]) => {
    console.log('⚡ [CourseManagement] Carregando TODOS os vídeos com lazy loader')
    try {
      const courseIds = courses.map(course => course.id)
      
      // Usar lazy loader para carregar todos os vídeos de forma otimizada
      const videosMap = await lazyVideoLoader.loadMultipleCourses(courseIds, 4) // Batch de 4
      
      setCourseVideos(videosMap)
      console.log('✅ Todos os vídeos carregados via lazy loader:', Object.keys(videosMap).length, 'cursos')
      
      // Log estatísticas
      const stats = lazyVideoLoader.getStats()
      console.log('📊 Lazy Loader Stats:', stats)
      
    } catch (error) {
      console.error('Erro ao carregar vídeos com lazy loader:', error)
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
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        alert('Erro ao excluir curso: ' + errorMessage)
      }
    }
  }

  const handleSaveCourse = async (courseData: any) => {
    try {
      // Remover o campo lessons antes de salvar no banco
      const { lessons, ...courseToSave } = courseData;
      
      // Validar tamanho da thumbnail
      if (courseToSave.thumbnail) {
        // Aumentar limite para 100KB para base64 (cerca de 75KB de imagem real)
        if (courseToSave.thumbnail.length > 100000) {
          console.log('⚠️ [CourseManagement] Thumbnail muito grande, comprimindo automaticamente...')
          console.log('⚠️ [CourseManagement] Tamanho original:', courseToSave.thumbnail.length, 'chars')
          
          // Tentar comprimir a imagem automaticamente
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                // Reduzir tamanho para 300x200 máximo
                const maxWidth = 300
                const maxHeight = 200
                let { width, height } = img
                
                if (width > height) {
                  if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                  }
                } else {
                  if (height > maxHeight) {
                    width = (width * maxHeight) / height
                    height = maxHeight
                  }
                }
                
                canvas.width = width
                canvas.height = height
                ctx!.drawImage(img, 0, 0, width, height)
                
                // Comprimir para JPEG com qualidade 0.7
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
                courseToSave.thumbnail = compressedDataUrl
                console.log('✅ [CourseManagement] Thumbnail comprimida para:', compressedDataUrl.length, 'chars')
                resolve(compressedDataUrl)
              }
              img.onerror = reject
              img.src = courseToSave.thumbnail
            })
          } catch (error) {
            console.error('❌ [CourseManagement] Erro ao comprimir thumbnail:', error)
            // Se falhar, manter a original se não for muito grande
            if (courseToSave.thumbnail.length > 150000) {
              console.log('⚠️ [CourseManagement] Thumbnail muito grande mesmo após erro, removendo')
              delete courseToSave.thumbnail
            }
          }
        } else {
          console.log('🖼️ [CourseManagement] Thumbnail validada - tamanho OK')
        }
      }
      
              console.log('🔍 [CourseManagement] Salvando curso:', courseToSave)
        console.log('🖼️ [CourseManagement] Thumbnail no courseToSave:', courseToSave.thumbnail ? 'SIM' : 'NÃO')
        if (courseToSave.thumbnail) {
          console.log('🖼️ [CourseManagement] Thumbnail length:', courseToSave.thumbnail.length)
        }
        console.log('📚 [CourseManagement] Aulas para salvar:', lessons.length)
      
      if (editingCourse) {
        // Atualizar curso existente
        console.log('💾 [CourseManagement] Enviando UPDATE para Supabase...')
        console.log('💾 [CourseManagement] Dados a serem enviados:', {
          ...courseToSave,
          thumbnail: courseToSave.thumbnail ? `[${courseToSave.thumbnail.length} chars] - ${courseToSave.thumbnail.substring(0, 100)}...` : 'undefined'
        })
        
        // Log mais detalhado da thumbnail
        if (courseToSave.thumbnail) {
          console.log('🖼️ [CourseManagement] DETALHES DA THUMBNAIL:')
          console.log('  - Tipo:', typeof courseToSave.thumbnail)
          console.log('  - Tamanho:', courseToSave.thumbnail.length)
          console.log('  - Começa com data:', courseToSave.thumbnail.startsWith('data:'))
          console.log('  - Primeiros 200 chars:', courseToSave.thumbnail.substring(0, 200))
        }
        
        const { data: updateResult, error } = await supabase
          .from('courses')
          .update(courseToSave)
          .eq('id', editingCourse.id)
          .select('id, title, thumbnail')

        if (error) {
          console.error('❌ [CourseManagement] Erro detalhado do Supabase:', error)
          console.error('❌ [CourseManagement] Código:', error.code)
          console.error('❌ [CourseManagement] Mensagem:', error.message)
          console.error('❌ [CourseManagement] Detalhes:', error.details)
          console.error('❌ [CourseManagement] Hint:', error.hint)
          throw error
        } else {
          console.log('✅ [CourseManagement] UPDATE realizado com sucesso!')
          console.log('📊 [CourseManagement] Resultado do UPDATE:', updateResult)
          
          // Verificar se a thumbnail foi salva
          if (updateResult && updateResult[0]) {
            const savedCourse = updateResult[0]
            console.log('🖼️ [CourseManagement] Thumbnail salva no banco?', savedCourse.thumbnail ? 'SIM' : 'NÃO')
            if (savedCourse.thumbnail) {
              console.log('🖼️ [CourseManagement] Tamanho da thumbnail salva:', savedCourse.thumbnail.length)
              console.log('🖼️ [CourseManagement] Primeiros 100 chars:', savedCourse.thumbnail.substring(0, 100))
            }
          }
        }
        
        // Atualizar as aulas (videos)
        if (lessons && editingCourse.id) {
          console.log('Atualizando aulas do curso existente...')
          
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
            console.log('Removendo aulas:', removedIds)
            const { error: deleteError } = await supabase.from('videos').delete().in('id', removedIds)
            if (deleteError) {
              console.error('Erro ao remover aulas:', deleteError)
              throw deleteError
            }
          }
          
          // Atualizar aulas existentes
          for (let i = 0; i < updatedLessons.length; i++) {
            const lesson = updatedLessons[i]
            console.log('Atualizando aula:', lesson)
            const { content, ...rest } = lesson;
            const { error: updateError } = await supabase.from('videos').update({
              ...rest,
              video_url: lesson.content,
              order_index: i, // Manter ordem correta
              updated_at: new Date().toISOString()
            }).eq('id', lesson.id)
            
            if (updateError) {
              console.error('Erro ao atualizar aula:', updateError)
              throw updateError
            }
          }
          
          // Inserir novas aulas
          if (newLessons.length > 0) {
            console.log('Inserindo novas aulas:', newLessons)
            const lessonsToInsert = newLessons.map((lesson: any, idx: number) => {
              const { content, id, ...rest } = lesson;
              return {
                ...rest,
                video_url: lesson.content,
                course_id: editingCourse.id,
                order_index: idx + updatedLessons.length, // Continuar a numeração
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            })
            const { error: insertError } = await supabase.from('videos').insert(lessonsToInsert)
            if (insertError) {
              console.error('Erro ao inserir novas aulas:', insertError)
              throw insertError
            }
          }
        }
        
        console.log('✅ [CourseManagement] Curso e aulas atualizados com sucesso!')
        
        // Limpar cache para forçar recarregamento
        console.log('🗑️ [CourseManagement] Limpando TODOS os caches relacionados...')
        
        // 1. Limpar localStorage cache
        if (typeof window !== 'undefined' && window.localStorage) {
          const cacheKeys = Object.keys(localStorage).filter(key => 
            key.includes('courses-admin-true') || 
            key.includes('ultra-cache-courses-admin-true') ||
            key.includes('courses-') ||
            key.includes('ultra-cache')
          )
          console.log('🗑️ [CourseManagement] Caches localStorage encontrados para remoção:', cacheKeys.length)
          cacheKeys.forEach(key => {
            console.log('🗑️ [CourseManagement] Removendo cache localStorage:', key)
            localStorage.removeItem(key)
          })
        }
        
        // 2. Limpar ultra-cache em memória (apenas dados relevantes)
        try {
          const { coursesCache, ultraCache } = await import('@/lib/ultra-cache')
          console.log('🗑️ [CourseManagement] Limpando ultra-cache específico...')
          
          // Limpar apenas cache específico de admin para forçar reload
          ultraCache.delete('courses-admin-true')
          console.log('🗑️ [CourseManagement] Ultra-cache courses-admin-true removido')
          
          console.log('✅ [CourseManagement] Ultra-cache específico limpo!')
        } catch (error) {
          console.error('❌ [CourseManagement] Erro ao limpar ultra-cache:', error)
        }
        
        alert('✅ Curso atualizado com sucesso!')
        
      } else {
        // Criar novo curso
        const { data, error } = await supabase
          .from('courses')
          .insert([courseToSave])
          .select()
          .single()

        if (error) throw error
        
        console.log('Curso criado:', data)
        
        // Salvar as aulas na tabela videos
        if (lessons && lessons.length > 0 && data && data.id) {
          console.log('Salvando aulas do novo curso...')
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
          
          console.log('Aulas para inserir:', lessonsToInsert)
          
          const { error: lessonsError } = await supabase
            .from('videos')
            .insert(lessonsToInsert)
            
          if (lessonsError) {
            console.error('Erro ao salvar aulas:', lessonsError)
            throw lessonsError
          }
          
          // Verificar se as aulas foram salvas
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { data: savedVideos, error: verifyError } = await supabase
            .from('videos')
            .select('*')
            .eq('course_id', data.id)
            .order('order_index', { ascending: true })
            
          if (verifyError) {
            console.error('Erro ao verificar aulas salvas:', verifyError)
          } else {
            console.log('Aulas salvas no banco:', savedVideos)
          }
        }
        
        console.log('Curso e aulas criados com sucesso!')
        
        // Limpar cache específico após criação
        console.log('🗑️ [CourseManagement] Limpando cache específico após criação...')
        try {
          const { ultraCache } = await import('@/lib/ultra-cache')
          
          // Limpar apenas cache específico de admin
          ultraCache.delete('courses-admin-true')
          console.log('🗑️ [CourseManagement] Ultra-cache courses-admin-true removido após criação')
          
          console.log('✅ [CourseManagement] Cache específico limpo após criação!')
        } catch (error) {
          console.error('❌ [CourseManagement] Erro ao limpar cache após criação:', error)
        }
        
        alert('Curso criado com sucesso!')
      }
      
      // Resetar estados
      setViewMode('list')
      setEditingCourse(null)
      setSelectedCourse(null)
      setSelectedLesson(null)
      
      // Aguardar um pouco antes de recarregar para garantir que cache foi limpo
      setTimeout(() => {
        console.log('🔄 [CourseManagement] Recarregando cursos após limpeza de cache...')
        loadCourses() // Usar o carregamento normal (que agora usará cache limpo)
      }, 200)
      
    } catch (error: any) {
      console.error('Erro ao salvar curso:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao salvar curso: ' + errorMessage)
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
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao alterar status: ' + errorMessage)
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

  const handleEditLesson = (lesson: any, course: Course) => {
    console.log('Editando aula:', lesson)
    setSelectedLesson(lesson)
    setSelectedCourse(course)
    setShowLessonEditModal(true)
  }

  const handleLessonEditSave = async () => {
    console.log('Aula editada, recarregando dados...')
    await loadCourses()
    setShowLessonEditModal(false)
    setSelectedLesson(null)
    setSelectedCourse(null)
  }

  const handleDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (confirm(`Tem certeza que deseja excluir a aula "${lessonTitle}"?`)) {
      try {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', lessonId)

        if (error) throw error

        alert('Aula excluída com sucesso!')
        await loadCourses()
      } catch (error: any) {
        console.error('Erro ao excluir aula:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        alert('Erro ao excluir aula: ' + errorMessage)
      }
    }
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
        <div className="flex space-x-2">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
          >
            {debugMode ? 'Ocultar Debug' : 'Mostrar Debug'}
          </button>
          <button
            onClick={handleCreateCourse}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Debug - Aulas por Curso
          </h3>
          <div className="space-y-2">
            {courses.map((course) => (
              <div key={course.id} className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.title}:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {courseVideos[course.id]?.length || 0} aulas
                </span>
                {courseVideos[course.id]?.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {courseVideos[course.id].map((video: any, idx: number) => (
                      <div key={video.id} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span>{idx + 1}. {video.title} ({video.type})</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditLesson(video, course)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Editar aula"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(video.id, video.title)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Excluir aula"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                {course.thumbnail && course.thumbnail.trim() !== '' ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    onLoad={() => {
                      console.log('[CourseManagement] ✅ Thumbnail carregada com sucesso para:', course.title)
                    }}
                    onError={(e) => {
                      console.error('[CourseManagement] ❌ Erro ao carregar thumbnail para:', course.title)
                      console.error('[CourseManagement] ❌ URL da thumbnail:', course.thumbnail?.substring(0, 100) + '...')
                    }}
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

      {/* Modal de Edição de Aula */}
      {showLessonEditModal && selectedLesson && selectedCourse && (
        <LessonEditModal
          lesson={selectedLesson}
          courseId={selectedCourse.id}
          isOpen={showLessonEditModal}
          onClose={() => {
            setShowLessonEditModal(false)
            setSelectedLesson(null)
            setSelectedCourse(null)
          }}
          onSave={handleLessonEditSave}
        />
      )}
    </div>
  )
}

export default CourseManagement