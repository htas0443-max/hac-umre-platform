import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './lib/sentry';
import { validateEnv } from './lib/envValidation';
import './index.css';
import App from './App';

// Sentry monitoring başlat (production ortamında hataları yakalar)
initSentry();

// Ortam değişkenlerini doğrula (eksik kritik değişken varsa hata fırlatır)
validateEnv();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
