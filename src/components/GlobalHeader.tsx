import React from 'react';

interface GlobalHeaderProps {
  isDarkMode: boolean;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ isDarkMode }) => {
  return (
    <header className={`w-full fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-blue-900 text-white' : 'bg-blue-600 text-white'}`}>
      <div className="container mx-auto py-2">
        <div className="flex items-center px-4">
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-white">
              AdTech Toolbox
            </h1>
            <p className="text-xs font-medium text-blue-100 tracking-wider uppercase">Professional Developer Tools</p>
          </div>
        </div>
        
        {/* Einfacher Elementstreifen im Stil des Screenshots */}
        <div className="h-1 w-full bg-blue-300 mt-2"></div>
      </div>
    </header>
  );
};

export default GlobalHeader; 