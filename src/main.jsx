import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

console.log('🔍 Iniciando script main.jsx...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ ERROR FATAL: No se encontró el div con id="root" en index.html');
  document.body.innerHTML = '<h1 style="color:red">ERROR: No encuentro id="root"</h1>';
} else {
  console.log('✅ Div root encontrado. Renderizando App...');
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    console.log('🚀 Renderizado completado.');
  } catch (err) {
    console.error('❌ Error al renderizar:', err);
  }
}