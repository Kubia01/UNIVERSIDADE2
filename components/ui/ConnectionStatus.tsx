'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Wifi, WifiOff, RefreshCw, X } from 'lucide-react'

interface ConnectionStatusProps {
  isConnected: boolean
  hasError: boolean
  errorMessage?: string
  onRetry?: () => void
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  hasError,
  errorMessage,
  onRetry
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (hasError && !isDismissed) {
      setIsVisible(true)
    } else if (isConnected && !hasError) {
      setIsVisible(false)
      setIsDismissed(false)
    }
  }, [hasError, isConnected, isDismissed])

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  const handleRetry = () => {
    setIsDismissed(false)
    setIsVisible(false)
    if (onRetry) {
      onRetry()
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white shadow-lg animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {hasError ? (
                <WifiOff className="h-5 w-5" />
              ) : (
                <Wifi className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {hasError ? 'Problemas de Conexão Detectados' : 'Verificando Conexão...'}
                </span>
              </div>
              
              {errorMessage && (
                <p className="text-sm text-red-100 mt-1">
                  {errorMessage}
                </p>
              )}
              
              <p className="text-sm text-red-100 mt-1">
                Alguns dados podem estar desatualizados. Verifique sua conexão com a internet.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRetry && (
              <button
                onClick={handleRetry}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tentar Novamente</span>
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-red-600 rounded transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para gerenciar status de conexão
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [hasSupabaseError, setHasSupabaseError] = useState(false)
  const [lastError, setLastError] = useState<string>('')

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    // SISTEMA OFFLINE DESATIVADO - APENAS DETECTAR STATUS ONLINE
    const handleOnline = () => setIsOnline(true)
    // Removido handleOffline - sistema não funciona offline
    
    // Inicializar status
    updateOnlineStatus()
    
    // Listeners apenas para status online
    window.addEventListener('online', handleOnline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      // Removido removeEventListener para offline
    }
  }, [])

  const reportSupabaseError = (error: any) => {
    setHasSupabaseError(true)
    
    let errorMsg = 'Erro de conexão com o servidor'
    
    if (error?.message) {
      if (error.message.includes('Failed to fetch')) {
        errorMsg = 'Falha na conexão. Verifique sua internet.'
      } else if (error.message.includes('timeout')) {
        errorMsg = 'Timeout na conexão. Servidor pode estar sobrecarregado.'
      } else if (error.message.includes('CORS')) {
        errorMsg = 'Erro de configuração do servidor.'
      } else {
        errorMsg = error.message
      }
    }
    
    setLastError(errorMsg)
    
    // Auto-clear após 30 segundos
    setTimeout(() => {
      setHasSupabaseError(false)
      setLastError('')
    }, 30000)
  }

  const clearError = () => {
    setHasSupabaseError(false)
    setLastError('')
  }

  return {
    isOnline,
    hasSupabaseError,
    lastError,
    reportSupabaseError,
    clearError,
    hasAnyError: !isOnline || hasSupabaseError
  }
}