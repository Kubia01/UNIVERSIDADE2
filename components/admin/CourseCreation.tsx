'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Plus, Trash2, Save, Video, FileText, HelpCircle, Link, X, Edit } from 'lucide-react'
import { CourseType, Course, Lesson, LessonType, supabase } from '@/lib/supabase'

interface CourseCreationProps {
  course?: Course | null
  onBack: () => void
  onSave: (courseData: any) => void
}

const CourseCreation: React.FC<CourseCreationProps> = ({ course, onBack, onSave }) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    type: 'skills' as CourseType,
    instructor: '',
    thumbnail: '',
    is_mandatory: false,
    department: 'HR',
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
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [contentInputType, setContentInputType] = useState<'url' | 'upload'>('url')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')

  // Load course data if editing
  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title || '',
        description: course.description || '',
        type: course.type || 'skills',
        instructor: course.instructor || '',
        department: course.department || 'HR',
        thumbnail: course.thumbnail || '',
        is_mandatory: course.is_mandatory || false,
        lessons: course.lessons || []
      })
      
      // Se há aulas, carregar do banco
      if (course.id) {
        loadExistingLessons(course.id)
      }
    }
  }, [course])

  const loadExistingLessons = async (courseId: string) => {
    try {
      console.log('🔄 CORRIGIDO: Carregando aulas para curso:', courseId, 'da tabela VIDEOS')
      console.log('Carregando aulas para curso:', courseId)
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Erro ao carregar aulas:', error)
        return
      }

      const lessons = (videos || []).map((video: any) => ({
        title: video.title || 'Sem título',
        description: video.description || '',
        type: video.type || 'video',
        content: video.video_url || video.content || '',
        duration: video.duration || 0,
        order_index: video.order_index || 0
      }))

      console.log('Aulas carregadas:', lessons)
      setCourseData(prev => ({
        ...prev,
        lessons: lessons
      }))
    } catch (error) {
      console.error('Erro ao carregar aulas existentes:', error)
    }
  }

  const departments = [
    { value: 'HR', label: 'Recursos Humanos' },
    { value: 'IT', label: 'Tecnologia da Informação' },
    { value: 'Finance', label: 'Financeiro' },
    { value: 'Sales', label: 'Vendas' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Operations', label: 'Operações' },
    { value: 'Legal', label: 'Jurídico' }
  ]

  const lessonTypes: { value: LessonType; label: string; icon: any }[] = [
    { value: 'video', label: 'Vídeo', icon: Video },
    { value: 'document', label: 'Documento', icon: FileText },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle },
    { value: 'link', label: 'Link Externo', icon: Link }
  ]

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ [CourseCreation] handleThumbnailUpload executado')
    const file = e.target.files?.[0]
    
    if (!file) {
      console.log('🖼️ [CourseCreation] Nenhum arquivo selecionado')
      return
    }
    
    console.log('🖼️ [CourseCreation] Arquivo selecionado:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      console.error('🖼️ [CourseCreation] Tipo de arquivo inválido:', file.type)
      alert('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, GIF ou WebP)')
      return
    }
    
    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('🖼️ [CourseCreation] Arquivo muito grande:', file.size)
      alert('A imagem é muito grande. Por favor, selecione uma imagem menor que 5MB.')
      return
    }
    
    console.log('🖼️ [CourseCreation] Iniciando leitura do arquivo...')
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log('🖼️ [CourseCreation] FileReader onload executado, result length:', result?.length)
      
      if (result) {
        // Se a imagem for muito grande, comprimir
        if (result.length > 75000) { // Aumentar limite para 75KB
          console.log('⚠️ [CourseCreation] Imagem muito grande, comprimindo...')
          console.log('⚠️ [CourseCreation] Tamanho original:', result.length, 'chars')
          
          const img = new Image()
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              
              if (!ctx) {
                console.error('❌ [CourseCreation] Erro ao obter contexto do canvas')
                alert('Erro ao processar imagem. Tente uma imagem menor.')
                return
              }
              
              // Reduzir tamanho para máximo 400x300 (melhor qualidade)
              const maxWidth = 400
              const maxHeight = 300
              let { width, height } = img
              
              // Calcular novo tamanho mantendo proporção
              const aspectRatio = width / height
              if (width > height) {
                if (width > maxWidth) {
                  width = maxWidth
                  height = width / aspectRatio
                }
              } else {
                if (height > maxHeight) {
                  height = maxHeight
                  width = height * aspectRatio
                }
              }
              
              // Garantir que não exceda nenhum limite
              if (width > maxWidth) {
                width = maxWidth
                height = width / aspectRatio
              }
              if (height > maxHeight) {
                height = maxHeight
                width = height * aspectRatio
              }
              
              canvas.width = Math.round(width)
              canvas.height = Math.round(height)
              
              // Melhorar qualidade da renderização
              ctx.imageSmoothingEnabled = true
              ctx.imageSmoothingQuality = 'high'
              
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              
              // Tentar diferentes qualidades até obter tamanho adequado
              let quality = 0.8
              let compressedResult = canvas.toDataURL('image/jpeg', quality)
              
              // Se ainda estiver muito grande, reduzir qualidade
              while (compressedResult.length > 75000 && quality > 0.3) {
                quality -= 0.1
                compressedResult = canvas.toDataURL('image/jpeg', quality)
              }
              
              console.log('✅ [CourseCreation] Imagem comprimida de', result.length, 'para', compressedResult.length, 'chars (qualidade:', quality, ')')
              
              console.log('🖼️ [CourseCreation] Atualizando courseData com thumbnail comprimida')
              setCourseData(prev => {
                const updated = { ...prev, thumbnail: compressedResult }
                console.log('🖼️ [CourseCreation] courseData atualizado:', { 
                  ...updated, 
                  thumbnail: `${compressedResult.substring(0, 50)}...` 
                })
                return updated
              })
              
              console.log('✅ [CourseCreation] Thumbnail comprimida carregada com sucesso!')
              setTimeout(() => {
                alert('✅ Imagem comprimida e carregada com sucesso!')
              }, 100)
            } catch (error) {
              console.error('❌ [CourseCreation] Erro ao comprimir imagem:', error)
              alert('Erro ao comprimir imagem. Tente uma imagem menor ou diferente.')
            }
          }
          
          img.onerror = () => {
            console.error('❌ [CourseCreation] Erro ao carregar imagem para compressão')
            alert('Erro ao processar imagem. Verifique se o arquivo é uma imagem válida.')
          }
          
          img.src = result
        } else {
          console.log('🖼️ [CourseCreation] Atualizando courseData com thumbnail')
          setCourseData(prev => {
            const updated = { ...prev, thumbnail: result }
            console.log('🖼️ [CourseCreation] courseData atualizado:', { 
              ...updated, 
              thumbnail: `${result.substring(0, 50)}...` 
            })
            return updated
          })
          
          console.log('✅ [CourseCreation] Thumbnail carregada com sucesso!')
          setTimeout(() => {
            alert('✅ Imagem carregada com sucesso!')
          }, 100)
        }
      } else {
        console.error('🖼️ [CourseCreation] Result vazio do FileReader')
      }
    }
    
    reader.onerror = (error) => {
      console.error('🖼️ [CourseCreation] Erro no FileReader:', error)
      alert('Erro ao processar a imagem. Tente novamente.')
    }
    
    reader.readAsDataURL(file)
  }

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true)
    try {
      // Validar tipo e tamanho do arquivo
      const maxSize = 500 * 1024 * 1024 // 500MB
      const supabaseLimit = 50 * 1024 * 1024 // 50MB (limite real do Supabase free tier)
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/mkv']
      
      if (file.size > maxSize) {
        alert('❌ Arquivo muito grande! Tamanho máximo: 500MB')
        return
      }
      
      if (file.size > supabaseLimit) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1)
        const shouldContinue = confirm(`⚠️ Arquivo grande (${sizeMB}MB)!

O Supabase free tier tem limite de 50MB por arquivo.
Se você tem um plano pago, pode continuar.

Deseja tentar fazer o upload mesmo assim?`)
        
        if (!shouldContinue) {
          return
        }
      }
      
              if (!allowedTypes.includes(file.type)) {
          alert('❌ Tipo de arquivo não suportado! Use: MP4, WebM, OGG, AVI, MOV ou MKV')
          return
        }

      const fileExt = file.name.split('.').pop()
      const fileName = `videos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      console.log('📤 Iniciando upload do arquivo:', file.name, 'Tamanho:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
      
      // Verificar se o bucket existe
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === 'course-videos')
      
      if (!bucketExists) {
        console.error('❌ Bucket course-videos não existe')
        alert(`❌ Bucket de armazenamento não configurado!

Siga estes passos:
1. Acesse o Supabase Dashboard
2. Vá para Storage → Create Bucket
3. Nome: course-videos
4. Marque como "Public bucket"
5. File size limit: 524288000 (500MB)

Ou consulte o arquivo create-storage-bucket.md para instruções detalhadas.`)
        return
      }
      
      // Simular progresso para arquivos grandes
      setUploadProgress(10)
      
      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      setUploadProgress(90)

      if (error) {
        console.error('Erro no upload:', error)
        let errorMessage = 'Erro ao fazer upload do arquivo'
        const errorMsg = error instanceof Error ? error.message : String(error)
        
        if (errorMsg.includes('The resource already exists')) {
          errorMessage = 'Arquivo com este nome já existe. Tente novamente.'
        } else if (errorMsg.includes('Row level security')) {
          errorMessage = 'Erro de permissão. Verifique as configurações do Supabase.'
        } else if (errorMsg.includes('JWT')) {
          errorMessage = 'Sessão expirada. Faça login novamente.'
        }
        
        alert('❌ ' + errorMessage + '\nDetalhes: ' + errorMsg)
        return
      }

      console.log('✅ Upload concluído:', data.path)

      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName)

      setUploadProgress(100)
      setCurrentLesson({ ...currentLesson, content: publicUrl })
      alert('✅ Vídeo enviado com sucesso!')
      
    } catch (error) {
      console.error('Erro geral no upload:', error)
      alert('❌ Erro inesperado no upload: ' + (error as Error).message)
    } finally {
      setUploadingVideo(false)
      setUploadProgress(0)
    }
  }

  const handleAddLesson = () => {
    // Validação melhorada para templates/aulas
    if (!currentLesson.title || !currentLesson.title.trim()) {
      alert('❌ Por favor, preencha o título da aula/template.')
      return
    }

    if (!currentLesson.content || !currentLesson.content.trim()) {
      alert('❌ Por favor, adicione o conteúdo da aula/template (URL ou arquivo).')
      return
    }

    // Validação específica para URLs
    if (currentLesson.type === 'video' && currentLesson.content.startsWith('http')) {
      try {
        new URL(currentLesson.content)
      } catch (error) {
        alert('❌ URL inválida. Por favor, verifique o link do vídeo.')
        return
      }
    }

    // Validação de duração
    if (currentLesson.duration < 0) {
      alert('❌ A duração deve ser um valor positivo.')
      return
    }

    const newLesson = {
      ...currentLesson,
      title: currentLesson.title.trim(),
      description: currentLesson.description.trim(),
      content: currentLesson.content.trim(),
      order_index: editingLessonIndex !== null ? editingLessonIndex : courseData.lessons.length,
      id: editingLessonIndex !== null ? courseData.lessons[editingLessonIndex]?.id : undefined
    }

    console.log('✅ Adicionando nova aula/template:', newLesson)

    if (editingLessonIndex !== null) {
      // Editando aula existente
      const updatedLessons = [...courseData.lessons]
      updatedLessons[editingLessonIndex] = newLesson
      setCourseData({ ...courseData, lessons: updatedLessons })
      console.log('✅ Template/aula editada com sucesso!')
    } else {
      // Adicionando nova aula
      setCourseData({ ...courseData, lessons: [...courseData.lessons, newLesson] })
      console.log('✅ Novo template/aula adicionada ao módulo!')
    }

    // Resetar formulário
    setCurrentLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      duration: 0
    })
    setEditingLessonIndex(null)
    setShowLessonForm(false)
    setViewMode('list')
    
    // Feedback visual de sucesso
    alert(`✅ ${editingLessonIndex !== null ? 'Template atualizado' : 'Template adicionado ao módulo'} com sucesso!`)
  }

  const handleEditLesson = (index: number) => {
    const lesson = courseData.lessons[index]
    setCurrentLesson(lesson)
    setEditingLessonIndex(index)
    setContentInputType(lesson.content.startsWith('http') ? 'url' : 'upload')
    setShowLessonForm(true)
    setViewMode('form')
  }

  const handleCancelEdit = () => {
    setCurrentLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      duration: 0
    })
    setEditingLessonIndex(null)
    setShowLessonForm(false)
  }

  const handleRemoveLesson = (index: number) => {
    const updatedLessons = courseData.lessons.filter((_, i) => i !== index)
    setCourseData({ ...courseData, lessons: updatedLessons })
  }

  const handleSaveCourse = () => {
    // Validação aprimorada dos campos obrigatórios
    if (!courseData.title || !courseData.title.trim()) {
      alert('❌ Por favor, preencha o título do curso.')
      return
    }

    if (!courseData.description || !courseData.description.trim()) {
      alert('❌ Por favor, preencha a descrição do curso.')
      return
    }

    if (!courseData.instructor || !courseData.instructor.trim()) {
      alert('❌ Por favor, preencha o nome do instrutor.')
      return
    }

    if (courseData.lessons.length === 0) {
      alert('❌ Por favor, adicione pelo menos um template/aula ao módulo do curso.')
      return
    }

    // Validação melhorada das aulas/templates
    const invalidLessons = courseData.lessons.filter((lesson, index) => {
      if (!lesson.title || !lesson.title.trim()) {
        alert(`❌ Template/aula ${index + 1} está sem título. Por favor, verifique.`)
        return true
      }
      if (!lesson.content || !lesson.content.trim()) {
        alert(`❌ Template/aula "${lesson.title}" está sem conteúdo. Por favor, adicione o conteúdo.`)
        return true
      }
      return false
    })

    if (invalidLessons.length > 0) {
      return
    }

    // Calcular duração total dos templates/aulas
    const totalDuration = courseData.lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0)
    
    const newCourse = {
      ...courseData,
      title: courseData.title.trim(),
      description: courseData.description.trim(),
      instructor: courseData.instructor.trim(),
      duration: totalDuration,
      is_published: true,
      created_at: course?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('✅ Salvando curso com templates/módulos:', newCourse)
    console.log('📚 Total de templates/aulas no módulo:', newCourse.lessons.length)
    
    onSave(newCourse)
  }

  const handleStartNewLesson = () => {
    setCurrentLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      duration: 0
    })
    setEditingLessonIndex(null)
    setContentInputType('url')
    setShowLessonForm(true)
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
            Preencha as informações do curso e adicione as aulas
          </p>
        </div>
      </div>

      {/* Course Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações do Curso
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título do Curso *
            </label>
            <input
              type="text"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Digite o título do curso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instrutor *
            </label>
            <input
              type="text"
              value={courseData.instructor}
              onChange={(e) => setCourseData({ ...courseData, instructor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nome do instrutor"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição *
          </label>
          <textarea
            value={courseData.description}
            onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Descreva o conteúdo e objetivos do curso"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo do Curso
            </label>
            <select
              value={courseData.type}
              onChange={(e) => setCourseData({ ...courseData, type: e.target.value as CourseType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="skills">Desenvolvimento de Competências</option>
              <option value="training">Treinamento</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Departamento
            </label>
            <select
              value={courseData.department}
              onChange={(e) => setCourseData({ ...courseData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                checked={courseData.is_mandatory}
                onChange={(e) => setCourseData({ ...courseData, is_mandatory: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Curso obrigatório</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Imagem de Capa do Módulo
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            {courseData.thumbnail ? (
              <div className="flex items-center space-x-4">
                <img
                  src={courseData.thumbnail}
                  alt="Capa do módulo"
                  className="w-24 h-24 object-cover rounded-lg shadow-md"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✅ Imagem carregada com sucesso!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Clique no botão abaixo para alterar a imagem
                  </p>
                  <button
                    onClick={() => setCourseData({ ...courseData, thumbnail: '' })}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Remover imagem
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Adicione uma imagem de capa para o módulo
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Formatos aceitos: JPEG, PNG, GIF, WebP (máx. 5MB)
                </p>
              </div>
            )}
            
            <label className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors mt-4">
              <Upload className="h-4 w-4 mr-2" />
              {courseData.thumbnail ? 'Alterar Imagem' : 'Selecionar Imagem'}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Lesson Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciar Aulas
          </h2>
          
          {/* Interface com dois botões lado a lado */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setViewMode('list')
                setShowLessonForm(false)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Visualizar Aulas
            </button>
            <button
              onClick={() => {
                setViewMode('form')
                handleStartNewLesson()
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'form'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Adicionar Aula
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="space-y-4">
            {courseData.lessons.length > 0 ? (
              courseData.lessons.map((lesson, index) => {
                const Icon = getLessonIcon(lesson.type)
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lesson.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.type} • {lesson.duration || 0} min
                        </p>
                        {lesson.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            {lesson.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {lesson.content.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditLesson(index)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        title="Editar aula"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveLesson(index)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                        title="Remover aula"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Nenhuma aula adicionada ainda
                </p>
                <button
                  onClick={() => {
                    setViewMode('form')
                    handleStartNewLesson()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Adicionar primeira aula
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'form' && showLessonForm && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              {editingLessonIndex !== null ? 'Editar Aula' : 'Nova Aula'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Aula *
                </label>
                <input
                  type="text"
                  value={currentLesson.title}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite o título da aula"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo da Aula
                </label>
                <select
                  value={currentLesson.type}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, type: e.target.value as LessonType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {lessonTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={currentLesson.description}
                onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descrição opcional da aula"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração (minutos)
              </label>
              <input
                type="number"
                value={currentLesson.duration}
                onChange={(e) => setCurrentLesson({ ...currentLesson, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo *
              </label>
              
              <div className="flex space-x-2 mb-3">
                <button
                  type="button"
                  onClick={() => setContentInputType('url')}
                  className={`px-3 py-1 text-sm rounded ${
                    contentInputType === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  URL/Link
                </button>
                <button
                  type="button"
                  onClick={() => setContentInputType('upload')}
                  className={`px-3 py-1 text-sm rounded ${
                    contentInputType === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Upload de Arquivo
                </button>
              </div>

              {contentInputType === 'url' ? (
                <input
                  type="url"
                  value={currentLesson.content}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://exemplo.com/video.mp4"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    accept="video/*,application/pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && currentLesson.type === 'video') {
                        handleVideoUpload(file)
                      }
                    }}
                    className="w-full"
                    disabled={uploadingVideo}
                  />
                  {uploadingVideo && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-blue-600">Fazendo upload...</p>
                        <span className="text-sm text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Arquivos grandes podem levar alguns minutos para carregar
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddLesson}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingLessonIndex !== null ? 'Atualizar Aula' : 'Adicionar Aula'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Course */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {courseData.lessons.length} aula{courseData.lessons.length !== 1 ? 's' : ''} adicionada{courseData.lessons.length !== 1 ? 's' : ''}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveCourse}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {course ? 'Atualizar Curso' : 'Salvar Curso'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseCreation