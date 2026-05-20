// ============================================
// SISTEMA DE LOG DE ERROS - SMOKE GARDEN
// ============================================

export const logError = (error, context = {}) => {
  try {
    const errorLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack || null,
      context: context,
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    // Salvar no localStorage
    const logs = JSON.parse(localStorage.getItem('smoke_garden_errors') || '[]')
    logs.unshift(errorLog)
    localStorage.setItem('smoke_garden_errors', JSON.stringify(logs.slice(0, 100)))
    
    // Log no console para debug
    console.error('? Erro registrado:', errorLog)
    
    return errorLog
  } catch (e) {
    console.error('Falha ao registrar erro:', e)
  }
}

export const getErrorLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('smoke_garden_errors') || '[]')
  } catch {
    return []
  }
}

export const clearErrorLogs = () => {
  localStorage.setItem('smoke_garden_errors', '[]')
}

export const exportErrorLogs = () => {
  const logs = getErrorLogs()
  const dataStr = JSON.stringify(logs, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  const link = document.createElement('a')
  link.setAttribute('href', dataUri)
  link.setAttribute('download', `smoke_garden_errors_${new Date().toISOString().split('T')[0]}.json`)
  link.click()
}

// Configurar captura global de erros
export const setupErrorHandling = () => {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, { type: 'unhandled_promise_rejection' })
  })
  
  console.log('? Sistema de log de erros ativado')
}