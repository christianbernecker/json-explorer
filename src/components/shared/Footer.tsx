import React from 'react';
import { Link } from 'react-router-dom';

// Leeres Export-Statement zur Sicherstellung, dass die Datei als Modul behandelt wird
export {};

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  // Check if we're in staging environment based on hostname
  const isStaging = 
    typeof window !== 'undefined' && 
    (window.location.hostname.includes('staging') || 
     window.location.hostname.includes('localhost'));

  return (
    <footer className={`mt-auto py-4 border-t ${
      isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
    }`}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} JSON Tools <span className="mx-1">|</span> <span className="font-semibold">v1.0.0</span> <span className="mx-1">|</span> by <a href="mailto:info@adtech-toolbox.com" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Christian Bernecker</a>
          {isStaging && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-500 text-black font-bold">STAGING</span>}
        </div>
        <div className="flex space-x-6 text-xs">
          <Link 
            to="/imprint" 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
          >
            Imprint
          </Link>
          <Link 
            to="/privacy" 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
          >
            Data Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 