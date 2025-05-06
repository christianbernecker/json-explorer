import React from 'react';

interface InfoPanelProps {
  isVisible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ isVisible, onClose, isDarkMode }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className={`relative max-w-2xl w-full p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
        onClick={(e) => e.stopPropagation()} // Verhindert, dass das Panel geschlossen wird, wenn darauf geklickt wird
      >
        <button 
          className={`absolute top-3 right-3 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>JSON and VAST AdTag Tools</h2>
        
        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-4`}>
          <p>
            Validate, format, and compare JSON files and VAST AdTags easily. Our tools help you visualize and analyze your data with a clean, intuitive interface.
          </p>
          
          <div>
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Features:</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Format and validate JSON with syntax highlighting</li>
              <li>Extract and visualize VAST XML from JSON payloads</li>
              <li>Navigate through VAST wrapper chains</li>
              <li>Compare JSON files side-by-side with difference highlighting</li>
              <li>Smart history tracking for previous operations</li>
              <li>Dark mode support for reduced eye strain</li>
            </ul>
          </div>
          
          <div>
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Keyboard Shortcuts:</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              <li>
                <kbd className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>Ctrl+Shift+D</kbd>
                <span className="ml-2">Toggle Dark Mode</span>
              </li>
              <li>
                <kbd className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>Ctrl+Shift+H</kbd>
                <span className="ml-2">Toggle History</span>
              </li>
              <li>
                <kbd className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>Ctrl+Shift+1</kbd>
                <span className="ml-2">Switch to JSON Explorer</span>
              </li>
              <li>
                <kbd className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>Ctrl+Shift+2</kbd>
                <span className="ml-2">Switch to Diff Inspector</span>
              </li>
              <li>
                <kbd className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>Ctrl+Shift+F</kbd>
                <span className="ml-2">Format JSON</span>
              </li>
              <li>
                <kbd className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>Ctrl+Shift+L</kbd>
                <span className="ml-2">Clear Input</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel; 