import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/seo';

interface ContactProps {
  isDarkMode: boolean;
}

const Contact: React.FC<ContactProps> = ({ isDarkMode }) => {
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-200`}>
      <SEO 
        title="Contact | JSON Explorer & VAST AdTag Tools"
        description="Contact information for the JSON Explorer and VAST AdTag Tools."
        canonical="https://www.adtech-toolbox.com/json-explorer/contact"
      />
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>Contact Us</h1>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get in touch</div>
            </div>
          </div>

          <Link 
            to="/json-explorer" 
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
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
          <div className="space-y-6">
            <div className={`prose ${isDarkMode ? 'dark:prose-invert' : ''} max-w-none`}>
              <p>If you have any questions or feedback regarding the JSON Explorer tools, please feel free to reach out.</p>
              
              <h2 className={`text-xl font-semibold mt-6 mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Contact Information</h2>
              <p>
                <strong>Email:</strong> 
                <a href="mailto:info@adtech-toolbox.com" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline ml-1`}>
                  info@adtech-toolbox.com
                </a>
              </p>
              
              <h2 className={`text-xl font-semibold mt-6 mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GitHub Repository</h2>
              <p>For technical issues, feature requests, or contributions, please visit our GitHub repository:</p>
              <p>
                <a 
                  href="https://github.com/christianbernecker/json-explorer" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                >
                  JSON Explorer on GitHub
                </a>
              </p>
              <p>You can open an issue for bugs or start a discussion for feature ideas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 