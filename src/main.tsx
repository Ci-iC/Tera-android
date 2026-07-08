import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/theme.css'
import './styles/global.css'

// 蛋的小晃动动画
const style = document.createElement('style')
style.textContent = `@keyframes wiggle { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
