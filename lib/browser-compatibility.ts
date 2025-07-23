/**
 * Sistema de compatibilidade entre navegadores
 * Detecta o navegador e aplica ajustes específicos para melhor legibilidade
 */

export interface BrowserInfo {
  name: string
  version: string
  isMobile: boolean
  isHighDPI: boolean
  supportsVariableFonts: boolean
}

export interface ThemeAdjustments {
  fontWeight: {
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  textShadow: string
  letterSpacing: string
  lineHeight: number
  contrastBoost: number
}

export const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator.userAgent
  const vendor = navigator.vendor || ''
  
  let name = 'unknown'
  let version = '0'
  
  // Detectar navegador
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    version = match ? match[1] : '0'
  } else if (userAgent.includes('Firefox')) {
    name = 'firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    version = match ? match[1] : '0'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'safari'
    const match = userAgent.match(/Version\/(\d+)/)
    version = match ? match[1] : '0'
  } else if (userAgent.includes('Edg')) {
    name = 'edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    version = match ? match[1] : '0'
  }
  
  // Detectar mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  
  // Detectar High DPI
  const isHighDPI = window.devicePixelRatio > 1
  
  // Detectar suporte a fontes variáveis
  const supportsVariableFonts = CSS.supports('font-variation-settings', '"wght" 400')
  
  return {
    name,
    version,
    isMobile,
    isHighDPI,
    supportsVariableFonts
  }
}

export const getBrowserAdjustments = (browser: BrowserInfo): ThemeAdjustments => {
  const baseAdjustments: ThemeAdjustments = {
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    textShadow: 'none',
    letterSpacing: '0',
    lineHeight: 1.5,
    contrastBoost: 0
  }
  
  switch (browser.name) {
    case 'firefox':
      // Firefox tende a renderizar fontes mais finas
      return {
        ...baseAdjustments,
        fontWeight: {
          light: 400,
          normal: 500,
          medium: 600,
          semibold: 700,
          bold: 800
        },
        textShadow: '0 0 1px rgba(0,0,0,0.1)',
        letterSpacing: '0.01em',
        contrastBoost: 0.1
      }
      
    case 'safari':
      // Safari tem renderização diferente, especialmente no macOS
      return {
        ...baseAdjustments,
        fontWeight: {
          light: 350,
          normal: 450,
          medium: 550,
          semibold: 650,
          bold: 750
        },
        textShadow: browser.isMobile ? 'none' : '0 0 0.5px rgba(0,0,0,0.05)',
        letterSpacing: '-0.005em',
        contrastBoost: 0.05
      }
      
    case 'edge':
      // Edge (Chromium) similar ao Chrome mas com pequenos ajustes
      return {
        ...baseAdjustments,
        fontWeight: {
          light: 320,
          normal: 420,
          medium: 520,
          semibold: 620,
          bold: 720
        },
        letterSpacing: '0.005em',
        contrastBoost: 0.05
      }
      
    case 'chrome':
    default:
      // Chrome como base, mas com ajustes para High DPI
      if (browser.isHighDPI) {
        return {
          ...baseAdjustments,
          fontWeight: {
            light: 350,
            normal: 450,
            medium: 550,
            semibold: 650,
            bold: 750
          },
          textShadow: '0 0 0.5px rgba(0,0,0,0.03)',
          contrastBoost: 0.03
        }
      }
      return baseAdjustments
  }
}

export const applyBrowserAdjustments = (browser: BrowserInfo, adjustments: ThemeAdjustments) => {
  const root = document.documentElement
  
  // Aplicar pesos de fonte customizados
  root.style.setProperty('--font-weight-light', adjustments.fontWeight.light.toString())
  root.style.setProperty('--font-weight-normal', adjustments.fontWeight.normal.toString())
  root.style.setProperty('--font-weight-medium', adjustments.fontWeight.medium.toString())
  root.style.setProperty('--font-weight-semibold', adjustments.fontWeight.semibold.toString())
  root.style.setProperty('--font-weight-bold', adjustments.fontWeight.bold.toString())
  
  // Aplicar sombra de texto se necessário
  root.style.setProperty('--text-shadow', adjustments.textShadow)
  
  // Aplicar espaçamento de letras
  root.style.setProperty('--letter-spacing', adjustments.letterSpacing)
  
  // Aplicar altura de linha
  root.style.setProperty('--line-height', adjustments.lineHeight.toString())
  
  // Aplicar boost de contraste
  if (adjustments.contrastBoost > 0) {
    root.style.setProperty('--contrast-boost', adjustments.contrastBoost.toString())
  }
  
  // Adicionar classe específica do navegador
  document.body.classList.add(`browser-${browser.name}`)
  
  if (browser.isMobile) {
    document.body.classList.add('is-mobile')
  }
  
  if (browser.isHighDPI) {
    document.body.classList.add('is-high-dpi')
  }
  
  console.log(`🎨 Ajustes aplicados para ${browser.name} v${browser.version}:`, adjustments)
}

export const initBrowserCompatibility = () => {
  if (typeof window === 'undefined') return
  
  const browser = detectBrowser()
  const adjustments = getBrowserAdjustments(browser)
  
  // Aplicar ajustes imediatamente
  applyBrowserAdjustments(browser, adjustments)
  
  // Aplicar novamente após fontes carregarem
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      applyBrowserAdjustments(browser, adjustments)
    }, 100)
  })
  
  return { browser, adjustments }
}