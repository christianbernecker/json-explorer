import { useState, useEffect } from 'react';

export interface ThemeOptions {
  /**
   * Ist der Dark Mode aktiviert?
   */
  isDarkMode: boolean;
  
  /**
   * Funktion zum Umschalten des Dark Mode
   */
  toggleDarkMode: () => void;
  
  /**
   * Liefert Tailwind-Klassen für bestimmte UI-Elemente basierend auf dem aktuellen Theme
   */
  getThemeClasses: {
    // Hintergründe
    appBg: string;
    containerBg: string;
    sectionBg: string;
    
    // Text
    primaryText: string;
    secondaryText: string;
    mutedText: string;
    
    // Elemente
    border: string;
    input: string;
    
    // Interaktionen
    hover: string;
  };
}

/**
 * Hook für Theme-Verwaltung (Dark/Light Mode)
 * 
 * Stellt Theme-Informationen und Funktionen zur Verfügung.
 * Speichert die Einstellungen im localStorage.
 */
export function useTheme(): ThemeOptions {
  // Initialisiere isDarkMode aus localStorage oder auf false
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedDarkMode = localStorage.getItem('app_darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  // Funktion zum Umschalten des Dark Mode
  const toggleDarkMode = (): void => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem('app_darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Wende den Dark Mode auf das HTML-Element an
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode-active');
      document.body.classList.remove('light-mode-active');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-mode-active');
      document.body.classList.remove('dark-mode-active');
    }
  }, [isDarkMode]);

  // Tailwind-Klassen für verschiedene UI-Elemente
  const getThemeClasses = {
    // Hintergründe
    appBg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    containerBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    sectionBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
    
    // Text
    primaryText: isDarkMode ? 'text-white' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-700',
    mutedText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    
    // Elemente
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    input: isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300',
    
    // Interaktionen
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  };

  return {
    isDarkMode,
    toggleDarkMode,
    getThemeClasses
  };
}

export default useTheme; 