import React, { useState } from 'react';
import { Save, Key, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'password' | 'admin-users'>('password');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    department: 'HR'
  });
  const [admins, setAdmins] = useState([
    { id: '1', name: 'Maria Silva', email: 'maria.silva@interlub.com', department: 'HR' }
  ]);

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    alert('Senha alterada com sucesso!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleCreateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const admin = {
      id: Date.now().toString(),
      name: newAdmin.name,
      email: newAdmin.email,
      department: newAdmin.department
    };

    setAdmins([...admins, admin]);
    alert(`Administrador criado com sucesso!\nLogin: ${newAdmin.email}\nSenha: ${newAdmin.password}`);
    
    setNewAdmin({
      name: '',
      email: '',
      password: '',
      department: 'HR'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie configurações do sistema e segurança
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'password', label: 'Alterar Senha', icon: Key },
            { id: 'admin-users', label: 'Administradores', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'password' && (
        <div className="max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Alterar Senha
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha Atual *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Alterar Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin-users' && (
        <div className="space-y-6">
          {/* Create Admin */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Criar Novo Administrador
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@interlub.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Senha de acesso"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleCreateAdmin}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Admin
                </button>
              </div>
            </div>
          </div>

          {/* Current Admins */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Administradores Atuais
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {admin.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {admin.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {admin.email}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full text-xs font-medium">
                    {admin.id === '1' ? 'Administrador Principal' : 'Administrador'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;