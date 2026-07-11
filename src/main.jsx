import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import setupLocatorUI from '@locator/runtime';
import './i18n';
import './index.css';
import App from './App.jsx';

if (import.meta.env.MODE === 'development') {
  setupLocatorUI();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
