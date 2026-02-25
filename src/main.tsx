import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to help debug blank screen issues in production
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
        <h1 style="margin-top: 0;">Application Error</h1>
        <p>The application failed to start. This is often due to missing environment variables or a runtime crash.</p>
        <pre style="white-space: pre-wrap; font-size: 12px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px;">${message}</pre>
        <p>Please check your browser console for more details.</p>
      </div>
    `;
  }
};

console.log('Application starting...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
