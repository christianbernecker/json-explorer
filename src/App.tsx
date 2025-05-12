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
import TCFDecoderPage from './components/TCFDecoderPage';
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

  return (
    <Router>
      <div className={`flex min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <div className="flex-1 flex flex-col pl-4 sm:pl-6 md:pl-8 lg:pl-10 pr-4 sm:pr-6 md:pr-8 lg:pr-10 xl:pr-12 overflow-x-hidden" style={{ marginLeft: 'var(--sidebar-width, 7rem)' }}>
          <main className={`flex-grow overflow-auto`}>
            <Routes>
              <Route path="/" element={<Homepage isDarkMode={isDarkMode} />} />
              <Route path="/apps" element={<AppOverview isDarkMode={isDarkMode} />} />
              <Route path="/apps/json-explorer" element={<JsonToolsApp parentIsDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
              <Route path="/apps/json-explorer/validator" element={<JsonToolsApp parentIsDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
              <Route path="/apps/json-explorer/diff" element={<JsonToolsApp parentIsDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
              <Route path="/apps/data-visualizer" element={<DataVisualizer isDarkMode={isDarkMode} />} />
              <Route path="/apps/tcf-decoder" element={<TCFDecoderPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
              <Route path="/legal/privacy" element={<PrivacyPage isDarkMode={isDarkMode} />} />
              <Route path="/legal/imprint" element={<ImprintPage isDarkMode={isDarkMode} />} />
              <Route path="*" element={<NotFound isDarkMode={isDarkMode} />} />
            </Routes>
          </main>
          <Footer isDarkMode={isDarkMode} />
        </div>
      </div>
    </Router>
  );
}

export default App; 