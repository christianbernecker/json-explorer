import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  isDarkMode: boolean;
  className?: string;
}

/**
 * Standardisierte Komponente für Sektions-Überschriften mit optionaler Beschreibung.
 * Bietet konsistentes Styling für alle Anwendungen.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  isDarkMode,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold mb-2 dark:text-white">{title}</h1>
      {description && (
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeader; 