'use client'

import React, { useState, useEffect } from 'react'
import { Award, Download, Eye, Calendar, BookOpen, User as UserIcon, Share2 } from 'lucide-react'
import { Certificate, User, Course } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface CertificateWithDetails extends Certificate {
  course_title?: string
  course_instructor?: string
  course_department?: string
}

interface CertificateViewerProps {
  user: User
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({ user }) => {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithDetails | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadUserCertificates()
  }, [user.id])

  const loadUserCertificates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Erro ao carregar certificados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = (certificate: CertificateWithDetails) => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank')
    } else {
      alert('Certificado não disponível para download')
    }
  }

  const handleViewCertificate = (certificate: CertificateWithDetails) => {
    setSelectedCertificate(certificate)
    setShowModal(true)
  }

  const handleShareCertificate = (certificate: CertificateWithDetails) => {
    if (navigator.share) {
      navigator.share({
        title: `Certificado - ${certificate.course_title}`,
        text: `Confira meu certificado do curso ${certificate.course_title}`,
        url: certificate.certificate_url || window.location.href
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `Confira meu certificado do curso ${certificate.course_title}! ${certificate.certificate_url || window.location.href}`
      navigator.clipboard.writeText(shareText)
      alert('Link copiado para a área de transferência!')
    }
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
            Meus Certificados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e baixe seus certificados de conclusão
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Certificados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{certificates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Último Certificado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {certificates.length > 0 
                  ? new Date(Math.max(...certificates.map(c => new Date(c.issued_at).getTime()))).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
                  : '-'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursos Concluídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{certificates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8" />
                  <span className="text-sm font-medium bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    Certificado
                  </span>
                </div>
                <h3 className="text-lg font-semibold mt-4 mb-2">
                  {certificate.course_title}
                </h3>
                <p className="text-blue-100 text-sm">
                  Instrutor: {certificate.course_instructor}
                </p>
              </div>

              {/* Certificate Body */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>{user.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>{certificate.course_department}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewCertificate(certificate)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => handleDownloadCertificate(certificate)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </button>
                  <button
                    onClick={() => handleShareCertificate(certificate)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    title="Compartilhar"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Você ainda não possui certificados.</p>
          <p className="text-sm text-gray-400 mt-2">
            Complete cursos para ganhar certificados de conclusão!
          </p>
        </div>
      )}

      {/* Certificate Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Certificado de Conclusão
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Certificate Preview */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-8 text-center">
                <div className="mb-6">
                  <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Certificado de Conclusão
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Universidade Corporativa
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    Certificamos que
                  </p>
                  <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {user.name}
                  </h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    concluiu com êxito o curso
                  </p>
                  <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedCertificate.course_title}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Instrutor</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedCertificate.course_instructor}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Data de Emissão</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedCertificate.issued_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Certificado ID: {selectedCertificate.id}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center space-x-3 mt-6">
                <button
                  onClick={() => handleDownloadCertificate(selectedCertificate)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Certificado
                </button>
                <button
                  onClick={() => handleShareCertificate(selectedCertificate)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificateViewer