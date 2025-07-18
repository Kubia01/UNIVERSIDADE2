import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Target,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockCourses, mockProgress, mockCertificates, mockUsers } from '../../data/mockData';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = React.useState<string>('all');

  // Get filtered data based on selected user (admin view) or current user (student view)
  const getFilteredData = () => {
    if (user?.role === 'admin') {
      if (selectedUserId === 'all') {
        return {
          progress: mockProgress,
          certificates: mockCertificates
        };
      } else {
        return {
          progress: mockProgress.filter(p => p.userId === selectedUserId),
          certificates: mockCertificates.filter(c => c.userId === selectedUserId)
        };
      }
    } else {
      return {
        progress: mockProgress.filter(p => p.userId === user?.id),
        certificates: mockCertificates.filter(c => c.userId === user?.id)
      };
    }
  };

  const { progress: userProgress, certificates: userCertificates } = getFilteredData();
  const availableCourses = mockCourses.filter(c => c.isPublished);
  
  const completedCourses = userProgress.filter(p => p.progress === 100).length;
  const inProgressCourses = userProgress.filter(p => p.progress > 0 && p.progress < 100).length;
  const totalHours = userProgress.reduce((acc, p) => {
    const course = mockCourses.find(c => c.id === p.courseId);
    return acc + (course ? course.duration : 0);
  }, 0);

  // Get selected user info for display
  const selectedUser = selectedUserId === 'all' ? null : mockUsers.find(u => u.id === selectedUserId);
  const displayName = user?.role === 'admin' 
    ? (selectedUserId === 'all' ? 'Todos os Colaboradores' : selectedUser?.name || 'Usuário')
    : user?.name;

  // Data for charts
  const progressData = [
    { name: 'Concluídos', value: completedCourses, color: '#10b981' },
    { name: 'Em andamento', value: inProgressCourses, color: '#f59e0b' },
    { name: 'Não iniciados', value: availableCourses.length - userProgress.length, color: '#e5e7eb' }
  ];

  const weeklyProgress = [
    { day: 'Seg', hours: 2 },
    { day: 'Ter', hours: 1.5 },
    { day: 'Qua', hours: 3 },
    { day: 'Qui', hours: 2.5 },
    { day: 'Sex', hours: 4 },
    { day: 'Sáb', hours: 1 },
    { day: 'Dom', hours: 0.5 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Admin User Filter */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrar por colaborador:
              </label>
            </div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os colaboradores</option>
              {mockUsers.filter(u => u.role !== 'admin').map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.department}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {user?.role === 'admin' ? 'Dashboard Administrativo' : `Bem-vindo, ${user?.name}! 👋`}
            </h1>
            <p className="text-blue-100">
              {user?.role === 'admin' 
                ? `Visualizando dados de: ${displayName}`
                : 'Continue sua jornada de aprendizado. Você está indo muito bem!'
              }
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              {user?.role === 'admin' ? (
                <Users className="h-8 w-8" />
              ) : (
                <BookOpen className="h-8 w-8" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cursos Concluídos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedCourses}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Em Andamento
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inProgressCourses}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Horas Estudadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(totalHours / 60)}h
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Certificados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userCertificates.length}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progresso dos Cursos
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {progressData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividade Semanal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;