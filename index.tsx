import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global Error Handler for "White Screen" issues
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: #fca5a5; font-family: sans-serif; text-align: center;">
        <h2 style="font-size: 1.5rem; margin-bottom: 10px;">Erro de Inicialização</h2>
        <p>Ocorreu um erro ao carregar o aplicativo.</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; overflow: auto; text-align: left; font-size: 0.8rem; margin-top: 20px;">
${message}
em ${source}:${lineno}:${colno}
        </pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #b45309; border: none; border-radius: 5px; color: white; cursor: pointer;">Recarregar Página</button>
      </div>
    `;
  }
  console.error("Global Error Caught:", error);
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("FATAL: Could not find root element 'root' in HTML. App cannot mount.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("FATAL: Error mounting React application:", err);
    // Manually render error to DOM if React fails completely
    rootElement.innerHTML = `<div style="color:red; padding:20px;">Falha crítica ao montar React: ${String(err)}</div>`;
  }
}