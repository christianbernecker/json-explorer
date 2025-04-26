import React from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
}

export interface KeyboardShortcutsBoxProps {
  isDarkMode: boolean;
  keyboardShortcuts?: KeyboardShortcut[];
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Strg+Shift+F', description: 'Format JSON' },
  { key: 'Strg+Shift+L', description: 'Eingabe löschen' }
];

const KeyboardShortcutsBox: React.FC<KeyboardShortcutsBoxProps> = ({ 
  isDarkMode, 
  keyboardShortcuts = DEFAULT_SHORTCUTS 
}) => {
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
      {keyboardShortcuts.map((shortcut, index) => (
        <div key={index} className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <code className={`inline-block px-1 rounded text-[10px] font-mono mr-1 ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {shortcut.key}
          </code>
          <span>{shortcut.description}</span>
        </div>
      ))}
    </div>
  );
};

export default KeyboardShortcutsBox; 