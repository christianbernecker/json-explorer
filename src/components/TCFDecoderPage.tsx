import React, { useEffect } from 'react';
import TCFDecoder from './TCFDecoder';
import { Helmet } from 'react-helmet-async';

// URL-Parameter für direktes Dekodieren
interface TCFDecoderPageProps {
  location?: {
    search?: string;
  };
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TCFDecoderPage: React.FC<TCFDecoderPageProps> = ({ location, isDarkMode, toggleDarkMode }) => {
  // Wenn eine String-URL übergeben wurde, automatisch dekodieren
  useEffect(() => {
    if (location?.search) {
      const params = new URLSearchParams(location.search);
      const tcString = params.get('tcString');
      
      if (tcString) {
        // Hier könnte man den String automatisch in den Decoder laden
        console.log('Auto-decode:', tcString);
        // TODO: Implement auto-decode
      }
    }
  }, [location]);

  return (
    <div className="mx-auto max-w-full px-4 py-8">
      <Helmet>
        <title>TCF Consent String Decoder & Analyzer | AdTech Toolbox</title>
        <meta 
          name="description" 
          content="Decode and analyze IAB TCF consent strings (v2.0 and v2.2). View vendor consents, purposes, legitimate interests, and special features with our comprehensive TCF decoder tool."
        />
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-2 dark:text-white">TCF Consent String Decoder</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Dekodieren und Analysieren von IAB TCF Consent Strings (v2.0 und v2.2). Zeigt Vendor-Consents, Zwecke, berechtigte Interessen und mehr.
      </p>
      
      <TCFDecoder isDarkMode={isDarkMode} />
    </div>
  );
};

export default TCFDecoderPage; 