import React from 'react';
import { Link } from 'react-router-dom';
import { ImprintContent } from '../components/shared';
import { SEO } from '../components/seo';

interface ImprintProps {
  isDarkMode: boolean;
}

const Imprint: React.FC<ImprintProps> = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-200`}>
      <SEO 
        title="Imprint | JSON Explorer & VAST AdTag Tools"
        description="Legal information and imprint for the JSON Explorer and VAST AdTag Tools."
        canonical="https://www.adtech-toolbox.com/json-explorer/imprint"
      />
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6h-.5A1.5 1.5 0 006 7.5V18a1.5 1.5 0 001.5 1.5H19z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>Imprint</h1>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Legal Information</div>
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
          <ImprintContent isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default Imprint; 