import React from 'react';

interface KeyboardShortcutsBoxProps {
  isDarkMode: boolean;
}

const KeyboardShortcutsBox: React.FC<KeyboardShortcutsBoxProps> = ({ isDarkMode }) => {
  return (
    <div 
      className={`absolute bottom-1 right-1 p-2 rounded text-xs z-10 flex flex-col gap-0.5 shadow-sm max-w-[300px] ${
        isDarkMode 
          ? 'bg-black bg-opacity-60 border border-gray-700 border-opacity-50' 
          : 'bg-gray-100 bg-opacity-90 border border-gray-200 border-opacity-80'
      }`}
    >
      <span className={`font-semibold mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Tastaturkürzel:
      </span>
      <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <code className={`inline-block px-1 rounded text-[10px] font-mono mr-1 ${
          isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          Strg+Shift+F
        </code>
        <span>Format JSON</span>
      </div>
      <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <code className={`inline-block px-1 rounded text-[10px] font-mono mr-1 ${
          isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          Strg+Shift+L
        </code>
        <span>Eingabe löschen</span>
      </div>
    </div>
  );
};

export default KeyboardShortcutsBox; 