'use client'

import React, { useState, useEffect } from 'react'
import { Users, BookOpen, Plus, Trash2, Save, Search, Filter, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  department: string
  role: string
}

interface Course {
  id: string
  title: string
  description: string
  type: string
}

interface CourseAssignment {
  id: string
  user_id: string
  course_id: string
  assigned_at: string
  assigned_by: string
}

const CourseAssignment: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadUserCourses()
    }
  }, [selectedUser, assignments])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

      if (usersError) throw usersError

      // Carregar cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('title')

      if (coursesError) throw coursesError

      // Carregar atribuições existentes
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('*')

      // Se a tabela não existir, criar ela
      if (assignmentsError && assignmentsError.code === '42P01') {
        console.log('Tabela course_assignments não existe, será criada automaticamente quando necessário')
        setAssignments([])
      } else if (assignmentsError) {
        throw assignmentsError
      } else {
        setAssignments(assignmentsData || [])
      }

      setUsers(usersData || [])
      setCourses(coursesData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserCourses = () => {
    if (!selectedUser) return

    const userAssignments = assignments.filter(a => a.user_id === selectedUser.id)
    const assignedCourseIds = userAssignments.map(a => a.course_id)
    
    const assigned = courses.filter(c => assignedCourseIds.includes(c.id))
    const available = courses.filter(c => !assignedCourseIds.includes(c.id))

    setAssignedCourses(assigned)
    setAvailableCourses(available)
  }

  const ensureTableExists = async () => {
    // Verificar se a tabela existe tentando fazer uma consulta simples
    const { error: testError } = await supabase
      .from('course_assignments')
      .select('id')
      .limit(1)
    
    if (testError && testError.code === '42P01') {
      // Tabela não existe - mostrar instruções para o admin
      console.log('⚠️ Tabela course_assignments não existe. Execute o SQL no Supabase Dashboard:')
      console.log(`
        CREATE TABLE course_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, course_id)
        );
        
        ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own course assignments" ON course_assignments
          FOR SELECT USING (auth.uid() = user_id);
          
        CREATE POLICY "Admins can manage all course assignments" ON course_assignments
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
            )
          );
      `)
      
      throw new Error('Tabela course_assignments não existe. Verifique o console para instruções de criação.')
    }
  }

  const assignCourse = async (courseId: string) => {
    if (!selectedUser) return

    try {
      setSaving(true)

      // Garantir que a tabela existe
      await ensureTableExists()

      const { data: currentUser } = await supabase.auth.getUser()
      
      const newAssignment = {
        user_id: selectedUser.id,
        course_id: courseId,
        assigned_by: currentUser.user?.id || 'system',
        assigned_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('course_assignments')
        .insert([newAssignment])

      if (error) throw error

      // Atualizar estado local
      setAssignments(prev => [...prev, { ...newAssignment, id: Date.now().toString() }])
      
      alert('✅ Curso atribuído com sucesso!')

    } catch (error: any) {
      console.error('Erro ao atribuir curso:', error)
      alert('❌ Erro ao atribuir curso: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const unassignCourse = async (courseId: string) => {
    if (!selectedUser) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('course_id', courseId)

      if (error) throw error

      // Atualizar estado local
      setAssignments(prev => prev.filter(a => !(a.user_id === selectedUser.id && a.course_id === courseId)))
      
      alert('✅ Curso removido com sucesso!')

    } catch (error: any) {
      console.error('Erro ao remover curso:', error)
      alert('❌ Erro ao remover curso: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Atribuição de Cursos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie quais cursos cada usuário pode acessar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Usuários
              </h3>
              
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {user.department} • {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gerenciamento de Cursos */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-6">
              {/* Header do usuário selecionado */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedUser.email} • {selectedUser.department}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cursos Atribuídos */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cursos Atribuídos ({assignedCourses.length})
                    </h4>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {assignedCourses.length > 0 ? (
                      assignedCourses.map(course => (
                        <div key={course.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {course.title}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {course.description}
                              </p>
                              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                                {course.type}
                              </span>
                            </div>
                            <button
                              onClick={() => unassignCourse(course.id)}
                              disabled={saving}
                              className="ml-3 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Remover curso"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum curso atribuído
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cursos Disponíveis */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cursos Disponíveis ({availableCourses.length})
                    </h4>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {availableCourses.length > 0 ? (
                      availableCourses.map(course => (
                        <div key={course.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {course.title}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {course.description}
                              </p>
                              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                                {course.type}
                              </span>
                            </div>
                            <button
                              onClick={() => assignCourse(course.id)}
                              disabled={saving}
                              className="ml-3 p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Atribuir curso"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Todos os cursos foram atribuídos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecione um usuário
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Escolha um usuário na lista à esquerda para gerenciar seus cursos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseAssignment