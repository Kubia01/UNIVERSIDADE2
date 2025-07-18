import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  Award, 
  CheckCircle, 
  FileText,
  Video,
  HelpCircle,
  Star
} from 'lucide-react';
import { Course, Lesson } from '../../types';
import { mockProgress } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onStartLesson: (lesson: Lesson) => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack, onStartLesson }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'reviews'>('overview');

  const progress = mockProgress.find(p => p.userId === user?.id && p.courseId === course.id);
  const progressPercentage = progress?.progress || 0;
  const completedLessons = progress?.completedLessons || [];

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'quiz':
        return HelpCircle;
      default:
        return Play;
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      HR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Operations: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Sales: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      Engineering: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      Finance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      Marketing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

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
            {course.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {course.instructor} • {course.department}
          </p>
        </div>
      </div>

      {/* Course banner */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="p-6 text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDepartmentColor(course.department)}`}>
                {course.department}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                {course.type}
              </span>
              {course.isMandatory && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500">
                  Obrigatório
                </span>
              )}
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {Math.round(course.duration / 60)}h {course.duration % 60}min
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {course.lessons.length} aulas
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1" />
                Certificado incluído
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progressPercentage > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Seu progresso
            </span>
            <span className="text-sm font-medium text-blue-600">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'lessons', label: 'Aulas' },
            { id: 'reviews', label: 'Avaliações' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Sobre o curso
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Informações do curso
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Instrutor:</span>
                  <span className="text-gray-900 dark:text-white">{course.instructor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duração:</span>
                  <span className="text-gray-900 dark:text-white">
                    {Math.round(course.duration / 60)}h {course.duration % 60}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Aulas:</span>
                  <span className="text-gray-900 dark:text-white">{course.lessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nível:</span>
                  <span className="text-gray-900 dark:text-white">Iniciante</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                O que você vai aprender
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Conceitos fundamentais sobre o tema
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Aplicação prática dos conhecimentos
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Melhores práticas da área
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Casos reais e exemplos práticos
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {course.deadline && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-2" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-300">
                    Prazo de conclusão
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Este curso deve ser concluído até {new Date(course.deadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-4">
          {course.lessons.map((lesson, index) => {
            const Icon = getLessonIcon(lesson.type);
            const isCompleted = isLessonCompleted(lesson.id);

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {index + 1}. {lesson.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {lesson.duration && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {lesson.duration}min
                        </span>
                      )}
                      <button
                        onClick={() => onStartLesson(lesson)}
                        className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {isCompleted ? 'Revisar' : 'Iniciar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Avaliações dos alunos
              </h3>
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  4.8 (127 avaliações)
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">JS</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        João Silva
                      </span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Curso excelente! Muito bem estruturado e com conteúdo relevante. 
                      O instrutor explica muito bem os conceitos.
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      há 2 dias
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">MC</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Maria Costa
                      </span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                        <Star className="h-3 w-3 text-gray-300" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ótimo curso para quem está começando. Os exercícios práticos 
                      ajudam muito na fixação do conteúdo.
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      há 1 semana
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">PF</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Pedro Ferreira
                      </span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Conteúdo muito atualizado e aplicável no dia a dia. 
                      Recomendo para todos da equipe.
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      há 2 semanas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => course.lessons.length > 0 && onStartLesson(course.lessons[0])}
          className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Play className="h-5 w-5 mr-2" />
          {progressPercentage > 0 ? 'Continuar Curso' : 'Iniciar Curso'}
        </button>
      </div>
    </div>
  );
};

export default CourseDetail;