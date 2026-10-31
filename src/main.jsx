import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import setupLocatorUI from '@locator/runtime';
import './i18n';
import './index.css';
import App from './App.jsx';

if (import.meta.env.MODE === 'development') {

  setupLocatorUI();
}

// Surface full error details in the native console. Without this, Capacitor's
// iOS bridge only logs a generic "JS Eval error" with no message/stack.
window.addEventListener('error', (event) => {
  console.error('[uncaught error]', event.message, event.error?.stack);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error(
    '[unhandled rejection]',
    event.reason?.message ?? event.reason,
    event.reason?.stack,
  );
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
