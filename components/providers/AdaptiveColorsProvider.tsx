'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAdaptiveColors } from '@/components/hooks/useAdaptiveColors'
import type { BrowserInfo, ColorScheme } from '@/lib/browser-detection'

interface AdaptiveColorsContextType {
  browserInfo: BrowserInfo
  colorScheme: ColorScheme
  isLoading: boolean
  isDark: boolean
  isHighContrast: boolean
  refreshScheme: () => void
}

const AdaptiveColorsContext = createContext<AdaptiveColorsContextType | undefined>(undefined)

interface AdaptiveColorsProviderProps {
  children: ReactNode
}

export default function AdaptiveColorsProvider({ children }: AdaptiveColorsProviderProps) {
  const adaptiveColors = useAdaptiveColors()

  return (
    <AdaptiveColorsContext.Provider value={adaptiveColors}>
      {children}
    </AdaptiveColorsContext.Provider>
  )
}

// Hook para usar o contexto
export const useAdaptiveColorsContext = (): AdaptiveColorsContextType => {
  const context = useContext(AdaptiveColorsContext)
  if (context === undefined) {
    throw new Error('useAdaptiveColorsContext deve ser usado dentro de AdaptiveColorsProvider')
  }
  return context
}