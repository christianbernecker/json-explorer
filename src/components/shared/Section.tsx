import React, { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  isDarkMode: boolean;
  headerRight?: ReactNode;
  fullWidth?: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  children,
  className = '',
  isDarkMode,
  headerRight,
  fullWidth = false,
}) => {
  // Farbstile basierend auf Dark Mode
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const headerBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden shadow-sm ${bgColor} ${className}`}>
      {title && (
        <div className={`${headerBgColor} px-4 py-3 border-b ${borderColor} flex justify-between items-center`}>
          <h3 className={`font-semibold ${textColor}`}>{title}</h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className={`${textColor} ${fullWidth ? '' : 'p-4'}`}>
        {children}
      </div>
    </div>
  );
};

export default Section; 