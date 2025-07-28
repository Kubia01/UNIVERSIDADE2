'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  detectBrowser, 
  getAdaptiveColorScheme, 
  applyColorScheme, 
  watchColorSchemeChanges, 
  logBrowserInfo,
  type BrowserInfo,
  type ColorScheme 
} from '@/lib/browser-detection'

interface UseAdaptiveColorsReturn {
  browserInfo: BrowserInfo
  colorScheme: ColorScheme
  isLoading: boolean
  isDark: boolean
  isHighContrast: boolean
  refreshScheme: () => void
}

export const useAdaptiveColors = (): UseAdaptiveColorsReturn => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    name: 'Unknown',
    version: 'Unknown',
    os: 'Unknown',
    isMobile: false,
    supportsColorScheme: false,
    prefersDark: false,
    hasHighContrast: false,
    supportsP3: false
  })
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>({
    background: 'rgb(255, 255, 255)',
    surface: 'rgb(249, 250, 251)',
    text: {
      primary: 'rgb(31, 41, 55)',
      secondary: 'rgb(75, 85, 99)',
      muted: 'rgb(107, 114, 128)',
      inverse: 'rgb(255, 255, 255)'
    },
    border: {
      light: 'rgb(243, 244, 246)',
      medium: 'rgb(229, 231, 235)',
      heavy: 'rgb(209, 213, 219)'
    },
    accent: {
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(251, 146, 60)',
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(245, 158, 11)',
      error: 'rgb(239, 68, 68)'
    },
    input: {
      background: 'rgb(255, 255, 255)',
      border: 'rgb(229, 231, 235)',
      text: 'rgb(31, 41, 55)',
      placeholder: 'rgb(107, 114, 128)',
      focus: 'rgb(59, 130, 246)'
    }
  })
  
  const [isLoading, setIsLoading] = useState(true)

  const updateColorScheme = useCallback((newScheme: ColorScheme) => {
    // SILENCIOSO - SEM LOGS
    setColorScheme(newScheme)
    applyColorScheme(newScheme)
  }, [])

  const refreshScheme = useCallback(() => {
    const info = detectBrowser()
    const scheme = getAdaptiveColorScheme(info)
    setBrowserInfo(info)
    updateColorScheme(scheme)
    
    // LOGS REMOVIDOS - FUNCIONAMENTO SILENCIOSO
  }, [updateColorScheme])

  // Inicialização
  useEffect(() => {
    let mounted = true
    
    const initializeColors = () => {
      try {
        // Detectar informações do navegador (silenciosamente)
        const info = detectBrowser()
        
        // Gerar esquema de cores adaptativo
        const scheme = getAdaptiveColorScheme(info)
        
        if (mounted) {
          setBrowserInfo(info)
          updateColorScheme(scheme)
          setIsLoading(false)
          
          // LOGS REMOVIDOS - FUNCIONAMENTO SILENCIOSO
        }
      } catch (error) {
        // Log mínimo apenas para erros críticos (sem expor dados do navegador)
        console.error('❌ [AdaptiveColors] Erro ao inicializar cores')
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Aguardar um pouco para garantir que o DOM está pronto
    const timeoutId = setTimeout(initializeColors, 100)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [updateColorScheme])

  // Monitorar mudanças nas preferências do sistema
  useEffect(() => {
    const cleanup = watchColorSchemeChanges(updateColorScheme)
    return cleanup
  }, [updateColorScheme])

  // Aplicar classe CSS no body baseada nas informações do navegador
  useEffect(() => {
    if (typeof document === 'undefined' || isLoading) return

    const body = document.body
    
    // Remover classes anteriores
    body.classList.remove(
      'browser-chrome', 'browser-firefox', 'browser-safari', 'browser-edge', 'browser-opera',
      'os-windows', 'os-macos', 'os-linux', 'os-android', 'os-ios',
      'adaptive-dark', 'adaptive-light', 'adaptive-high-contrast', 'adaptive-mobile'
    )

    // Adicionar classes baseadas no navegador e sistema (sem logs)
    body.classList.add(`browser-${browserInfo.name.toLowerCase()}`)
    body.classList.add(`os-${browserInfo.os.toLowerCase().replace('macos', 'macos')}`)
    
    if (browserInfo.prefersDark) {
      body.classList.add('adaptive-dark')
    } else {
      body.classList.add('adaptive-light')
    }
    
    if (browserInfo.hasHighContrast) {
      body.classList.add('adaptive-high-contrast')
    }
    
    if (browserInfo.isMobile) {
      body.classList.add('adaptive-mobile')
    }

    // Adicionar atributo para CSS personalizados (sem logs)
    body.setAttribute('data-browser', browserInfo.name.toLowerCase())
    body.setAttribute('data-os', browserInfo.os.toLowerCase())
    body.setAttribute('data-theme', browserInfo.prefersDark ? 'dark' : 'light')
    
  }, [browserInfo, isLoading])

  return {
    browserInfo,
    colorScheme,
    isLoading,
    isDark: browserInfo.prefersDark,
    isHighContrast: browserInfo.hasHighContrast,
    refreshScheme
  }
}

// Hook simplificado para obter apenas as cores atuais
export const useCurrentColors = (): ColorScheme => {
  const { colorScheme } = useAdaptiveColors()
  return colorScheme
}

// Hook para detectar mudanças específicas no tema
export const useThemeChanges = (callback: (isDark: boolean) => void) => {
  const { isDark } = useAdaptiveColors()
  
  useEffect(() => {
    callback(isDark)
  }, [isDark, callback])
}

// Hook para obter informações do navegador
export const useBrowserInfo = (): BrowserInfo => {
  const { browserInfo } = useAdaptiveColors()
  return browserInfo
}