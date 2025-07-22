'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Play, CheckCircle, Clock, FileText, ExternalLink, HelpCircle, BookOpen, Video } from 'lucide-react'
import { Course, User, supabase } from '@/lib/supabase'

interface CourseModuleProps {
  course: Course
  user: User
  onBack: () => void
  onLessonSelect: (lesson: any) => void
}

const CourseModule: React.FC<CourseModuleProps> = ({ course, user, onBack, onLessonSelect }) => {
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    loadLessons()
    loadUserProgress()
  }, [course.id])

  const loadLessons = async () => {
    try {
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true })

      if (error) throw error

      // Converter videos para o formato de lessons
      const courseLessons = (videos || []).map((video: any) => ({
        id: video.id,
        course_id: video.course_id,
        title: video.title,
        description: video.description,
        type: video.type,
        content: video.video_url || video.content,
        duration: video.duration || 0,
        order_index: video.order_index,
        created_at: video.created_at,
        updated_at: video.updated_at
      }))

      setLessons(courseLessons)
    } catch (error) {
      console.error('Erro ao carregar aulas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProgress = async () => {
    try {
      // Aqui você pode implementar a lógica para carregar o progresso do usuário
      // Por enquanto, vamos deixar vazio
      setUserProgress({})
    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video
      case 'document':
        return FileText
      case 'quiz':
        return HelpCircle
      case 'link':
        return ExternalLink
      default:
        return Play
    }
  }

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Vídeo'
      case 'document':
        return 'Documento'
      case 'quiz':
        return 'Quiz'
      case 'link':
        return 'Link'
      default:
        return 'Conteúdo'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  const totalDuration = lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {course.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {course.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Course Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-start space-x-6">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instrutor</p>
                  <p className="font-medium text-gray-900 dark:text-white">{course.instructor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duração Total</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDuration(totalDuration)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Aulas</p>
                  <p className="font-medium text-gray-900 dark:text-white">{lessons.length} aulas</p>
                </div>
              </div>
              
              {course.is_mandatory && (
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-sm font-medium">
                  Curso Obrigatório
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aulas do Módulo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {lessons.length} aulas • {formatDuration(totalDuration)} • Clique em qualquer aula para assistir
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => {
                const Icon = getLessonIcon(lesson.type)
                const isCompleted = userProgress[lesson.id] || false
                
                return (
                  <div
                    key={lesson.id}
                    className="p-6 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => onLessonSelect(lesson)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {lesson.title}
                          </h3>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                              Concluída
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {lesson.description}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {getLessonTypeLabel(lesson.type)}
                          </span>
                          {lesson.duration > 0 && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Play className="h-3 w-3 mr-1" />
                            Clique para assistir
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110">
                            <Play className="h-5 w-5 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma aula encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Este módulo ainda não possui aulas cadastradas.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Entre em contato com o administrador para mais informações.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseModule