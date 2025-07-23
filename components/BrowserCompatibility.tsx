'use client'

import { useEffect, useState } from 'react'
import { initBrowserCompatibility, BrowserInfo, ThemeAdjustments } from '@/lib/browser-compatibility'

interface BrowserCompatibilityProps {
  children?: React.ReactNode
}

const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({ children }) => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [adjustments, setAdjustments] = useState<ThemeAdjustments | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Adicionar classe temporária para desabilitar transições
    document.body.classList.add('browser-adjusting')
    
    // Inicializar compatibilidade
    const result = initBrowserCompatibility()
    
    if (result) {
      setBrowserInfo(result.browser)
      setAdjustments(result.adjustments)
      
      // Log para debug
      console.log('🌐 Navegador detectado:', result.browser.name, result.browser.version)
      console.log('📱 Mobile:', result.browser.isMobile)
      console.log('🖥️ High DPI:', result.browser.isHighDPI)
      console.log('🎨 Ajustes aplicados:', result.adjustments)
    }
    
    // Remover classe após ajustes aplicados
    setTimeout(() => {
      document.body.classList.remove('browser-adjusting')
      setIsInitialized(true)
    }, 150)
    
    // Aplicar novamente quando a página estiver totalmente carregada
    const handleLoad = () => {
      if (result) {
        const { applyBrowserAdjustments } = require('@/lib/browser-compatibility')
        applyBrowserAdjustments(result.browser, result.adjustments)
      }
    }
    
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  // Componente de debug (apenas em desenvolvimento)
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development' || !browserInfo || !adjustments) {
      return null
    }

    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs">
        <div className="font-bold mb-1">🌐 Compatibilidade</div>
        <div>Navegador: {browserInfo.name} v{browserInfo.version}</div>
        <div>Mobile: {browserInfo.isMobile ? 'Sim' : 'Não'}</div>
        <div>High DPI: {browserInfo.isHighDPI ? 'Sim' : 'Não'}</div>
        <div>Font Weight: {adjustments.fontWeight.normal}</div>
        {adjustments.textShadow !== 'none' && (
          <div>Text Shadow: Ativo</div>
        )}
        <div className="mt-1 text-gray-300">
          Press Ctrl+Shift+B para alternar
        </div>
      </div>
    )
  }

  // Listener para tecla de debug
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        const debugElement = document.querySelector('.debug-browser-info')
        if (debugElement) {
          debugElement.classList.toggle('hidden')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {children}
      <div className="debug-browser-info hidden">
        <DebugInfo />
      </div>
      
      {/* Indicador de carregamento dos ajustes */}
      {!isInitialized && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50" />
      )}
    </>
  )
}

export default BrowserCompatibility