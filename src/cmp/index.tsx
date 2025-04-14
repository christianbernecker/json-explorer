import React, { useEffect } from 'react';
import klaroConfig from './config';
import { show, initialize, getManager, consent } from 'klaro/dist/klaro';
import { TCF_PURPOSES } from './config';
import './styles.css';

/**
 * Interface for the TCF API on window
 */
interface TCFApiInterface {
  addEventListener: (event: string, callback: (tcData: any, success: boolean) => void) => void;
  removeEventListener: (event: string, callback: (tcData: any, success: boolean) => void) => void;
  getTCData: (callback: (tcData: any, success: boolean) => void, vendorIds?: number[]) => void;
}

declare global {
  interface Window {
    __tcfapi?: TCFApiInterface;
    klaro?: any;
  }
}

/**
 * Check if a service has consent
 */
export const hasConsent = (serviceName: string): boolean => {
  if (typeof window === 'undefined' || !window.klaro) {
    return false;
  }
  const manager = getManager();
  return manager?.getConsent(serviceName) || false;
};

/**
 * Get TCF purpose consent status
 */
export const hasPurposeConsent = (purposeId: number): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.__tcfapi) {
      resolve(false);
      return;
    }

    window.__tcfapi?.getTCData((tcData, success) => {
      if (!success || !tcData.purpose?.consents) {
        resolve(false);
        return;
      }
      resolve(!!tcData.purpose.consents[purposeId]);
    });
  });
};

/**
 * Initialize the CMP
 */
export const initCMP = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Initialisiere Klaro mit der korrekten Funktion
    initialize(klaroConfig);
    
    // Mache Klaro global verfügbar
    window.klaro = {
      show: show,
      initialize: initialize,
      getManager: getManager,
      consent: consent
    };
    
    // Zeige den Consent-Manager, wenn noch keine Einwilligung gegeben wurde
    const manager = getManager();
    const consentGiven = manager?.confirmed;
    if (!consentGiven) {
      setTimeout(() => {
        show(klaroConfig);
      }, 800);
    }

    // Make TCF API available globally
    if (klaroConfig.tcf2?.enabled && !window.__tcfapi) {
      // This would be a simplified version, in a real implementation additional TCF API methods would be needed
      window.__tcfapi = {
        addEventListener: (event, callback) => {
          // Implementation needed for addEventListener
        },
        removeEventListener: (event, callback) => {
          // Implementation needed for removeEventListener
        },
        getTCData: (callback, vendorIds) => {
          // Basic implementation to provide TCF data
          const manager = getManager();
          const allConsents = manager?.consents || {};
          const purposeConsents: Record<number, boolean> = {};
          
          // Map service consents to purpose consents
          Object.keys(TCF_PURPOSES).forEach((purpose) => {
            const purposeId = TCF_PURPOSES[purpose as keyof typeof TCF_PURPOSES];
            purposeConsents[purposeId] = false;
            
            // Check if any service with this purpose has consent
            klaroConfig.services?.forEach((service) => {
              if (service.purposes.includes(purposeId) && manager?.getConsent(service.name)) {
                purposeConsents[purposeId] = true;
              }
            });
          });
          
          callback({
            tcString: "dummy-tcf-string", // In a real implementation, this would be a properly encoded TCF string
            gdprApplies: true,
            purpose: {
              consents: purposeConsents
            },
            vendor: {
              consents: {} // In a real implementation, this would contain vendor consents
            }
          }, true);
        }
      };
    }
  } catch (e) {
    console.error('Failed to initialize CMP:', e);
  }
};

/**
 * React component to render the CMP
 */
export const ConsentManager: React.FC = () => {
  useEffect(() => {
    // Verzögere die Initialisierung um sicherzustellen, dass das DOM bereit ist
    setTimeout(() => {
      try {
        initCMP();
      } catch (e) {
        console.error('Error initializing CMP in component:', e);
      }
    }, 500);
  }, []);

  return (
    <div id="json-explorer-cmp"></div>
  );
};

/**
 * Open the consent manager
 */
export const openConsentManager = (): void => {
  if (typeof window !== 'undefined') {
    try {
      show(klaroConfig);
    } catch (e) {
      console.error('Failed to show consent manager:', e);
    }
  }
};

export default ConsentManager; 