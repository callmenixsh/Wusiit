import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW=registerSW({
  onNeedRefresh(){window.dispatchEvent(new CustomEvent('wuwiit:update-ready',{detail:{update:()=>updateSW(true)}}))},
  onOfflineReady(){console.info('Wuwiit is ready to work offline')},
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
