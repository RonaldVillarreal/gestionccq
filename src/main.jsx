import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { InstitucionProvider } from './context/InstitucionContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <InstitucionProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </InstitucionProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
