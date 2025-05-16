import React, { useEffect, useState } from 'react';
import TCFDecoder from './TCFDecoder';
import { Helmet } from 'react-helmet-async';
import { Section } from './shared';
import ApplicationHeader from './ApplicationHeader';
import { loadHistory } from '../services/historyService';

// URL parameter for direct decoding
interface TCFDecoderPageProps {
  location?: {
    search?: string;
  };
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TCFDecoderPage: React.FC<TCFDecoderPageProps> = ({ location, isDarkMode, toggleDarkMode }) => {
  // State für automatisches Dekodieren aus URL-Parameter
  const [autoDecodeString, setAutoDecodeString] = useState<string | null>(null);
  // State für die History-Anzeige
  const [showHistory, setShowHistory] = useState(false);
  const tcfHistory = loadHistory('tcf');
  
  // Auto-decode if string is passed in URL
  useEffect(() => {
    if (location?.search) {
      const params = new URLSearchParams(location.search);
      const tcString = params.get('tcString');
      
      if (tcString) {
        setAutoDecodeString(tcString);
      }
    }
  }, [location]);

  return (
    <div className="w-full h-full flex flex-col">
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
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        historyLength={tcfHistory.length}
        title="TCF Decoder"
        subtitle="Decode and analyze IAB TCF consent strings"
        activeTab="tcf-decoder"
      />
      
      {/* Container mit responsiven Abständen angepasst an JsonToolsApp */}
      <div className="mt-4 sm:mt-6 md:mt-8 px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
        <Section 
          isDarkMode={isDarkMode} 
          className="mb-0"
          fullWidth={true}
        >
          <TCFDecoder 
            isDarkMode={isDarkMode} 
            initialTcString={autoDecodeString}
          />
        </Section>
      </div>
    </div>
  );
};

export default TCFDecoderPage; 