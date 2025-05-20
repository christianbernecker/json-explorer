import React, { useEffect, useState } from 'react';
import TCFDecoder from './TCFDecoder';
import { Helmet } from 'react-helmet-async';
import { Section } from './shared';
import ApplicationHeader from './ApplicationHeader';

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
  // History-State für TCF Strings
  const [tcfHistory, setTcfHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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

  // Lade History aus LocalStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('tcf_decoderHistory');
      if (savedHistory) {
        setTcfHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load TCF history:', error);
    }
  }, []);

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
      
      <div className="mt-2 sm:mt-3 md:mt-4 px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
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