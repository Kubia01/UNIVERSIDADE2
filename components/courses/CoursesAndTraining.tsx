'use client'

import React, { useState } from 'react'
import { Settings, BookOpen, Users } from 'lucide-react'
import { User, Course } from '@/lib/supabase'
import CourseManagement from '@/components/admin/CourseManagement'
import CourseViewer from './CourseViewer'

interface CoursesAndTrainingProps {
  user: User
  onCourseSelect: (course: Course) => void
}

type TabType = 'modules' | 'management'

const CoursesAndTraining: React.FC<CoursesAndTrainingProps> = ({ user, onCourseSelect }) => {
  const [activeTab, setActiveTab] = useState<TabType>('modules')

  const tabs = [
    {
      id: 'modules' as TabType,
      label: 'Módulos de Treinamento',
      icon: BookOpen,
      description: 'Acesse e assista as aulas dos módulos disponíveis',
      available: true
    },
    {
      id: 'management' as TabType,
      label: 'Gerenciar Cursos',
      icon: Settings,
      description: 'Crie, edite e gerencie cursos e aulas',
      available: user?.role === 'admin'
    }
  ]

  const availableTabs = tabs.filter(tab => tab.available)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cursos e Treinamentos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === 'admin' 
            ? 'Gerencie módulos de treinamento e acesse conteúdos educacionais'
            : 'Explore módulos de treinamento e desenvolva suas habilidades'
          }
        </p>
      </div>

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {availableTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    mr-2 h-5 w-5 transition-colors duration-200
                    ${isActive 
                      ? 'text-blue-500 dark:text-blue-400' 
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }
                  `} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'modules' && (
          <div>
            {/* Info Card para Usuários */}
            {user?.role !== 'admin' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Módulos de Treinamento
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Explore os módulos disponíveis e clique em "Assistir Aulas" para acessar o conteúdo educacional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card para Admins */}
            {user?.role === 'admin' && activeTab === 'modules' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900 dark:text-green-200">
                      Visualização do Usuário
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Esta é a visualização que os colaboradores veem. Use a aba "Gerenciar Cursos" para criar e editar módulos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CourseViewer user={user} onCourseSelect={onCourseSelect} />
          </div>
        )}

        {activeTab === 'management' && user?.role === 'admin' && (
          <div>
            {/* Info Card para Gerenciamento */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
                    Gerenciamento de Cursos
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    Crie novos módulos, adicione aulas e gerencie o conteúdo educacional da empresa. 
                    Lembre-se de adicionar pelo menos uma aula antes de salvar um curso.
                  </p>
                </div>
              </div>
            </div>

            <CourseManagement />
          </div>
        )}
      </div>
    </div>
  )
}

export default CoursesAndTraining