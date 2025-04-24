import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION } from '../../constants'; 

// For deployment script detection:
// APP_VERSION = 'v1.1.4' // Keep this comment for context

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Diese Prüfung läuft nur im Browser, nicht während des Builds
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Prüfen, ob Hostname die Staging-Domain oder eine Vercel-Preview-URL enthält
      if (hostname.includes('staging.adtech-toolbox') || hostname.includes('vercel.app')) {
        setIsPreview(true);
      }
      // Optional: Lokale Entwicklung als Preview behandeln?
      // else if (hostname === 'localhost') {
      //   setIsPreview(true); 
      // }
    }
  }, []); // Leeres Array: Effekt nur einmal nach dem Mounten ausführen

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
            © {currentYear} AdTech Toolbox | JSON Explorer | 
            {/* Zeige Preview-Version, wenn Hostname passt, sonst normale Version */}
            {isPreview ? (
              <span> Version v1.1.5-preview</span> 
            ) : (
              <span> Version {APP_VERSION}</span> 
            )}
          </div>
          <div className="flex space-x-4">
            <Link
              to="/legal/privacy"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/legal/imprint"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Imprint
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 