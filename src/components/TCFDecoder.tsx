import React, { useState } from 'react';
import { Button } from './shared';

interface TCFDecoderProps {
  isDarkMode: boolean;
  initialTcString?: string | null;
}

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode, initialTcString }) => {
  const [tcfString, setTcfString] = useState(initialTcString || '');
  
  // Farbschema basierend auf dem Dark Mode
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  
  return (
    <div className="w-full">
      {/* Eingabebereich */}
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} ${bgColor}`}>
        <h2 className={`text-xl font-bold mb-4 ${textColor}`}>TCF String Decoder</h2>
        <p className={`mb-4 ${secondaryTextColor}`}>
          Bitte geben Sie eine TCF-Consent-Zeichenfolge ein, um deren Inhalt zu dekodieren und zu analysieren.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={tcfString}
            onChange={(e) => setTcfString(e.target.value)}
            placeholder="Geben Sie eine TCF-Consent-Zeichenfolge ein..."
            className={`flex-1 p-3 border rounded-lg font-mono text-sm ${inputBgColor} ${inputBorderColor} ${textColor}`}
            rows={3}
          />
          
          <div className="flex items-end">
            <Button 
              onClick={() => alert('Diese Funktion ist aktuell in Entwicklung.')}
              variant="primary"
              isDarkMode={isDarkMode}
            >
              Dekodieren
            </Button>
          </div>
        </div>
      </div>
      
      {/* Hinweis */}
      <div className={`mt-8 p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke={isDarkMode ? '#9ca3af' : '#4b5563'}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>
          Decoder in Entwicklung
        </h3>
        <p className={secondaryTextColor}>
          Der TCF-Decoder befindet sich aktuell in Entwicklung und wird in Kürze verfügbar sein.
          <br />
          Diese vorläufige Version dient nur als Platzhalter.
        </p>
      </div>
    </div>
  );
};

export default TCFDecoder; 