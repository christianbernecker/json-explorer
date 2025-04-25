import React from 'react';
import { SEO } from './seo';

interface LegalPageLayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  title: string;
  description: string;
  canonicalUrl: string;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ 
  children, 
  isDarkMode, 
  title, 
  description, 
  canonicalUrl 
}) => {
  return (
    <div className={`container mx-auto px-4 py-8 mb-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <SEO 
        canonical={canonicalUrl} 
        title={title}
        description={description}
      />
      <div className={`max-w-6xl mx-auto ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} rounded-lg shadow-md p-8`}>
        {/* Der spezifische Seiteninhalt wird hier gerendert */}
        {children} 
        
        {/* Optional: Gemeinsamer Footer-Bereich für Legal-Seiten, falls gewünscht */}
        {/* Beispiel:
        <div className={`mt-10 pt-6 border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'} text-center text-sm`}>
          © {new Date().getFullYear()} Your Company | 
          <a href="/legal/privacy" className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>Privacy Policy</a> | 
          <a href="/legal/imprint" className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>Imprint</a>
        </div>
        */}
      </div>
    </div>
  );
};

export default LegalPageLayout; 