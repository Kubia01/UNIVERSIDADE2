'use client'

import React from 'react'
import { useAdaptiveColorsContext } from '@/components/providers/AdaptiveColorsProvider'

const AdaptiveColorDemo: React.FC = () => {
  const { colorScheme, isDark, isHighContrast, refreshScheme } = useAdaptiveColorsContext()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="adaptive-surface p-4 rounded-lg shadow-lg adaptive-border border">
        <div className="mb-3">
          <h4 className="font-semibold adaptive-text-primary text-sm mb-2">
            🎨 Sistema Adaptativo
          </h4>
          
          <div className="text-xs space-y-1">
            <div className="adaptive-text-muted">
              <strong>Modo:</strong> {isDark ? 'Escuro' : 'Claro'}
            </div>
            {isHighContrast && (
              <div className="adaptive-text-secondary">
                ⚡ Alto Contraste Ativo
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs adaptive-text-muted mb-2">Teste de Cores:</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="adaptive-primary p-2 rounded text-center">
              Primary
            </div>
            <div className="adaptive-success p-2 rounded text-center">
              Success
            </div>
            <div className="adaptive-warning p-2 rounded text-center">
              Warning
            </div>
            <div className="adaptive-error p-2 rounded text-center">
              Error
            </div>
          </div>
        </div>

        <div className="mb-3">
          <input 
            type="text" 
            placeholder="Teste de input..."
            className="adaptive-input w-full text-xs p-2 rounded border"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs adaptive-text-muted">
            Cores ativas
          </div>
          <button 
            onClick={refreshScheme}
            className="text-xs adaptive-primary p-1 rounded hover:opacity-80"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdaptiveColorDemo