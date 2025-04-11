import React from 'react';
import { Link } from 'react-router-dom';

// Leeres Export-Statement zur Sicherstellung, dass die Datei als Modul behandelt wird
export {};

// Define the current version
const APP_VERSION = 'v1.1.1'; // Current Production Version
const APP_VERSION_NEXT = 'v1.1.2'; // Next version in development

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

  return (
    <footer className={`mt-auto py-4 border-t ${
      isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
    }`}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} <span className="font-medium">JSON Validator & AdTech Tools</span> <span className="mx-1">|</span> <span className="font-semibold">{displayVersion}</span> <span className="mx-1">|</span> Entwickelt von <a href="mailto:info@adtech-toolbox.com" className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} title="Kontakt zum Entwickler">Christian Bernecker</a>
          {isStaging && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-500 text-black font-bold">STAGING</span>}
        </div>
        <nav className="flex space-x-6 text-xs" aria-label="Rechtliche Informationen">
          <Link 
            to="/imprint" 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            title="Impressum und rechtliche Informationen"
          >
            Impressum
          </Link>
          <Link 
            to="/privacy" 
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            title="Datenschutzerklärung und Informationen zur Datenverarbeitung"
          >
            Datenschutz
          </Link>
          <a
            href="https://github.com/christianbernecker/json-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:underline ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            title="GitHub Repository des JSON Explorer"
          >
            GitHub
          </a>
        </nav>
      </div>
      <div className="container mx-auto px-4 mt-2 text-xs text-center">
        <p className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
          Kostenlose Online-Tools für JSON-Validierung, Formatierung, Vergleich und VAST AdTag-Analyse
        </p>
      </div>
    </footer>
  );
};

export default Footer; 