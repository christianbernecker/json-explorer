import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  return (
    <footer className={`mt-auto py-4 border-t ${
      isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
    }`}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} JSON Tools - by <a href="mailto:info@adtech-toolbox.com" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Christian Bernecker</a>
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