'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, Maximize, CheckCircle, FileText, ExternalLink, HelpCircle } from 'lucide-react'
import { Course, Lesson, User, supabase } from '@/lib/supabase'

interface LessonPlayerProps {
  course: Course
  lesson: Lesson
  user: User
  onBack: () => void
  onComplete: () => void
  onNext: () => void
  onPrevious: () => void
  hasNext: boolean
  hasPrevious: boolean
}

const LessonPlayer: React.FC<LessonPlayerProps> = ({
  course,
  lesson,
  user,
  onBack,
  onComplete,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(lesson.duration || 0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    const timer = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, showControls])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    setCurrentTime(newTime)
  }

  const handleComplete = () => {
    console.log('Marcando aula como concluída:', {
      lesson: lesson.title,
      user: user.name,
      course: course.title
    })
    setIsCompleted(true)
    saveLessonProgress(true)
    onComplete()
  }

  const saveLessonProgress = async (completed: boolean = false) => {
    console.log('Salvando progresso da aula:', {
      user_id: user.id,
      lesson_id: lesson.id,
      course_id: course.id,
      completed: completed
    })

    try {
      // Dados para lesson_progress (estrutura simplificada)
      const progressData = {
        user_id: user.id,
        lesson_id: lesson.id,
        course_id: course.id,
        completed_at: completed ? new Date().toISOString() : null
      }

      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(progressData, {
          onConflict: 'user_id,lesson_id'
        })
        .select()

      if (error) {
        console.error('Erro ao salvar progresso:', error)
        console.error('Dados enviados:', progressData)
        console.error('Código do erro:', error.code)
        console.error('Detalhes do erro:', error.details)
        alert('Erro ao salvar progresso: ' + error.message)
      } else {
        console.log('Progresso salvo com sucesso:', data)
        
        if (completed) {
          console.log('Aula marcada como concluída, verificando conclusão do curso...')
          // Aguardar um pouco mais para garantir que o trigger processe
          setTimeout(() => {
            checkCourseCompletion()
            // Forçar atualização da interface
            setIsCompleted(true)
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao salvar progresso:', error)
      alert('Erro inesperado ao salvar progresso.')
    }
  }

  const checkCourseCompletion = async () => {
    try {
      console.log('Verificando conclusão do curso...')
      
      // Verificar quantas aulas o curso tem
      const totalLessons = course.lessons?.length || 0
      console.log('Total de aulas no curso:', totalLessons)
      
      if (totalLessons === 0) {
        console.log('Curso não tem aulas, não pode ser concluído')
        return
      }
      
      // Verificar quantas aulas o usuário concluiu
      const { data: completedLessons, error: lessonsError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .not('completed_at', 'is', null)
      
      if (lessonsError) {
        console.error('Erro ao verificar aulas concluídas:', lessonsError)
        return
      }
      
      const completedCount = completedLessons?.length || 0
      const progressPercentage = Math.round((completedCount / totalLessons) * 100)
      
      console.log(`Progresso do curso: ${completedCount}/${totalLessons} aulas (${progressPercentage}%)`)
      
      // Atualizar ou criar registro na user_progress
      const { data: userProgress, error: upsertError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: course.id,
          progress: progressPercentage,
          completed_lessons: completedLessons?.map(l => l.lesson_id) || [],
          completed_at: progressPercentage >= 100 ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,course_id'
        })
        .select()
      
      if (upsertError) {
        console.error('Erro ao atualizar progresso do curso:', upsertError)
        return
      }
      
      console.log('Progresso do curso atualizado:', userProgress)
      
      // Se curso foi 100% concluído, gerar certificado
      if (progressPercentage >= 100) {
        console.log('Curso 100% concluído! Verificando certificado...')
        
        // Verificar se já existe certificado
        const { data: existingCertificate, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .single()

        if (certError && certError.code === 'PGRST116') {
          console.log('Certificado não existe, criando...')
          await generateCertificate()
        } else if (existingCertificate) {
          console.log('Certificado já existe:', existingCertificate)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conclusão do curso:', error)
    }
  }

  const generateCertificate = async () => {
    try {
      // Gerar URL do certificado (pode ser uma página específica ou PDF)
      const certificateUrl = `${window.location.origin}/certificate/${course.id}/${user.id}`
      
      const { data, error } = await supabase
        .from('certificates')
        .insert([{
          user_id: user.id,
          course_id: course.id,
          course_title: course.title, // Adicionar nome do curso
          user_name: user.name,       // Adicionar nome do usuário
          certificate_url: certificateUrl,
          issued_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro ao gerar certificado:', error)
      } else {
        console.log('Certificado gerado com sucesso:', data)
        // Mostrar notificação de certificado gerado
        alert(`🎉 Parabéns ${user.name}! Você concluiu o curso "${course.title}" e ganhou um certificado!`)
      }
    } catch (error) {
      console.error('Erro inesperado ao gerar certificado:', error)
    }
  }

  // Salvar progresso automaticamente a cada 30 segundos
  useEffect(() => {
    if (currentTime > 0 && !isCompleted) {
      const interval = setInterval(() => {
        saveLessonProgress(false)
      }, 30000) // 30 segundos

      return () => clearInterval(interval)
    }
  }, [currentTime, isCompleted])

  // Carregar progresso existente
  useEffect(() => {
    loadLessonProgress()
  }, [lesson.id, user.id])

  const loadLessonProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single()

      if (data && !error) {
        setIsCompleted(data.is_completed)
        if (data.time_watched > 0) {
          setCurrentTime(data.time_watched)
        }
        console.log('Progresso carregado:', data)
      }
    } catch (error) {
      // Não há progresso salvo ainda, isso é normal
      console.log('Nenhum progresso encontrado para esta aula')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderLessonContent = () => {
    console.log('Renderizando conteúdo da aula:', {
      type: lesson.type,
      content: lesson.content,
      isYouTube: isYouTubeUrl(lesson.content),
      isVimeo: isVimeoUrl(lesson.content),
      isDirect: isDirectVideoUrl(lesson.content)
    })

    switch (lesson.type) {
      case 'video':
        return (
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            {/* Video Player */}
            <div className="w-full h-full">
              {isYouTubeUrl(lesson.content) ? (
                <iframe
                  src={getYouTubeEmbedUrl(lesson.content)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              ) : isVimeoUrl(lesson.content) ? (
                <iframe
                  src={getVimeoEmbedUrl(lesson.content)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              ) : isDirectVideoUrl(lesson.content) ? (
                <video
                  className="w-full h-full"
                  controls
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                >
                  <source src={lesson.content} type="video/mp4" />
                  <source src={lesson.content} type="video/webm" />
                  <source src={lesson.content} type="video/ogg" />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              ) : (
                // Fallback para URLs que não são reconhecidas
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <div className="text-center max-w-md">
                    <Play className="h-16 w-16 mx-auto mb-4 text-white/80" />
                    <h3 className="text-xl font-semibold mb-2">Conteúdo de Vídeo</h3>
                    <p className="text-gray-300 mb-6">{lesson.description}</p>
                    <a
                      href={lesson.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Vídeo em Nova Aba
                    </a>
                    <p className="text-xs text-gray-400 mt-4">
                      URL: {lesson.content}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Controls Overlay (apenas para vídeos diretos) */}
            {isDirectVideoUrl(lesson.content) && (
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div 
                    className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6 text-white" />
                      ) : (
                        <Play className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all">
                      <Volume2 className="h-5 w-5 text-white" />
                    </button>
                    <button className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all">
                      <Maximize className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Click overlay to show/hide controls (apenas para vídeos diretos) */}
            {isDirectVideoUrl(lesson.content) && (
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={() => setShowControls(!showControls)}
              />
            )}
          </div>
        )

      case 'document':
        return (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Documento/PDF
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {lesson.description}
            </p>
            <a
              href={lesson.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Documento
            </a>
          </div>
        )

      case 'link':
        return (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8">
            <ExternalLink className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Link Externo
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {lesson.description}
            </p>
            <a
              href={lesson.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Link
            </a>
          </div>
        )

      case 'quiz':
        return (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8">
            <HelpCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Quiz/Avaliação
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {lesson.description}
            </p>
            <button
              onClick={handleComplete}
              className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Iniciar Quiz
            </button>
          </div>
        )

      default:
        return (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Tipo de conteúdo não suportado</p>
          </div>
        )
    }
  }

  // Funções auxiliares para detectar tipos de URL
  const isYouTubeUrl = (url: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url)
  }

  const isVimeoUrl = (url: string) => {
    return /vimeo\.com\//.test(url)
  }

  const isDirectVideoUrl = (url: string) => {
    return /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i.test(url)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`
    }
    return url
  }

  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/
    const match = url.match(regExp)
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=0`
    }
    return url
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lesson.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {course.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isCompleted && (
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Concluído
              </div>
            )}
            <span className="text-sm text-gray-500">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="h-full">
            {renderLessonContent()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
          {/* Lesson Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sobre esta aula
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {lesson.description}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Progresso
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentTime / duration) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-4 w-4 mr-2" />
              Aula Anterior
            </button>

            {!isCompleted ? (
              <button
                onClick={handleComplete}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Concluído
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Próxima Aula
              </button>
            )}
          </div>

          {/* Course Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Informações do Curso
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">Instrutor:</span> {course.instructor}
              </p>
              <p>
                <span className="font-medium">Departamento:</span> {course.department}
              </p>
              <p>
                <span className="font-medium">Duração:</span> {Math.floor(course.duration / 60)}h {course.duration % 60}min
              </p>
              {course.is_mandatory && (
                <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs">
                  Obrigatório
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LessonPlayer