import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  isDarkMode: boolean;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  withPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  isDarkMode,
  headerContent,
  footerContent,
  variant = 'default',
  withPadding = true,
}) => {
  // Basisstile für Karten
  const baseStyles = 'rounded-lg shadow-md overflow-hidden';
  
  // Hintergrund- und Randfarben basierend auf Variante und Dark Mode
  const variantStyles = {
    default: isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200',
    primary: isDarkMode 
      ? 'bg-blue-900 border border-blue-800' 
      : 'bg-blue-50 border border-blue-200',
    secondary: isDarkMode 
      ? 'bg-gray-700 border border-gray-600' 
      : 'bg-gray-50 border border-gray-300',
  };
  
  // Textfarben basierend auf Dark Mode
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  
  // Kombinierte Stilklassen
  const cardClasses = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  return (
    <div className={cardClasses}>
      {/* Header, wenn Titel oder Header-Content vorhanden ist */}
      {(title || headerContent) && (
        <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b p-4 flex items-center justify-between`}>
          {title && <h3 className={`font-semibold ${textColor}`}>{title}</h3>}
          {headerContent && <div className="flex items-center">{headerContent}</div>}
        </div>
      )}
      
      {/* Hauptinhalt */}
      <div className={`${withPadding ? 'p-4' : ''} ${textColor}`}>
        {children}
      </div>
      
      {/* Footer, wenn vorhanden */}
      {footerContent && (
        <div className={`${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} border-t p-3 ${secondaryTextColor}`}>
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default Card; 