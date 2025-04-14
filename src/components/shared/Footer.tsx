import React from 'react';
import { Link } from 'react-router-dom';
import { openConsentManager } from '../../cmp';

// Leeres Export-Statement zur Sicherstellung, dass die Datei als Modul behandelt wird
export {};

// Constants for app information
const APP_VERSION = 'v1.1.3'; // Current Production Version
const APP_VERSION_NEXT = 'v1.1.4'; // Next version in development

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  // Check if we're in staging environment based on hostname
  const isStaging = 
    typeof window !== 'undefined' && 
    (window.location.hostname.includes('staging') || 
     window.location.hostname.includes('localhost'));

  // Display version based on environment
  const displayVersion = isStaging ? `${APP_VERSION_NEXT} (Preview)` : APP_VERSION;

  // Function to manually show the CMP
  const showCMP = () => {
    console.log('Privacy Settings button clicked');
    
    // Make sure we're in a browser context
    if (typeof window === 'undefined' || !window) {
      console.error('Window is undefined');
      return;
    }
    
    try {
      console.log('Attempting to open consent manager directly...');
      // Versuchen, Klaro direkt zu verwenden, falls es verfügbar ist
      if (window.klaro) {
        console.log('Klaro found on window object');
        window.klaro.show();
        console.log('Klaro.show called directly');
      } else {
        console.log('Klaro not found on window, trying openConsentManager');
        // Fallback: unsere eigene Funktion verwenden
        openConsentManager();
      }
    } catch (e) {
      console.error('Failed to open consent manager:', e);
      // Redirect to privacy policy as fallback
      console.log('Redirecting to privacy page as fallback');
      window.location.href = '/json-explorer/legal/privacy';
    }
  };

  return (
    <footer className={`mt-auto py-4 border-t ${
      isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
    }`}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} <span className="font-medium">JSON Validator & AdTech Tools</span> <span className="mx-1">|</span> <span className="font-semibold">{displayVersion}</span> <span className="mx-1">|</span> Developed by <a href="mailto:info@adtech-toolbox.com" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} title="Contact the developer">Christian Bernecker</a>
          {isStaging && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-500 text-black font-bold">STAGING</span>}
        </div>
        <nav className="flex space-x-6 text-xs" aria-label="Legal Information">
          <button 
            onClick={showCMP} 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            title="Manage your privacy and cookie settings"
          >
            Privacy Settings
          </button>
          <Link 
            to="/legal/imprint" 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            title="Imprint and legal information"
          >
            Imprint
          </Link>
          <Link 
            to="/legal/privacy" 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            title="Privacy policy and data processing information"
          >
            Privacy
          </Link>
        </nav>
      </div>
      <div className="container mx-auto px-4 mt-2 text-[10px] text-center">
        <p className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>
          Free online tools for JSON validation, formatting, comparison and VAST AdTag analysis
        </p>
      </div>
    </footer>
  );
};

export default Footer; 