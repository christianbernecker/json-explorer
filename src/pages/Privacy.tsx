import React from 'react';
import { Link } from 'react-router-dom';
import { PrivacyContent } from '../components/shared';
import { SEO } from '../components/seo';

interface PrivacyProps {
  isDarkMode: boolean;
}

const Privacy: React.FC<PrivacyProps> = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-200`}>
      <SEO 
        title="Privacy Policy | JSON Explorer & VAST AdTag Tools"
        description="Privacy guidelines and information about data processing in the JSON Explorer and VAST AdTag Tools."
        canonical="https://www.adtech-toolbox.com/json-explorer/legal/privacy"
      />
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>Data Privacy</h1>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Privacy Policy</div>
            </div>
          </div>
          
          <Link 
            to="/" 
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to App
          </Link>
        </div>

        <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <PrivacyContent isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default Privacy; 