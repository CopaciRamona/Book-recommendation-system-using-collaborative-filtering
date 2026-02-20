import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Importă router-ul aici
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Router-ul trebuie să fie la cel mai înalt nivel */}
    <BrowserRouter> 
      {/* 2. Acum AuthProvider poate folosi useNavigate() fără eroare */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)