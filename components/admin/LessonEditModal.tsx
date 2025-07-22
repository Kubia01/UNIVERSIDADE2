'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Upload, Play, FileText, HelpCircle, Link as LinkIcon, Video } from 'lucide-react'
import { supabase, LessonType } from '@/lib/supabase'

interface LessonEditModalProps {
  lesson: any
  courseId: string
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const LessonEditModal: React.FC<LessonEditModalProps> = ({
  lesson,
  courseId,
  isOpen,
  onClose,
  onSave
}) => {
  const [editingLesson, setEditingLesson] = useState({
    id: '',
    title: '',
    description: '',
    type: 'video' as LessonType,
    video_url: '',
    duration: 0,
    order_index: 0
  })
  
  const [contentInputType, setContentInputType] = useState<'url' | 'upload'>('url')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [saving, setSaving] = useState(false)

  const lessonTypes = [
    { value: 'video', label: 'Vídeo', icon: Video },
    { value: 'document', label: 'Documento', icon: FileText },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle },
    { value: 'link', label: 'Link Externo', icon: LinkIcon }
  ]

  useEffect(() => {
    if (lesson && isOpen) {
      setEditingLesson({
        id: lesson.id,
        title: lesson.title || '',
        description: lesson.description || '',
        type: lesson.type || 'video',
        video_url: lesson.video_url || '',
        duration: lesson.duration || 0,
        order_index: lesson.order_index || 0
      })
      
      // Detectar se é URL ou upload baseado no conteúdo
      if (lesson.video_url && lesson.video_url.includes('supabase')) {
        setContentInputType('upload')
      } else {
        setContentInputType('url')
      }
    }
  }, [lesson, isOpen])

  const handleVideoUpload = async (file: File) => {
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use MP4, WebM, OGG, AVI ou MOV.')
      return
    }

    // Validar tamanho (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 100MB.')
      return
    }

    setUploadingVideo(true)

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file)

      if (error) throw error

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName)

      // Atualizar o campo de conteúdo com a URL
      setEditingLesson({
        ...editingLesson,
        video_url: publicUrl
      })

      alert('Vídeo enviado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload do vídeo: ' + error.message)
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleSave = async () => {
    if (!editingLesson.title || !editingLesson.video_url) {
      alert('Por favor, preencha o título e o conteúdo da aula.')
      return
    }

    setSaving(true)

    try {
      console.log('Salvando aula editada:', editingLesson)
      
      const { error } = await supabase
        .from('videos')
        .update({
          title: editingLesson.title,
          description: editingLesson.description,
          type: editingLesson.type,
          video_url: editingLesson.video_url,
          duration: editingLesson.duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLesson.id)

      if (error) throw error

      alert('Aula atualizada com sucesso!')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar aula:', error)
      alert('Erro ao salvar aula: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Editar Aula
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título da Aula *
              </label>
              <input
                type="text"
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o título da aula"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={editingLesson.description}
                onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Breve descrição da aula"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Conteúdo
              </label>
              <select
                value={editingLesson.type}
                onChange={(e) => setEditingLesson({ ...editingLesson, type: e.target.value as LessonType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {lessonTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duração */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração (minutos)
              </label>
              <input
                type="number"
                value={editingLesson.duration}
                onChange={(e) => setEditingLesson({ ...editingLesson, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Conteúdo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {editingLesson.type === 'video' ? 'Conteúdo do Vídeo' : 
                 editingLesson.type === 'document' ? 'Documento/PDF' :
                 editingLesson.type === 'link' ? 'URL do Link' : 'Conteúdo'} *
              </label>
              
              {editingLesson.type === 'video' && (
                <div className="mb-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contentType"
                        value="url"
                        checked={contentInputType === 'url'}
                        onChange={() => setContentInputType('url')}
                        className="mr-2"
                      />
                      <span className="text-sm">URL do Vídeo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="contentType"
                        value="upload"
                        checked={contentInputType === 'upload'}
                        onChange={() => setContentInputType('upload')}
                        className="mr-2"
                      />
                      <span className="text-sm">Upload do Computador</span>
                    </label>
                  </div>
                </div>
              )}

              {editingLesson.type === 'video' && contentInputType === 'upload' ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    {uploadingVideo ? (
                      <div className="flex flex-col items-center">
                        <div className="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enviando vídeo...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Clique para selecionar um novo vídeo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          MP4, WebM, OGG, AVI, MOV (máx. 100MB)
                        </p>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleVideoUpload(file)
                          }}
                          className="hidden"
                          id="video-upload-edit"
                        />
                        <label
                          htmlFor="video-upload-edit"
                          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Vídeo
                        </label>
                      </>
                    )}
                  </div>
                  {editingLesson.video_url && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✓ Vídeo atual configurado
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 break-all">
                        {editingLesson.video_url}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="url"
                  value={editingLesson.video_url}
                  onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editingLesson.type === 'video' && contentInputType === 'url' ? 'https://youtube.com/watch?v=... ou https://exemplo.com/video.mp4' : 'Cole a URL do conteúdo'}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadingVideo}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LessonEditModal