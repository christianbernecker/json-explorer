import React, { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  isDarkMode: boolean;
  fullWidth?: boolean;
}

const Section: React.FC<SectionProps> = ({ 
  title, 
  children, 
  className = '',
  isDarkMode, 
  fullWidth = false
}) => {
  return (
    <section className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ${className}`}>
      {title && (
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
        </div>
      )}
      <div className={`p-4 ${fullWidth ? 'w-full' : 'max-w-6xl mx-auto'}`}>
        {children}
      </div>
    </section>
  );
};

export default Section; 