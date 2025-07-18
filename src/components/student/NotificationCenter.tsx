import React from 'react';
import { Info, Shield, Megaphone, Calendar } from 'lucide-react';
import { mockAdminNotifications } from '../../data/mockData';

const NotificationCenter: React.FC = () => {
  const activeNotifications = mockAdminNotifications.filter(n => n.isActive);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return Info;
      case 'policy':
        return Shield;
      case 'announcement':
        return Megaphone;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'policy':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'announcement':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'text-blue-600 dark:text-blue-400';
      case 'policy':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'announcement':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Informações Importantes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comunicados e informações da administração
        </p>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        {activeNotifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          
          return (
            <div
              key={notification.id}
              className={`rounded-xl border p-6 ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full bg-white dark:bg-gray-800 ${getIconColor(notification.type)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {notification.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {notification.message}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    Atualizado em {new Date(notification.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeNotifications.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma informação disponível
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Não há comunicados ativos no momento
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;