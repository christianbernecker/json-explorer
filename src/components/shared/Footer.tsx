import React from 'react';
import { APP_VERSION, APP_VERSION_NEXT } from '../../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
            © {new Date().getFullYear()} JSON Explorer | Version {APP_VERSION}
            {APP_VERSION_NEXT && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Next: {APP_VERSION_NEXT}
              </span>
            )}
          </div>
          <div className="flex space-x-4">
            <a
              href="/json-explorer/privacy2"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href="/json-explorer/imprint2"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Imprint
            </a>
            <a
              href="/json-explorer/contact2"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 