import React, { useState } from 'react';
import ModernTabsExample from './shared/ModernTabsExample';

/**
 * Demo-Komponente, um die neuen ModernTabs zu zeigen
 */
const ModernTabsDemo: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex justify-between items-center">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            JSON Explorer - Moderne Tabs
          </h1>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
            }`}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        
        <div className="mb-6 p-4 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}">
          <p className="mb-2">
            Diese Demo zeigt die neue Tab-Komponente mit folgenden Verbesserungen:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Moderne Animationen der Tabs mit Framer Motion</li>
            <li>Größere, markantere Tabs mit Icons und Text</li>
            <li>Bessere visuelle Hierarchie und Farbakzente</li>
            <li>Optimiert für Desktop- und Mobile-Ansichten</li>
            <li>Verbesserte Barrierefreiheit mit Tastaturnavigation</li>
          </ul>
        </div>
        
        <ModernTabsExample isDarkMode={isDarkMode} />
        
        <div className="mt-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Die Tab-Komponente kann horizontal oder vertikal ausgerichtet werden und passt sich automatisch an verschiedene Bildschirmgrößen an.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernTabsDemo; 