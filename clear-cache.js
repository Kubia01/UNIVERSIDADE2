/**
 * Script para limpar cache corrompido
 * Execute no console do navegador
 */

// Limpar localStorage
console.log('🧹 Limpando localStorage...')
const keysToRemove = []
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  if (key && (
    key.includes('courses-') ||
    key.includes('ultra-cache-') ||
    key.includes('emergency-') ||
    key.includes('users-published')
  )) {
    keysToRemove.push(key)
  }
}

keysToRemove.forEach(key => {
  console.log('🗑️ Removendo:', key)
  localStorage.removeItem(key)
})

// Limpar sessionStorage
console.log('🧹 Limpando sessionStorage...')
const sessionKeysToRemove = []
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i)
  if (key && (
    key.includes('courses-') ||
    key.includes('ultra-cache-') ||
    key.includes('emergency-') ||
    key.includes('users-published')
  )) {
    sessionKeysToRemove.push(key)
  }
}

sessionKeysToRemove.forEach(key => {
  console.log('🗑️ Removendo session:', key)
  sessionStorage.removeItem(key)
})

// Limpar cache em memória se existir
if (window.ultraCache) {
  console.log('🧹 Limpando ultraCache...')
  Object.keys(window.ultraCache).forEach(key => {
    if (key.includes('courses') || key.includes('users-published')) {
      console.log('🗑️ Removendo ultra cache:', key)
      delete window.ultraCache[key]
    }
  })
}

console.log('✅ Cache limpo! Recarregue a página.')
console.log('🔄 Execute: location.reload()')