import React, { useState } from 'react';
import { Search, Users, BookOpen, UserPlus, UserMinus, Calendar, Check } from 'lucide-react';
import { mockUsers, mockCourses, mockCourseAssignments } from '../../data/mockData';
import { User, Course } from '../../types';

const ContentManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignments, setAssignments] = useState(mockCourseAssignments);

  const filteredUsers = mockUsers.filter(user => 
    user.role !== 'admin' && 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserAssignedCourses = (userId: string) => {
    const userAssignments = assignments.filter(a => a.userId === userId);
    return userAssignments.map(assignment => {
      const course = mockCourses.find(c => c.id === assignment.courseId);
      return { ...assignment, course };
    }).filter(item => item.course);
  };

  const getAvailableCoursesForUser = (userId: string) => {
    const assignedCourseIds = assignments
      .filter(a => a.userId === userId)
      .map(a => a.courseId);
    
    return mockCourses.filter(course => 
      course.isPublished && !assignedCourseIds.includes(course.id)
    );
  };

  const handleAssignCourse = () => {
    if (!selectedUser || !selectedCourse) {
      alert('Por favor, selecione um curso para atribuir.');
      return;
    }
    
    const newAssignment = {
      id: Date.now().toString(),
      userId: selectedUser.id,
      courseId: selectedCourse,
      assignedBy: '1', // Current admin user
      assignedAt: new Date().toISOString(),
      deadline: deadline || undefined
    };

    setAssignments([...assignments, newAssignment]);
    
    setShowAssignModal(false);
    setSelectedCourse('');
    setDeadline('');
    
    alert('Curso atribuído com sucesso!');
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    if (confirm('Tem certeza que deseja remover esta atribuição?')) {
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciar Conteúdo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Atribua cursos aos colaboradores e gerencie acessos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Colaboradores
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar colaboradores..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                  selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.department}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {getUserAssignedCourses(user.id).length} cursos
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Course Assignments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedUser ? `Cursos de ${selectedUser.name}` : 'Selecione um colaborador'}
              </h3>
              {selectedUser && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Atribuir
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {selectedUser ? (
              getUserAssignedCourses(selectedUser.id).length > 0 ? (
                getUserAssignedCourses(selectedUser.id).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {assignment.course?.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {assignment.course?.department} • {assignment.course?.type}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                          <span>
                            Atribuído em {new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}
                          </span>
                          {assignment.deadline && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Prazo: {new Date(assignment.deadline).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remover atribuição"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum curso atribuído
                  </p>
                </div>
              )
            ) : (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Selecione um colaborador para ver seus cursos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Course Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Atribuir Curso para {selectedUser.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Curso *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um curso</option>
                  {getAvailableCoursesForUser(selectedUser.id).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prazo (opcional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignCourse}
                disabled={!selectedCourse}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Check className="h-4 w-4 mr-2" />
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;