'use client'

/**
 * Componente de notificação para modo offline
 */

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { isOfflineMode, disableOfflineMode, shouldRetryConnection } from '@/lib/fallback-data'

export default function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Verificar modo offline na inicialização
    setIsOffline(isOfflineMode())

    // Verificar periodicamente o status de conexão
    const checkConnection = () => {
      setIsOffline(isOfflineMode())
    }

    const interval = setInterval(checkConnection, 10000) // Verificar a cada 10 segundos

    // Escutar eventos de conexão/desconexão
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada')
      disableOfflineMode()
      setIsOffline(false)
    }

    const handleOffline = () => {
      console.log('🔌 Conexão perdida')
      setIsOffline(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleRetryConnection = async () => {
    setIsRetrying(true)
    
    try {
      // Desativar modo offline temporariamente para tentar reconectar
      disableOfflineMode()
      setIsOffline(false)
      
      // Recarregar a página para forçar nova tentativa de conexão
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Erro ao tentar reconectar:', error)
    } finally {
      setTimeout(() => {
        setIsRetrying(false)
      }, 2000)
    }
  }

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <WifiOff className="h-5 w-5" />
          <div>
            <p className="font-medium text-sm">
              Modo Offline Ativo
            </p>
            <p className="text-xs opacity-90">
              Conectividade limitada. Mostrando dados salvos localmente.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {shouldRetryConnection() && (
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Reconectando...</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Tentar Reconectar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}