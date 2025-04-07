import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import JsonToolsApp from './components';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <JsonToolsApp />
  </React.StrictMode>
); 