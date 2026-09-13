import React from 'react'
import ReactDOM from 'react-dom/client'
import MascotOnboarding from './mascot-login-flow.jsx'
import { ErrorBoundary } from './src/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MascotOnboarding />
    </ErrorBoundary>
  </React.StrictMode>,
)
