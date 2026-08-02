import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { registerSW } from 'virtual:pwa-register'

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}
