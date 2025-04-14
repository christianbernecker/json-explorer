import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import JsonToolsApp from './components';
import Imprint from './pages/Imprint';
import Privacy from './pages/Privacy';

// Create an App component to handle routing and global state
const App = () => {
  // Global dark mode state that's shared with the legal pages
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedDarkMode = localStorage.getItem('jsonTools_darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('jsonTools_darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Get the basename from the homepage value in package.json
  const basename = process.env.PUBLIC_URL || '';

  return (
    <HelmetProvider>
      <Router basename={basename}>
        <Routes>
          {/* Main App */}
          <Route path="/" element={<JsonToolsApp parentIsDarkMode={isDarkMode} setParentIsDarkMode={setIsDarkMode} />} />
          
          {/* New Legal Routes */}
          <Route path="/legal/imprint" element={<Imprint isDarkMode={isDarkMode} />} />
          <Route path="/legal/privacy" element={<Privacy isDarkMode={isDarkMode} />} />
          
          {/* Keep old routes for backward compatibility and redirect to new ones */}
          <Route path="/imprint" element={<Navigate to="/legal/imprint" replace />} />
          <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 