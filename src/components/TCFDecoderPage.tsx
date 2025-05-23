import React, { useEffect, useState } from "react";
import TCFDecoder from "./TCFDecoder";
import { Helmet } from "react-helmet-async";
import ApplicationHeader from "./ApplicationHeader";
import { useLocation } from "react-router-dom";
import PrimaryContainer from "./shared/PrimaryContainer";

interface TCFDecoderPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TCFDecoderPage: React.FC<TCFDecoderPageProps> = ({ isDarkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [autoDecodeString, setAutoDecodeString] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("decoder");
  const [showHistory, setShowHistory] = useState(false);
  const [tcfHistory, setTcfHistory] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tcString = params.get("tcString");
    const tab = params.get("tab");
    
    if (tcString) {
      setAutoDecodeString(tcString);
    }
    
    if (tab === "gvl-explorer") {
      setActiveTab("gvl-explorer");
    } else {
      setActiveTab("decoder");
    }
  }, [location]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("tcf_decoderHistory");
      if (savedHistory) {
        setTcfHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load TCF history:", error);
    }
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
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
      
      <div className="mt-4 sm:mt-6 md:mt-8 px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
        <PrimaryContainer isDarkMode={isDarkMode}>
          <TCFDecoder 
            isDarkMode={isDarkMode} 
            initialTcString={autoDecodeString} 
            initialTab={activeTab} 
          />
        </PrimaryContainer>
      </div>
    </div>
  );
};

export default TCFDecoderPage;
