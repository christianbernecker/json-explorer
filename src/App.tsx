import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JsonToolsApp from './components/JsonToolsApp';
import DataVisualizer from './components/DataVisualizer';
import Homepage from './components/Homepage';
import AppOverview from './components/AppOverview';
import PrivacyPage from './components/PrivacyPage';
import ImprintPage from './components/ImprintPage';
import NotFound from './components/NotFound';
import NavigationBar from './components/NavigationBar';
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
      <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <NavigationBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-grow pb-20 w-full">
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
        <Footer isDarkMode={isDarkMode} />
      </div>
    </Router>
  );
}

export default App; 