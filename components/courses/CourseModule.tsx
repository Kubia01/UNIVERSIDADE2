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
              Conteúdo do Curso
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {lessons.length} aulas • {formatDuration(totalDuration)}
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
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => onLessonSelect(lesson)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {index + 1}. {lesson.title}
                          </h3>
                          {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {lesson.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
                            {getLessonTypeLabel(lesson.type)}
                          </span>
                          {lesson.duration > 0 && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <button className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma aula encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Este curso ainda não possui aulas cadastradas.
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