import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW=registerSW({
  onNeedRefresh(){if(confirm('A new version of Wuwiit is ready. Update now?'))void updateSW(true)},
  onOfflineReady(){console.info('Wuwiit is ready to work offline')},
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
