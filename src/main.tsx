import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/styles/global.css'

declare const __APP_VERSION__: string;
document.documentElement.dataset.version = __APP_VERSION__;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
