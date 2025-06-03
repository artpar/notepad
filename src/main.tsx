import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles.css'
import './App.css'
import App from './App.tsx'
import { SettingsProvider } from './contexts/SettingsContext'
import { DocumentProvider } from './contexts/DocumentProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <DocumentProvider>
        <App />
      </DocumentProvider>
    </SettingsProvider>
  </StrictMode>,
)
