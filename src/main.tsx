import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Keep optional webfonts out of the render-blocking stylesheet and initial requests.
requestAnimationFrame(() => {
  void import('./styles/game-font.css').catch(error => {
    console.warn('Webfont styles could not be loaded; using system fonts.', error)
  })
})

