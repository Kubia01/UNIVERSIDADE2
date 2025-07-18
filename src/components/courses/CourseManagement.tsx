import React, { useState } from 'react';
import { Search, Filter, Clock, Users, Play, Plus, Edit, Trash2, Eye, UserPlus, ArrowLeft } from 'lucide-react';
import { mockCourses, mockProgress } from '../../data/mockData';
import { Course, Department, CourseType, Lesson } from '../../types';
import CourseCreation from './CourseCreation';
import CourseDetail from './CourseDetail';
import { useAuth } from '../../contexts/AuthContext';

interface CourseManagementProps {
  onCourseSelect: (course: Course) => void;
  onStartLesson: (lesson: Lesson) => void;
  selectedCourse: Course | null;
  onBack: () => void;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ 
  onCourseSelect, 
  onStartLesson, 
  selectedCourse, 
  onBack 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All');
  const [selectedType, setSelectedType] = useState<CourseType | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showCourseCreation, setShowCourseCreation] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState(mockCourses);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'detail'>('list');

  const departments: { value: Department | 'All'; label: string }[] = [
    { value: 'All', label: 'Todos os Departamentos' },
    { value: 'HR', label: 'Recursos Humanos' },
    { value: 'Operations', label: 'Operações' },
    { value: 'Sales', label: 'Vendas' },
    { value: 'Engineering', label: 'Engenharia' },
    { value: 'Finance', label: 'Financeiro' },
    { value: 'Marketing', label: 'Marketing' }
  ];

  const courseTypes: { value: CourseType | 'All'; label: string }[] = [
    { value: 'All', label: 'Todos os Tipos' },
    { value: 'onboarding', label: 'Integração' },
    { value: 'training', label: 'Treinamento' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'skills', label: 'Habilidades' },
    { value: 'leadership', label: 'Liderança' }
  ];

  // Get courses based on user role and enrollment
  const getAvailableCourses = () => {
    if (user?.role === 'admin') {
      // Admin sees all published courses
      return courses.filter(course => course.isPublished);
    } else {
      // Students only see courses they're enrolled in (have progress or are enrolled)
      const userProgressCourseIds = mockProgress
        .filter(p => p.userId === user?.id)
        .map(p => p.courseId);
      
      const enrolledCourseIds = [...userProgressCourseIds, ...enrollments];
      
      return courses.filter(course => 
        course.isPublished && enrolledCourseIds.includes(course.id)
      );
    }
  };

  // Filter courses
  const filteredCourses = getAvailableCourses().filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || course.department === selectedDepartment;
    const matchesType = selectedType === 'All' || course.type === selectedType;

    return matchesSearch && matchesDepartment && matchesType;
  });

  // Get user progress for each course
  const getUserProgress = (courseId: string) => {
    return mockProgress.find(p => p.userId === user?.id && p.courseId === courseId);
  };

  const handleEnrollment = (courseId: string) => {
    setEnrollments([...enrollments, courseId]);
    alert('Matrícula realizada com sucesso!');
  };

  const isEnrolled = (courseId: string) => {
    const hasProgress = mockProgress.some(p => p.userId === user?.id && p.courseId === courseId);
    return hasProgress || enrollments.includes(courseId);
  };

  const handleCourseClick = (course: Course) => {
    onCourseSelect(course);
    setView('detail');
  };

  const handleEdit = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse(course);
    setShowCourseCreation(true);
  };

  const handleDelete = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      setCourses(courses.filter(c => c.id !== courseId));
    }
  };

  const handleSaveCourse = (courseData: any) => {
    if (editingCourse) {
      // Update existing course
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...courseData, id: editingCourse.id } : c));
      alert('Curso atualizado com sucesso!');
    } else {
      // Create new course
      setCourses([...courses, courseData]);
      alert('Curso criado com sucesso!');
    }
    setShowCourseCreation(false);
    setEditingCourse(null);
  };

  const handleCreateNew = () => {
    setEditingCourse(null);
    setShowCourseCreation(true);
  };

  const getDepartmentColor = (department: Department) => {
    const colors = {
      HR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Operations: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Sales: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      Engineering: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      Finance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      Marketing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colors[department];
  };

  const getTypeColor = (type: CourseType) => {
    const colors = {
      onboarding: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      training: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      compliance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      skills: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      leadership: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[type];
  };

  if (showCourseCreation) {
    return (
      <CourseCreation
        course={editingCourse}
        onBack={() => {
          setShowCourseCreation(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
      />
    );
  }

  if (view === 'detail' && selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        onBack={() => {
          setView('list');
          onBack();
        }}
        onStartLesson={onStartLesson}
      />
    );
  }

  if (user?.role !== 'admin' && filteredCourses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Play className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum curso matriculado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Matricule-se em cursos disponíveis para começar a aprender.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cursos e Treinamentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === 'admin' 
              ? 'Gerencie todos os cursos da plataforma'
              : 'Seus cursos e catálogo disponível'
            }
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={handleCreateNew}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </button>
        )}
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departamento
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as Department | 'All')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {departments.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as CourseType | 'All')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {courseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const progress = getUserProgress(course.id);
          const progressPercentage = progress?.progress || 0;
          const enrolled = isEnrolled(course.id);

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(course.department)}`}>
                    {course.department}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(course.type)}`}>
                    {course.type}
                  </span>
                  {course.isMandatory && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      Obrigatório
                    </span>
                  )}
                  {!course.isPublished && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                      Rascunho
                    </span>
                  )}
                </div>
                {progressPercentage > 0 && (
                  <div className="absolute bottom-3 right-3 bg-white dark:bg-gray-800 rounded-full p-2">
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-gray-200 dark:text-gray-600"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${progressPercentage * 0.88} 88`}
                          className="text-blue-600"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {progressPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.round(course.duration / 60)}h {course.duration % 60}min
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.instructor}
                  </div>
                </div>

                {course.deadline && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                    Prazo: {new Date(course.deadline).toLocaleDateString('pt-BR')}
                  </div>
                )}

                {progressPercentage > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progresso</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {user?.role === 'admin' ? (
                    <>
                      <button
                        onClick={() => handleCourseClick(course)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </button>
                      <button
                        onClick={(e) => handleEdit(e, course)}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, course.id)}
                        className="flex items-center justify-center px-3 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : enrolled ? (
                    <button 
                      onClick={() => handleCourseClick(course)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {progressPercentage > 0 ? 'Continuar' : 'Iniciar Curso'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEnrollment(course.id)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Matricular-se
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && user?.role === 'admin' && (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum curso encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;