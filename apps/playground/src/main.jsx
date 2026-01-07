import React from 'react';
import ReactDOM from 'react-dom/client';
import * as userplane from '@workspace/sdk';
import App from './App';
import './index.css';

// Initialize Userplane SDK
// Call initialize() manually since we're using the core SDK (no auto-init)
userplane.initialize();
console.log('[Playground] Userplane SDK initialized');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
