'use client'

import React, { useState, useEffect } from 'react'
import { Search, Award, Download, Eye, Calendar, User, BookOpen, Filter } from 'lucide-react'
import { supabase, Certificate, User as UserType, Course } from '@/lib/supabase'
import { emergencyGetCourses } from '@/lib/supabase-emergency'

interface CertificateWithDetails extends Certificate {
  user_name?: string
  user_email?: string
  course_title?: string
  course_instructor?: string
}

const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    loadCertificates()
    loadCourses()
  }, [])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Erro ao carregar certificados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    console.log('⚡ [CertificateManagement] CARREGAMENTO ULTRA RÁPIDO')
    try {
      // Usar sistema de emergência OTIMIZADO
      const result = await emergencyGetCourses('admin', true)
      
      if (result.error) {
        console.error('❌ Erro ao carregar cursos:', result.error)
        setCourses([])
      } else {
        const courses = result.data || []
        console.log('✅ Cursos carregados para certificados:', courses.length)
        setCourses(courses)
      }
    } catch (error) {
      console.error('💥 Erro crítico ao carregar cursos:', error)
      setCourses([])
    }
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.course_title?.toLowerCase().includes(searchTerm.toLowerCase())

    const certMonth = new Date(cert.issued_at).getMonth()
    const currentMonth = new Date().getMonth()
    const matchesMonth = selectedMonth === 'all' || 
                        (selectedMonth === 'current' && certMonth === currentMonth) ||
                        (selectedMonth === 'last' && certMonth === currentMonth - 1)

    const matchesCourse = selectedCourse === 'all' || cert.course_id === selectedCourse

    return matchesSearch && matchesMonth && matchesCourse
  })

  const handleDownloadCertificate = (certificate: CertificateWithDetails) => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank')
    } else {
      alert('Certificado não disponível para download')
    }
  }

  const handleViewCertificate = (certificate: CertificateWithDetails) => {
    // Open certificate in modal or new tab
    alert(`Visualizando certificado de ${certificate.user_name} para ${certificate.course_title}`)
  }

  const generateCertificateReport = () => {
    const reportData = {
      total: certificates.length,
      thisMonth: certificates.filter(cert => {
        const certMonth = new Date(cert.issued_at).getMonth()
        const currentMonth = new Date().getMonth()
        return certMonth === currentMonth
      }).length,
      byDepartment: {},
      byCourse: {}
    }

    alert(`Relatório gerado:\n- Total de certificados: ${reportData.total}\n- Certificados este mês: ${reportData.thisMonth}`)
  }

  const months = [
    { value: 'all', label: 'Todos os meses' },
    { value: 'current', label: 'Mês atual' },
    { value: 'last', label: 'Mês anterior' }
  ]

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
            Gerenciar Certificados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e gerencie os certificados emitidos
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button
            onClick={generateCertificateReport}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Este Mês</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {certificates.filter(cert => {
                  const certMonth = new Date(cert.issued_at).getMonth()
                  const currentMonth = new Date().getMonth()
                  return certMonth === currentMonth
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuários Certificados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(certificates.map(cert => cert.user_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cursos com Certificados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(certificates.map(cert => cert.course_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar certificados..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os cursos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Certificates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Instrutor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data de Emissão
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCertificates.map((certificate) => (
                <tr key={certificate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {certificate.user_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {certificate.user_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {certificate.user_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {certificate.course_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {certificate.course_instructor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewCertificate(certificate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Visualizar certificado"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Baixar certificado"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCertificates.length === 0 && (
        <div className="text-center py-12">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedMonth !== 'all' || selectedCourse !== 'all'
              ? 'Nenhum certificado encontrado com os filtros aplicados.'
              : 'Nenhum certificado emitido ainda.'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Certificados são gerados automaticamente quando os usuários completam cursos.
          </p>
        </div>
      )}
    </div>
  )
}

export default CertificateManagement