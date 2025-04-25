import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JsonToolsApp from './components/JsonToolsApp';
import DataVisualizer from './components/DataVisualizer';
import Homepage from './components/Homepage';
import AppOverview from './components/AppOverview';
import PrivacyPage from './components/PrivacyPage';
import ImprintPage from './components/ImprintPage';
import NotFound from './components/NotFound';
import Sidebar from './components/Sidebar';
import { Footer } from './components/shared';

function App() {
  // Global dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem('app_darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  // Toggle dark mode function to be passed to children
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode: boolean) => {
      const newMode = !prevMode;
      localStorage.setItem('app_darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Apply dark mode to the document body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-gray-900', 'text-white');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-gray-900', 'text-white');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className={`flex min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        {/* Sidebar Navigation */}
        <Sidebar isDarkMode={isDarkMode} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-20">
          {/* Top Bar - nur der Dark Mode Toggle */}
          <div className={`h-16 px-6 flex items-center justify-end border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Main Content Area */}
          <main className="flex-grow p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Homepage isDarkMode={isDarkMode} />} />
              <Route path="/apps" element={<AppOverview isDarkMode={isDarkMode} />} />
              <Route path="/apps/json-explorer" element={<JsonToolsApp parentIsDarkMode={isDarkMode} setParentIsDarkMode={setIsDarkMode} />} />
              <Route path="/apps/data-visualizer" element={<DataVisualizer isDarkMode={isDarkMode} />} />
              <Route path="/legal/privacy" element={<PrivacyPage isDarkMode={isDarkMode} />} />
              <Route path="/legal/imprint" element={<ImprintPage isDarkMode={isDarkMode} />} />
              <Route path="*" element={<NotFound isDarkMode={isDarkMode} />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <Footer isDarkMode={isDarkMode} />
        </div>
      </div>
    </Router>
  );
}

export default App; 