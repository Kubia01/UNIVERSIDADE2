import React from 'react';
import { 
  Home, 
  BookOpen, 
  Users, 
  Award, 
  Settings, 
  X,
  FileText,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'courses', icon: BookOpen, label: 'Cursos e Treinamentos' },
        { id: 'certificates', icon: Award, label: 'Certificados' },
        { id: 'users', icon: Users, label: 'Usuários' },
        { id: 'content', icon: FileText, label: 'Conteúdo' },
        { id: 'settings', icon: Settings, label: 'Configurações' }
      ];
    } else {
      return [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'courses', icon: BookOpen, label: 'Cursos e Treinamentos' },
        { id: 'certificates', icon: Award, label: 'Certificados' },
        { id: 'notifications', icon: UserCog, label: 'Informações' }
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (itemId: string) => {
    onViewChange(itemId);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Universidade Interlub
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user?.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.department} • {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;