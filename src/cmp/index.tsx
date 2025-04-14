import React, { useEffect } from 'react';
import klaroConfig from './config';
import * as klaro from 'klaro';
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
    klaro?: typeof klaro;
  }
}

/**
 * Check if a service has consent
 */
export const hasConsent = (serviceName: string): boolean => {
  if (typeof window === 'undefined' || !window.klaro) {
    return false;
  }
  return window.klaro.consent.get(serviceName);
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

  // Add Klaro to window for external access
  window.klaro = klaro;

  // Initialize the CMP
  klaro.initialize(klaroConfig);

  // Show the consent manager if no consent was given yet
  const consentGiven = localStorage.getItem(klaroConfig.storageName || 'json-explorer-consent');
  if (!consentGiven) {
    setTimeout(() => {
      klaro.show(klaroConfig);
    }, 200);
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
        const allConsents = window.klaro?.consent.getAll() || {};
        const purposeConsents: Record<number, boolean> = {};
        
        // Map service consents to purpose consents
        Object.keys(TCF_PURPOSES).forEach((purpose) => {
          const purposeId = TCF_PURPOSES[purpose as keyof typeof TCF_PURPOSES];
          purposeConsents[purposeId] = false;
          
          // Check if any service with this purpose has consent
          klaroConfig.services?.forEach((service) => {
            if (service.purposes.includes(purposeId) && allConsents[service.name]) {
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
};

/**
 * React component to render the CMP
 */
export const ConsentManager: React.FC = () => {
  useEffect(() => {
    initCMP();
  }, []);

  return (
    <div id="json-explorer-cmp"></div>
  );
};

/**
 * Open the consent manager
 */
export const openConsentManager = (): void => {
  if (typeof window !== 'undefined' && window.klaro) {
    window.klaro.show(klaroConfig);
  }
};

export default ConsentManager; 