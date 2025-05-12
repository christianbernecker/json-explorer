import React from 'react';
import TCFDecoder from './TCFDecoder';
import ApplicationHeader from './ApplicationHeader';

interface TCFDecoderPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const TCFDecoderPage: React.FC<TCFDecoderPageProps> = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <div className="flex flex-col">
      <ApplicationHeader 
        title="TCF Decoder"
        subtitle="Dekodieren und Analysieren von TCF v2.0 und v2.2 Consent Strings"
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      
      <div className="mt-6">
        <TCFDecoder isDarkMode={isDarkMode} />
      </div>
      
      <div className={`mt-8 mb-4 p-4 rounded-md ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
        <h2 className="text-lg font-semibold mb-2">Über das TCF Decoder Tool</h2>
        <p className="mb-3 text-sm">
          Dieses Tool analysiert und dekodiert Transparency &amp; Consent Framework (TCF) Strings gemäß der IAB-Europa-Spezifikation. 
          Es unterstützt sowohl TCF v2.0 als auch TCF v2.2 Strings und gibt detaillierte Informationen über Vendor-Zustimmungen, 
          berechtigte Interessen, Verarbeitungszwecke und Publisher-Einschränkungen.
        </p>
        <p className="text-sm">
          <strong>Datenschutzhinweis:</strong> Die gesamte Verarbeitung erfolgt lokal in Ihrem Browser. Es werden keine TCF-Strings 
          an externe Server gesendet oder gespeichert.
        </p>
      </div>
    </div>
  );
};

export default TCFDecoderPage; 