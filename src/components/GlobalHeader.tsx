import React from 'react';

interface GlobalHeaderProps {
  isDarkMode: boolean;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ isDarkMode }) => {
  return (
    <header className={`w-full py-3 ${isDarkMode ? 'bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white' : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white'}`}>
      <div className="container mx-auto">
        {/* Top Banner mit 3D-Schatten-Effekt */}
        <div className="relative flex justify-between items-center px-4">
          {/* Logo und Titel mit 3D-Effekt */}
          <div className="flex items-center space-x-3">
            <div className="rounded-lg p-2 bg-white bg-opacity-20 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="inline-block transform hover:translate-y-[-2px] transition-transform duration-300">AdTech</span>
                <span className="inline-block ml-1 text-yellow-300 font-extrabold transform hover:translate-y-[-2px] transition-transform duration-300">Toolbox</span>
              </h1>
              <p className="text-xs font-medium text-blue-100 tracking-wider uppercase">Professional Developer Tools</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button className="text-white hover:text-yellow-200 transition-colors duration-300 font-medium text-sm uppercase tracking-wide">Tools</button>
            <button className="text-white hover:text-yellow-200 transition-colors duration-300 font-medium text-sm uppercase tracking-wide">Dokumentation</button>
            <button className="text-white hover:text-yellow-200 transition-colors duration-300 font-medium text-sm uppercase tracking-wide">Über</button>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white hover:text-yellow-200 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Grafischer Trennbalken */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-yellow-300 to-transparent mt-3 opacity-60"></div>
      </div>
    </header>
  );
};

export default GlobalHeader; 