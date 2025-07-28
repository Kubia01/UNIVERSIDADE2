/**
 * Sistema de Detecção de Navegador e Adaptação de Cores - SILENCIOSO
 * Detecta o navegador, sistema operacional e preferências do usuário
 * para adaptar cores e textos automaticamente (SEM LOGS VISÍVEIS)
 */

export interface BrowserInfo {
  name: string
  version: string
  os: string
  isMobile: boolean
  supportsColorScheme: boolean
  prefersDark: boolean
  hasHighContrast: boolean
  supportsP3: boolean
}

export interface ColorScheme {
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    muted: string
    inverse: string
  }
  border: {
    light: string
    medium: string
    heavy: string
  }
  accent: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
  }
  input: {
    background: string
    border: string
    text: string
    placeholder: string
    focus: string
  }
}

// Detectar navegador - SEM EXPOSIÇÃO DE DADOS SENSÍVEIS
export const detectBrowser = (): BrowserInfo => {
  if (typeof window === 'undefined') {
    return {
      name: 'Unknown',
      version: 'Unknown',
      os: 'Unknown',
      isMobile: false,
      supportsColorScheme: false,
      prefersDark: false,
      hasHighContrast: false,
      supportsP3: false
    }
  }

  // DETECÇÃO SILENCIOSA - SEM LOGS
  const userAgent = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'
  let osName = 'Unknown'

  // Detectar navegador (silenciosamente)
  if (userAgent.includes('Firefox')) {
    browserName = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browserName = 'Opera'
    const match = userAgent.match(/(Opera|OPR)\/(\d+)/)
    browserVersion = match ? match[2] : 'Unknown'
  }

  // Detectar sistema operacional (silenciosamente)
  if (userAgent.includes('Windows')) {
    osName = 'Windows'
  } else if (userAgent.includes('Mac')) {
    osName = 'macOS'
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux'
  } else if (userAgent.includes('Android')) {
    osName = 'Android'
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    osName = 'iOS'
  }

  // Detectar mobile (silenciosamente)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  // Detectar suporte a color-scheme
  const supportsColorScheme = CSS.supports('color-scheme', 'light dark')

  // Detectar preferência por modo escuro
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // Detectar alto contraste
  const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches

  // Detectar suporte a P3 (cores mais amplas)
  const supportsP3 = CSS.supports('color', 'color(display-p3 1 0 0)')

  return {
    name: browserName,
    version: browserVersion,
    os: osName,
    isMobile,
    supportsColorScheme,
    prefersDark,
    hasHighContrast,
    supportsP3
  }
}

// Gerar esquema de cores adaptativo
export const getAdaptiveColorScheme = (browserInfo: BrowserInfo): ColorScheme => {
  const { name: browser, prefersDark, hasHighContrast, os } = browserInfo

  // Esquemas base por navegador e sistema
  let baseScheme: ColorScheme

  if (prefersDark) {
    // Modo escuro - ajustar por navegador
    if (browser === 'Firefox') {
      // Firefox tem renderização de texto mais suave no escuro
      baseScheme = {
        background: 'rgb(23, 23, 23)',
        surface: 'rgb(32, 32, 32)',
        text: {
          primary: 'rgb(250, 250, 250)',
          secondary: 'rgb(212, 212, 212)',
          muted: 'rgb(160, 160, 160)',
          inverse: 'rgb(23, 23, 23)'
        },
        border: {
          light: 'rgb(64, 64, 64)',
          medium: 'rgb(96, 96, 96)',
          heavy: 'rgb(128, 128, 128)'
        },
        accent: {
          primary: 'rgb(99, 149, 255)',
          secondary: 'rgb(255, 149, 99)',
          success: 'rgb(99, 255, 149)',
          warning: 'rgb(255, 199, 99)',
          error: 'rgb(255, 99, 99)'
        },
        input: {
          background: 'rgb(45, 45, 45)',
          border: 'rgb(96, 96, 96)',
          text: 'rgb(250, 250, 250)',
          placeholder: 'rgb(160, 160, 160)',
          focus: 'rgb(99, 149, 255)'
        }
      }
    } else if (browser === 'Safari') {
      // Safari no macOS tem melhor contraste com tons mais quentes
      baseScheme = {
        background: 'rgb(28, 28, 30)',
        surface: 'rgb(44, 44, 46)',
        text: {
          primary: 'rgb(255, 255, 255)',
          secondary: 'rgb(220, 220, 222)',
          muted: 'rgb(174, 174, 178)',
          inverse: 'rgb(28, 28, 30)'
        },
        border: {
          light: 'rgb(72, 72, 74)',
          medium: 'rgb(99, 99, 102)',
          heavy: 'rgb(142, 142, 147)'
        },
        accent: {
          primary: 'rgb(10, 132, 255)',
          secondary: 'rgb(255, 159, 10)',
          success: 'rgb(48, 209, 88)',
          warning: 'rgb(255, 214, 10)',
          error: 'rgb(255, 69, 58)'
        },
        input: {
          background: 'rgb(58, 58, 60)',
          border: 'rgb(99, 99, 102)',
          text: 'rgb(255, 255, 255)',
          placeholder: 'rgb(174, 174, 178)',
          focus: 'rgb(10, 132, 255)'
        }
      }
    } else {
      // Chrome, Edge, Opera - esquema padrão escuro
      baseScheme = {
        background: 'rgb(18, 18, 18)',
        surface: 'rgb(30, 30, 30)',
        text: {
          primary: 'rgb(248, 249, 250)',
          secondary: 'rgb(210, 214, 220)',
          muted: 'rgb(156, 163, 175)',
          inverse: 'rgb(18, 18, 18)'
        },
        border: {
          light: 'rgb(55, 65, 81)',
          medium: 'rgb(75, 85, 99)',
          heavy: 'rgb(107, 114, 128)'
        },
        accent: {
          primary: 'rgb(59, 130, 246)',
          secondary: 'rgb(251, 146, 60)',
          success: 'rgb(34, 197, 94)',
          warning: 'rgb(245, 158, 11)',
          error: 'rgb(239, 68, 68)'
        },
        input: {
          background: 'rgb(42, 42, 42)',
          border: 'rgb(75, 85, 99)',
          text: 'rgb(248, 249, 250)',
          placeholder: 'rgb(156, 163, 175)',
          focus: 'rgb(59, 130, 246)'
        }
      }
    }
  } else {
    // Modo claro - ajustar por navegador
    if (browser === 'Firefox') {
      // Firefox renderiza bem com tons mais suaves
      baseScheme = {
        background: 'rgb(252, 252, 252)',
        surface: 'rgb(255, 255, 255)',
        text: {
          primary: 'rgb(17, 24, 39)',
          secondary: 'rgb(55, 65, 81)',
          muted: 'rgb(107, 114, 128)',
          inverse: 'rgb(255, 255, 255)'
        },
        border: {
          light: 'rgb(229, 231, 235)',
          medium: 'rgb(209, 213, 219)',
          heavy: 'rgb(156, 163, 175)'
        },
        accent: {
          primary: 'rgb(37, 99, 235)',
          secondary: 'rgb(234, 88, 12)',
          success: 'rgb(22, 163, 74)',
          warning: 'rgb(217, 119, 6)',
          error: 'rgb(220, 38, 38)'
        },
        input: {
          background: 'rgb(255, 255, 255)',
          border: 'rgb(209, 213, 219)',
          text: 'rgb(17, 24, 39)',
          placeholder: 'rgb(107, 114, 128)',
          focus: 'rgb(37, 99, 235)'
        }
      }
    } else if (browser === 'Safari') {
      // Safari com tons do sistema Apple
      baseScheme = {
        background: 'rgb(255, 255, 255)',
        surface: 'rgb(250, 250, 250)',
        text: {
          primary: 'rgb(0, 0, 0)',
          secondary: 'rgb(60, 60, 67)',
          muted: 'rgb(142, 142, 147)',
          inverse: 'rgb(255, 255, 255)'
        },
        border: {
          light: 'rgb(242, 242, 247)',
          medium: 'rgb(210, 210, 215)',
          heavy: 'rgb(174, 174, 178)'
        },
        accent: {
          primary: 'rgb(0, 122, 255)',
          secondary: 'rgb(255, 149, 0)',
          success: 'rgb(52, 199, 89)',
          warning: 'rgb(255, 204, 0)',
          error: 'rgb(255, 59, 48)'
        },
        input: {
          background: 'rgb(255, 255, 255)',
          border: 'rgb(210, 210, 215)',
          text: 'rgb(0, 0, 0)',
          placeholder: 'rgb(142, 142, 147)',
          focus: 'rgb(0, 122, 255)'
        }
      }
    } else {
      // Chrome, Edge, Opera - esquema padrão claro
      baseScheme = {
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
      }
    }
  }

  // Ajustar para alto contraste se necessário
  if (hasHighContrast) {
    if (prefersDark) {
      baseScheme.text.primary = 'rgb(255, 255, 255)'
      baseScheme.text.secondary = 'rgb(240, 240, 240)'
      baseScheme.background = 'rgb(0, 0, 0)'
      baseScheme.surface = 'rgb(20, 20, 20)'
    } else {
      baseScheme.text.primary = 'rgb(0, 0, 0)'
      baseScheme.text.secondary = 'rgb(30, 30, 30)'
      baseScheme.background = 'rgb(255, 255, 255)'
      baseScheme.surface = 'rgb(250, 250, 250)'
    }
  }

  // Ajustes específicos para Windows (melhor legibilidade)
  if (os === 'Windows') {
    if (prefersDark) {
      // Windows no escuro precisa de mais contraste
      baseScheme.text.primary = 'rgb(255, 255, 255)'
      baseScheme.text.secondary = 'rgb(225, 225, 225)'
    } else {
      // Windows no claro precisa de texto mais forte
      baseScheme.text.primary = 'rgb(0, 0, 0)'
      baseScheme.text.secondary = 'rgb(60, 60, 60)'
    }
  }

  return baseScheme
}

// Aplicar esquema de cores ao documento
export const applyColorScheme = (scheme: ColorScheme): void => {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // Aplicar variáveis CSS customizadas
  root.style.setProperty('--adaptive-bg', scheme.background)
  root.style.setProperty('--adaptive-surface', scheme.surface)
  root.style.setProperty('--adaptive-text-primary', scheme.text.primary)
  root.style.setProperty('--adaptive-text-secondary', scheme.text.secondary)
  root.style.setProperty('--adaptive-text-muted', scheme.text.muted)
  root.style.setProperty('--adaptive-text-inverse', scheme.text.inverse)
  root.style.setProperty('--adaptive-border-light', scheme.border.light)
  root.style.setProperty('--adaptive-border-medium', scheme.border.medium)
  root.style.setProperty('--adaptive-border-heavy', scheme.border.heavy)
  root.style.setProperty('--adaptive-accent-primary', scheme.accent.primary)
  root.style.setProperty('--adaptive-accent-secondary', scheme.accent.secondary)
  root.style.setProperty('--adaptive-accent-success', scheme.accent.success)
  root.style.setProperty('--adaptive-accent-warning', scheme.accent.warning)
  root.style.setProperty('--adaptive-accent-error', scheme.accent.error)
  root.style.setProperty('--adaptive-input-bg', scheme.input.background)
  root.style.setProperty('--adaptive-input-border', scheme.input.border)
  root.style.setProperty('--adaptive-input-text', scheme.input.text)
  root.style.setProperty('--adaptive-input-placeholder', scheme.input.placeholder)
  root.style.setProperty('--adaptive-input-focus', scheme.input.focus)
}

// Hook para monitorar mudanças nas preferências
export const watchColorSchemeChanges = (callback: (scheme: ColorScheme) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const contrastQuery = window.matchMedia('(prefers-contrast: high)')

  const updateScheme = () => {
    const browserInfo = detectBrowser()
    const scheme = getAdaptiveColorScheme(browserInfo)
    callback(scheme)
  }

  darkModeQuery.addEventListener('change', updateScheme)
  contrastQuery.addEventListener('change', updateScheme)

  return () => {
    darkModeQuery.removeEventListener('change', updateScheme)
    contrastQuery.removeEventListener('change', updateScheme)
  }
}

// FUNÇÃO DE LOG REMOVIDA - NÃO EXPOR INFORMAÇÕES DO NAVEGADOR
export const logBrowserInfo = (): void => {
  // LOGS REMOVIDOS PARA PRIVACIDADE - DETECÇÃO SILENCIOSA
  return
}