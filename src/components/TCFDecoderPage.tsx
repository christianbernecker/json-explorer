import React, { useEffect } from 'react';
import TCFDecoder from './TCFDecoder';
import { Helmet } from 'react-helmet-async';
import ApplicationHeader from './ApplicationHeader';
import PrimaryContainer from './shared/PrimaryContainer';

// URL parameter for direct decoding
interface TCFDecoderPageProps {
  location?: {
    search?: string;
  };
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TCFDecoderPage: React.FC<TCFDecoderPageProps> = ({ location, isDarkMode, toggleDarkMode }) => {
  // Auto-decode if string is passed in URL
  useEffect(() => {
    if (location?.search) {
      const params = new URLSearchParams(location.search);
      const tcString = params.get('tcString');
      
      if (tcString) {
        // Here you could automatically load the string into the decoder
        console.log('Auto-decode:', tcString);
        // TODO: Implement auto-decode
      }
    }
  }, [location]);

  return (
    <div className="w-full h-full flex flex-col p-0">
      <Helmet>
        <title>TCF Consent String Decoder & Analyzer | AdTech Toolbox</title>
        <meta 
          name="description" 
          content="Decode and analyze IAB TCF consent strings (v2.0 and v2.2). View vendor consents, purposes, legitimate interests, and special features with our comprehensive TCF decoder tool."
        />
      </Helmet>
      
      <ApplicationHeader 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        title="TCF Decoder"
        subtitle="Decode and analyze IAB TCF consent strings"
      />
      
      {/* Container mit responsiven Abständen */}
      <div className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 lg:px-8">
        <PrimaryContainer isDarkMode={isDarkMode}>
          <TCFDecoder isDarkMode={isDarkMode} />
        </PrimaryContainer>
      </div>
    </div>
  );
};

export default TCFDecoderPage; 