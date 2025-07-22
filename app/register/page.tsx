'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { BookOpen, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      // Verificar se é admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (error || !profile || profile.role !== 'admin') {
        setIsAdmin(false)
      } else {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Shield className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Acesso Negado
            </h2>
            <p className="mt-4 text-gray-600">
              Esta página é restrita apenas para administradores.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              O cadastro de novos usuários deve ser feito através do painel administrativo.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Para Administradores:</h3>
                <p className="text-sm text-blue-800">
                  Acesse o painel administrativo através do menu principal e use a seção 
                  "Gerenciar Usuários" para cadastrar novos colaboradores.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Para Colaboradores:</h3>
                <p className="text-sm text-gray-800">
                  Seu acesso deve ser criado por um administrador. Entre em contato com 
                  o departamento de TI ou RH para solicitar seu cadastro.
                </p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Login
              </Link>
              <Link
                href="/"
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Ir para Dashboard
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2024 Universidade Corporativa. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se chegou aqui, é admin - redireciona para o painel de usuários
  router.push('/?view=users')
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando para o painel administrativo...</p>
      </div>
    </div>
  )
}