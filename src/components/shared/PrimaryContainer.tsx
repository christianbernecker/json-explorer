import React, { ReactNode } from 'react';

interface PrimaryContainerProps {
  children: ReactNode;
  isDarkMode: boolean;
  className?: string;
}

/**
 * Einheitlicher primärer Container für Anwendungsinhalte.
 * Bietet konsistentes Styling und Abstände für alle Anwendungen.
 */
const PrimaryContainer: React.FC<PrimaryContainerProps> = ({ 
  children, 
  isDarkMode,
  className = ''
}) => {
  return (
    <div className={`p-6 rounded-lg shadow-md w-full ${
      isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
    } ${className}`}>
      {children}
    </div>
  );
};

export default PrimaryContainer; 