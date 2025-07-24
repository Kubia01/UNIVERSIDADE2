'use client'

import React from 'react'
import { Menu, LogOut, BookOpen } from 'lucide-react'
import { User } from '@/lib/supabase'

interface HeaderProps {
  onMenuClick: () => void
  user: User | null
  onLogout: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user, onLogout }) => {
  return (
    <header className="adaptive-surface border-b adaptive-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button and logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold adaptive-text-primary">
                Universidade Corporativa
              </h1>
            </div>
          </div>
        </div>

        {/* Right side - User info and logout */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium adaptive-text-primary">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs adaptive-text-muted">
              {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>
          
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          
          <button
            onClick={onLogout}
            className="p-2 adaptive-text-muted hover:adaptive-text-secondary adaptive-hover rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header