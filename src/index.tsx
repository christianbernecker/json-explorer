import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App'; // Import the main App component from App.tsx
// Remove unused imports and the local App definition

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <HelmetProvider> {/* Keep HelmetProvider if needed globally */} 
      <App /> {/* Render the main App component */} 
    </HelmetProvider>
  </React.StrictMode>
); 