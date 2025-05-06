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
import GlobalHeader from './components/GlobalHeader';
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
      document.body.classList.add('dark-mode-active');
      document.body.classList.remove('light-mode-active');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-mode-active');
      document.body.classList.remove('dark-mode-active');
    }
  }, [isDarkMode]);

  // Geschätzte Höhe des GlobalHeaders, dynamische Berechnung wäre besser, aber für jetzt:
  const globalHeaderHeight = "76px"; 

  return (
    <Router>
      <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <GlobalHeader isDarkMode={isDarkMode} />
        <div className="flex flex-1" style={{ paddingTop: globalHeaderHeight }}>
          <Sidebar isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col ml-20">
            <main className={`flex-grow p-6 overflow-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <Routes>
                <Route path="/" element={<Homepage isDarkMode={isDarkMode} />} />
                <Route path="/apps" element={<AppOverview isDarkMode={isDarkMode} />} />
                <Route path="/apps/json-explorer" element={<JsonToolsApp parentIsDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
                <Route path="/apps/data-visualizer" element={<DataVisualizer isDarkMode={isDarkMode} />} />
                <Route path="/legal/privacy" element={<PrivacyPage isDarkMode={isDarkMode} />} />
                <Route path="/legal/imprint" element={<ImprintPage isDarkMode={isDarkMode} />} />
                <Route path="*" element={<NotFound isDarkMode={isDarkMode} />} />
              </Routes>
            </main>
            <Footer isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App; 