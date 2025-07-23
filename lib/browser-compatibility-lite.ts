/**
 * Sistema de compatibilidade leve - versão otimizada
 * Aplica ajustes mínimos necessários sem impacto na performance
 */

let isInitialized = false

export const initBrowserCompatibilityLite = () => {
  // Evitar múltiplas execuções
  if (isInitialized || typeof window === 'undefined') return
  
  const userAgent = navigator.userAgent
  let adjustments = ''
  
  // Detectar apenas casos críticos
  if (userAgent.includes('Firefox')) {
    // Firefox precisa de fontes mais pesadas
    adjustments = `
      :root {
        --font-weight-light: 400;
        --font-weight-normal: 500;
        --font-weight-medium: 600;
      }
      .font-light { font-weight: 400 !important; }
      .font-normal { font-weight: 500 !important; }
      .text-xs, .text-sm { text-shadow: 0 0 1px rgba(0,0,0,0.05); }
    `
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    // Safari precisa de antialiasing
    adjustments = `
      :root { -webkit-font-smoothing: antialiased; }
      .text-gray-400, .text-gray-500 { color: rgb(107, 114, 128) !important; }
    `
  }
  
  // Aplicar CSS se necessário
  if (adjustments) {
    const style = document.createElement('style')
    style.textContent = adjustments
    document.head.appendChild(style)
  }
  
  isInitialized = true
}