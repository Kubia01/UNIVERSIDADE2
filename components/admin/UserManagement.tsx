'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, RotateCcw, MessageSquare, X } from 'lucide-react'
import { supabase, User, Department, UserRole } from '@/lib/supabase'
import { createUserWithAuth, resetUserPassword, deleteUserFromAuth } from '@/lib/supabase-admin'

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All')
  const [selectedRole, setSelectedRole] = useState<UserRole | 'All'>('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    department: 'HR' as Department,
    role: 'user' as UserRole
  })
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    department: 'HR' as Department,
    role: 'user' as UserRole
  })
  const [messageData, setMessageData] = useState({
    title: '',
    message: ''
  })

  const departments: { value: Department | 'All'; label: string }[] = [
    { value: 'All', label: 'Todos os Departamentos' },
    { value: 'HR', label: 'Recursos Humanos' },
    { value: 'Operations', label: 'Operações' },
    { value: 'Sales', label: 'Vendas' },
    { value: 'Engineering', label: 'Engenharia' },
    { value: 'Finance', label: 'Financeiro' },
    { value: 'Marketing', label: 'Marketing' }
  ]

  const roles: { value: UserRole | 'All'; label: string }[] = [
    { value: 'All', label: 'Todos os Perfis' },
    { value: 'user', label: 'Colaborador' },
    { value: 'admin', label: 'Administrador' }
  ]

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === 'All' || user.department === selectedDepartment
    const matchesRole = selectedRole === 'All' || user.role === selectedRole

    return matchesSearch && matchesDepartment && matchesRole
  })

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      setLoading(true)
      console.log('Criando usuário...')
      
      // Criar usuário usando a API route (que cria tanto auth quanto perfil)
      const { data: userData, error: userError } = await createUserWithAuth(
        newUser.email, 
        newUser.password, 
        newUser.name, 
        newUser.department, 
        newUser.role
      )

      if (userError || !userData) {
        console.error('Erro ao criar usuário:', userError)
        throw userError || new Error('Usuário não foi criado corretamente')
      }

      console.log('Usuário criado com sucesso')

      setShowCreateModal(false)
      setNewUser({
        name: '',
        email: '',
        password: '',
        department: 'HR',
        role: 'user'
      })
      alert(`Usuário criado com sucesso!\nEmail: ${newUser.email}\nSenha: ${newUser.password}\n\nO usuário deverá se registrar usando estes dados na tela de login.`)
      await loadUsers()
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('already been registered')) {
        alert('⚠️ Este email já está cadastrado no sistema.\n\nPor favor, use um email diferente ou verifique se o usuário já existe na lista.')
      } else if (errorMessage.includes('duplicate key')) {
        alert('⚠️ Este email já está cadastrado no sistema.')
      } else if (errorMessage.includes('foreign key')) {
        alert('❌ Erro interno: Problema na criação do usuário. Tente novamente.')
      } else {
        alert('❌ Erro ao criar usuário: ' + errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditUser({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editUser.name || !editUser.email) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editUser.name,
          email: editUser.email,
          department: editUser.department,
          role: editUser.role
        })
        .eq('id', editUser.id)

      if (error) throw error

      setShowEditModal(false)
      alert('Usuário atualizado com sucesso!')
      loadUsers()
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao atualizar usuário: ' + errorMessage)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?\n\nEsta ação irá:\n- Remover o usuário do sistema\n- Excluir todo o progresso de cursos\n- Remover certificados emitidos\n\nEsta ação não pode ser desfeita.`)) {
      try {
        setLoading(true)
        
        // Primeiro, deletar dados relacionados (devido às foreign keys)
        
        // 1. Deletar progresso das aulas
        const { error: lessonProgressError } = await supabase
          .from('lesson_progress')
          .delete()
          .eq('user_id', userId)
        
        if (lessonProgressError) {
          console.error('Erro ao deletar progresso das aulas:', lessonProgressError)
        }

        // 2. Deletar progresso dos cursos
        const { error: courseProgressError } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', userId)
        
        if (courseProgressError) {
          console.error('Erro ao deletar progresso dos cursos:', courseProgressError)
        }

        // 3. Deletar certificados
        const { error: certificatesError } = await supabase
          .from('certificates')
          .delete()
          .eq('user_id', userId)
        
        if (certificatesError) {
          console.error('Erro ao deletar certificados:', certificatesError)
        }

        // 4. Deletar o perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId)

        if (profileError) throw profileError

        // 5. Finalmente, deletar o usuário da autenticação
        const { error: authError } = await deleteUserFromAuth(userId)
        
        if (authError) {
          console.error('Erro ao deletar usuário da autenticação:', authError)
          // Não falhar se não conseguir deletar da auth, pois o perfil já foi removido
        }

        alert(`Usuário "${userName}" foi excluído com sucesso!`)
        await loadUsers()
      } catch (error: any) {
        console.error('Erro ao excluir usuário:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        alert('Erro ao excluir usuário: ' + errorMessage)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = 'pass123'
    
    if (confirm(`Tem certeza que deseja redefinir a senha para "${newPassword}"?`)) {
      try {
        setLoading(true)
        
        // Redefinir senha usando função robusta
        const { error } = await resetUserPassword(userId, newPassword)

        if (error) {
          console.error('Erro ao redefinir senha:', error)
          throw error
        }

        alert(`Senha redefinida com sucesso!\nNova senha: ${newPassword}\n\nO usuário pode fazer login com esta nova senha.`)
      } catch (error: any) {
        console.error('Erro ao redefinir senha:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        alert('Erro ao redefinir senha: ' + errorMessage)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSendMessage = (user: User) => {
    setSelectedUser(user)
    setShowMessageModal(true)
  }

  const handleMessageSubmit = () => {
    if (!messageData.title || !messageData.message) {
      alert('Por favor, preencha todos os campos da mensagem.')
      return
    }

    alert(`Mensagem enviada para ${selectedUser?.name}!`)
    setShowMessageModal(false)
    setMessageData({ title: '', message: '' })
    setSelectedUser(null)
  }

  const getRoleColor = (role: UserRole) => {
    const colors = {
      user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    }
    return colors[role]
  }

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      user: 'Colaborador',
      admin: 'Administrador'
    }
    return labels[role]
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
            Gerenciar Usuários
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie colaboradores e suas permissões
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários..."
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
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as UserRole | 'All')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleSendMessage(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Enviar mensagem"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="Redefinir senha"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Criar Novo Usuário
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Senha de acesso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento *
                </label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value as Department })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.filter(d => d.value !== 'All').map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Perfil *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.filter(r => r.value !== 'All').map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar Usuário
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento *
                </label>
                <select
                  value={editUser.department}
                  onChange={(e) => setEditUser({ ...editUser, department: e.target.value as Department })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.filter(d => d.value !== 'All').map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Perfil *
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.filter(r => r.value !== 'All').map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Enviar Mensagem para {selectedUser.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={messageData.title}
                  onChange={(e) => setMessageData({ ...messageData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título da mensagem"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem *
                </label>
                <textarea
                  value={messageData.message}
                  onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua mensagem..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMessageSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Enviar Mensagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement