'use client'

import React, { useEffect, useState } from 'react'
import { detectBrowser, logBrowserInfo, type BrowserInfo } from '@/lib/browser-detection'

const BrowserInfoComponent: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)

  useEffect(() => {
    const info = detectBrowser()
    setBrowserInfo(info)
    logBrowserInfo()
  }, [])

  if (!browserInfo) return null

  return (
    <div className="adaptive-surface p-3 rounded border adaptive-border text-xs">
      <div className="adaptive-text-primary font-medium mb-2">
        🌐 Detecção de Navegador
      </div>
      
      <div className="space-y-1 adaptive-text-secondary">
        <div><strong>Navegador:</strong> {browserInfo.name} v{browserInfo.version}</div>
        <div><strong>Sistema:</strong> {browserInfo.os}</div>
        <div><strong>Tema:</strong> {browserInfo.prefersDark ? 'Escuro' : 'Claro'}</div>
        
        {browserInfo.hasHighContrast && (
          <div className="adaptive-text-primary">⚡ Alto Contraste Detectado</div>
        )}
        
        {browserInfo.isMobile && (
          <div className="adaptive-text-primary">📱 Dispositivo Móvel</div>
        )}
        
        <div className="adaptive-text-muted">
          Color Scheme: {browserInfo.supportsColorScheme ? '✅' : '❌'} |
          P3 Colors: {browserInfo.supportsP3 ? '✅' : '❌'}
        </div>
      </div>
    </div>
  )
}

export default BrowserInfoComponent