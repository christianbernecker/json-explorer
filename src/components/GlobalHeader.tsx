import React from 'react';

interface GlobalHeaderProps {
  isDarkMode: boolean;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ isDarkMode }) => {
  return (
    <header className={`w-full py-2 fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gradient-to-r from-blue-900 to-indigo-800 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white'}`}>
      <div className="container mx-auto">
        <div className="flex items-center px-4 py-2">
          <div className="flex-grow">
            <h1 className="text-2xl font-bold tracking-tight flex items-baseline">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">AdTech</span>
              <span className="ml-1 font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">Toolbox</span>
            </h1>
            <p className="text-xs font-medium text-blue-100 tracking-wider uppercase">Professional Developer Tools</p>
          </div>
        </div>
        
        {/* Dekorativer Elementstreifen - Version 1 (deaktiviert) */}
        {/*
        <div className="flex h-1.5 w-full">
          <div className="h-full w-1/5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="h-full w-3/5 bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.3)_0%,_transparent_70%)] bg-[length:10px_10px]"></div>
          </div>
          <div className="h-full w-1/5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
        </div>
        */}
        
        {/* Alternativer Elementstreifen - Version 2 - moderner und interaktiver */}
        <div className="h-1.5 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400"></div>
          <div className="absolute inset-0 flex">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="h-full flex-grow border-r border-white border-opacity-30 last:border-r-0"
              ></div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" style={{ 
            backgroundSize: '200% 100%',
            animation: 'shine 3s infinite linear'
          }}></div>
        </div>
        
        {/* Alternativer Elementstreifen - Version 3 - Futuristisches Dot-Pattern (deaktiviert) */}
        {/*
        <div className="h-2 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            transform: 'translateX(0)',
            animation: 'moveBackground 15s linear infinite'
          }}></div>
        </div>
        */}
      </div>
    </header>
  );
};

export default GlobalHeader; 