import React, { createContext, useContext, ReactNode } from 'react';
import useTheme, { ThemeOptions } from '../hooks/useTheme';

/**
 * Schnittstelle für den Application Context
 * Beinhaltet alle globalen Zustände und Funktionen
 */
interface AppContextType extends ThemeOptions {
  // Hier können weitere globale Zustände und Funktionen hinzugefügt werden
}

// Der Application Context
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props für den AppProvider
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * Provider-Komponente für den Application Context
 * Stellt alle globalen Zustände und Funktionen zur Verfügung
 */
export function AppProvider({ children }: AppProviderProps) {
  // Verwende den Theme-Hook für Dark/Light Mode
  const themeOptions = useTheme();

  // Der Context-Wert enthält alle globalen Zustände und Funktionen
  const contextValue: AppContextType = {
    ...themeOptions,
    // Hier können weitere globale Zustände und Funktionen hinzugefügt werden
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook für den Zugriff auf den Application Context
 * Stellt alle globalen Zustände und Funktionen zur Verfügung
 * 
 * @throws Error wenn der Hook außerhalb eines AppProvider verwendet wird
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext muss innerhalb eines AppProvider verwendet werden');
  }
  
  return context;
}

export default AppContext; 