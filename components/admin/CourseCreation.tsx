'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Plus, Trash2, Save, Video, FileText, HelpCircle, Link, X } from 'lucide-react'
import { CourseType, Course, Lesson, LessonType } from '@/lib/supabase'

interface CourseCreationProps {
  course?: Course | null
  onBack: () => void
  onSave: (courseData: any) => void
}

const CourseCreation: React.FC<CourseCreationProps> = ({ course, onBack, onSave }) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    type: 'training' as CourseType,
    instructor: '',
    thumbnail: '',
    is_mandatory: false,
    lessons: [] as any[]
  })

  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    type: 'video' as LessonType,
    content: '',
    duration: 0
  })

  const [showLessonForm, setShowLessonForm] = useState(false)

  // Load course data if editing
  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title,
        description: course.description,
        type: course.type,
        instructor: course.instructor,
        thumbnail: course.thumbnail || '',
        is_mandatory: course.is_mandatory,
        lessons: course.lessons || []
      })
    }
  }, [course])

  const courseTypes: { value: CourseType; label: string }[] = [
    { value: 'onboarding', label: 'Integração' },
    { value: 'training', label: 'Treinamento' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'skills', label: 'Habilidades' },
    { value: 'leadership', label: 'Liderança' }
  ]

  const lessonTypes = [
    { value: 'video', label: 'Vídeo', icon: Video },
    { value: 'document', label: 'Documento/PDF', icon: FileText },
    { value: 'quiz', label: 'Quiz/Avaliação', icon: HelpCircle },
    { value: 'link', label: 'Link Externo', icon: Link }
  ]

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCourseData({ ...courseData, thumbnail: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddLesson = () => {
    if (!currentLesson.title || !currentLesson.content) {
      alert('Por favor, preencha o título e conteúdo da aula.')
      return
    }

    const newLesson = {
      ...currentLesson,
      id: Date.now().toString(),
      order_index: courseData.lessons.length
    }

    setCourseData({
      ...courseData,
      lessons: [...courseData.lessons, newLesson]
    })

    setCurrentLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      duration: 0
    })

    setShowLessonForm(false)
  }

  const handleRemoveLesson = (index: number) => {
    const updatedLessons = courseData.lessons.filter((_, i) => i !== index)
    setCourseData({ ...courseData, lessons: updatedLessons })
  }

  const handleSaveCourse = () => {
    if (!courseData.title || !courseData.description || !courseData.instructor) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (courseData.lessons.length === 0) {
      alert('Por favor, adicione pelo menos uma aula ao curso.')
      return
    }

    const totalDuration = courseData.lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0)
    
    const newCourse = {
      ...courseData,
      duration: totalDuration,
      is_published: true,
      created_at: course?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onSave(newCourse)
  }

  const getLessonIcon = (type: string) => {
    const lessonType = lessonTypes.find(t => t.value === type)
    return lessonType ? lessonType.icon : Video
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {course ? 'Editar Curso' : 'Criar Novo Curso'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure as informações básicas e adicione o conteúdo
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Course Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações Básicas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título do Curso *
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o título do curso"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição *
              </label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva o conteúdo e objetivos do curso"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo do Curso *
              </label>
              <select
                value={courseData.type}
                onChange={(e) => setCourseData({ ...courseData, type: e.target.value as CourseType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {courseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instrutor *
              </label>
              <input
                type="text"
                value={courseData.instructor}
                onChange={(e) => setCourseData({ ...courseData, instructor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do instrutor"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imagem de Capa
              </label>
              <div className="flex items-center space-x-4">
                {courseData.thumbnail && (
                  <img
                    src={courseData.thumbnail}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <label className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher Imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={courseData.is_mandatory}
                  onChange={(e) => setCourseData({ ...courseData, is_mandatory: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Curso obrigatório
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Lessons Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aulas do Curso
            </h3>
            <button
              onClick={() => setShowLessonForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aula
            </button>
          </div>

          {/* Existing Lessons */}
          <div className="space-y-3 mb-6">
            {courseData.lessons.map((lesson, index) => {
              const Icon = getLessonIcon(lesson.type)
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lesson.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lesson.type} • {lesson.duration || 0} min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveLesson(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add Lesson Form */}
          {showLessonForm && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Nova Aula
                </h4>
                <button
                  onClick={() => setShowLessonForm(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título da Aula
                  </label>
                  <input
                    type="text"
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o título da aula"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Conteúdo
                  </label>
                  <select
                    value={currentLesson.type}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, type: e.target.value as LessonType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {lessonTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={currentLesson.description}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Breve descrição da aula"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {currentLesson.type === 'video' ? 'URL do Vídeo' : 
                     currentLesson.type === 'document' ? 'URL do Documento/PDF' :
                     currentLesson.type === 'link' ? 'URL do Link' : 'Conteúdo'}
                  </label>
                  <input
                    type="url"
                    value={currentLesson.content}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cole a URL do conteúdo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    value={currentLesson.duration}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowLessonForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddLesson}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Adicionar Aula
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveCourse}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {course ? 'Atualizar Curso' : 'Salvar Curso'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseCreation