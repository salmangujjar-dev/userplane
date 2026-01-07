import React from 'react';
import ReactDOM from 'react-dom/client';
import Userplane from '@workspace/sdk';
import App from './App';
import './index.css';

// Initialize Userplane SDK
// Auto-initializes and mounts recorder when URL contains recording parameters
console.log('[Playground] Userplane SDK loaded:', Userplane);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
