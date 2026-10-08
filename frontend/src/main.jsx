import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/theme.css'
import './index.css'

// ============================================================
// FIX: Recarrega a página quando um chunk antigo não for
// encontrado (erro 404 após deploy novo no Vercel).
// ============================================================
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const KEY = 'chunk_reload_guard';
  const now = Date.now();
  const last = Number(sessionStorage.getItem(KEY) || 0);
  // Evita loop infinito: só recarrega se passou mais de 10s
  if (now - last > 10000) {
    sessionStorage.setItem(KEY, String(now));
    window.location.reload();
  } else {
    console.error('[ChunkLoad] Falha persistente. Verifique o deploy.');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)