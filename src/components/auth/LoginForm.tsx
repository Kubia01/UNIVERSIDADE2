import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Email ou senha inválidos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Universidade Interlub
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Acesse sua conta para continuar aprendendo
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email corporativo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="seu.email@interlub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="relative block w-full px-3 py-3 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              Esqueceu sua senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium transition-colors"
              >
                Solicitar acesso
              </button>
            </p>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">
            Credenciais para demonstração:
          </p>
          <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <p><strong>Admin:</strong> maria.silva@interlub.com</p>
            <p><strong>Colaborador:</strong> ana.costa@interlub.com</p>
            <p><strong>Senha:</strong> password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;