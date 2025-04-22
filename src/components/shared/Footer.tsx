import React from 'react';
import { APP_VERSION, APP_ENV } from '../../constants';

// For deployment script detection:
// APP_VERSION = 'v1.1.4'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  // Check if the environment is NOT production
  const isNotProduction = APP_ENV !== 'production'; 

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
            © {currentYear} JSON Explorer | 
            {/* If NOT production (i.e., staging or development), show preview version, otherwise show the normal APP_VERSION */}
            {isNotProduction ? (
              <span> Version v1.1.5-preview</span> 
            ) : (
              <span> Version {APP_VERSION}</span>
            )}
          </div>
          <div className="flex space-x-4">
            <a
              href="/legal/privacy"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="/legal/imprint"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Imprint
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 