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
    
    // Inicializar compatibilidade (silenciosamente)
    const result = initBrowserCompatibility()
    
    if (result) {
      setBrowserInfo(result.browser)
      setAdjustments(result.adjustments)
      
      // LOGS REMOVIDOS - FUNCIONAMENTO SILENCIOSO
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

  // COMPONENTE DE DEBUG REMOVIDO - NÃO EXPOR INFORMAÇÕES DO NAVEGADOR
  return (
    <>
      {children}
      
      {/* Indicador de carregamento dos ajustes */}
      {!isInitialized && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50" />
      )}
    </>
  )
}

export default BrowserCompatibility