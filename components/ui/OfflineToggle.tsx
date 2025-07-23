'use client'

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RotateCcw } from 'lucide-react'
import { getOfflineStatus, enableOfflineMode, disableOfflineMode } from '@/lib/offline-mode'

export const OfflineToggle: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const updateStatus = () => {
      const status = getOfflineStatus()
      setIsOffline(status.isOffline)
      setReason(status.reason)
    }

    updateStatus()
    
    // Verificar periodicamente
    const interval = setInterval(updateStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleOfflineMode = () => {
    if (isOffline) {
      disableOfflineMode()
      setIsOffline(false)
      setReason('')
      // Forçar reload da página para recarregar dados
      window.location.reload()
    } else {
      enableOfflineMode('Ativado manualmente pelo usuário')
      setIsOffline(true)
      setReason('Ativado manualmente pelo usuário')
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isOffline ? (
              <WifiOff className="h-5 w-5 text-red-500" />
            ) : (
              <Wifi className="h-5 w-5 text-green-500" />
            )}
            
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white">
                {isOffline ? 'Modo Offline' : 'Online'}
              </div>
              {reason && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {reason}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={toggleOfflineMode}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isOffline
                ? 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}
            title={isOffline ? 'Voltar ao modo online' : 'Ativar modo offline'}
          >
            {isOffline ? (
              <div className="flex items-center space-x-1">
                <RotateCcw className="h-3 w-3" />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar em outros componentes
export const useOfflineStatus = () => {
  const [status, setStatus] = useState({ isOffline: false, reason: '' })

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getOfflineStatus())
    }

    updateStatus()
    const interval = setInterval(updateStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  return status
}