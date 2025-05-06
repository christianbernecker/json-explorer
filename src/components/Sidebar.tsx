import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isDarkMode: boolean;
  // globalHeaderHeight: string; // Wird nicht direkt hier benötigt, da das Padding in App.tsx gehandhabt wird
}

const Sidebar: React.FC<SidebarProps> = ({ isDarkMode }) => {
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Navigation Items mit Icons und Text
  const navItems = [
    {
      name: 'Menü',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      path: '/',
    },
    {
      name: 'Apps',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      path: '/apps',
    },
    {
      name: 'JSON Explorer',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      path: '/apps/json-explorer',
    },
    {
      name: 'Data Visualizer',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/apps/data-visualizer',
    },
    {
      name: 'Guide',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/guide',
    }
  ];

  // Farbschema basierend auf dem Dark Mode
  const bgColor = isDarkMode ? 'bg-slate-800' : 'bg-slate-100';
  const textColor = isDarkMode ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-slate-900';
  const activeItemBg = isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
  const hoverBgGeneral = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200';

  const handleMouseEnter = (itemName: string) => {
    setExpandedItem(itemName);
  };

  const handleMouseLeave = () => {
    setExpandedItem(null);
  };

  return (
    <div className={`w-28 ${bgColor} flex flex-col items-center py-4 shadow-lg fixed left-0 top-0 bottom-0 z-50`}>
      {/* Logo */}
      <div className="mb-6 mt-2">
        <Link to="/" className="inline-block">
          <div className="h-10 w-10 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg transform rotate-45"></div>
            <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M3 6.25A2.25 2.25 0 015.25 4h13.5A2.25 2.25 0 0121 6.25v3.5A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75v-3.5zM5.25 7.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM3 15.25A2.25 2.25 0 015.25 13h13.5A2.25 2.25 0 0121 15.25v3.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-3.5zM5.25 16.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col items-center space-y-4 w-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > 1) ||
                          (item.path === '/' && location.pathname === '/');
          const isExpanded = expandedItem === item.name;
          
          return (
            <div key={item.name} className="relative w-full group" onMouseEnter={() => handleMouseEnter(item.name)} onMouseLeave={handleMouseLeave}>
              <Link
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-14 rounded-md transition-all duration-200 ease-in-out 
                  ${isActive 
                    ? `${activeItemBg} shadow-md scale-105` 
                    : `${textColor} ${hoverBgGeneral} hover:shadow-sm hover:scale-105`
                  }`}
                aria-label={item.name}
              >
                <div className={`transition-transform duration-200 ease-in-out ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
                <span className={`text-xs mt-1 text-center truncate w-full ${isActive ? 'font-semibold' : 'font-normal'}`}>{item.name}</span>
              </Link>
              
              {/* Erweiterter Tooltip - erscheint rechts von der Sidebar */}
              {isExpanded && !isActive && (
                <div className={`absolute left-full top-0 ml-2 px-3 py-2 ${isDarkMode ? 'bg-slate-700' : 'bg-white'} ${textColor} rounded-md shadow-md z-10 whitespace-nowrap text-sm font-medium`}>
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-inherit"></div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 