import { KlaroConfig } from 'klaro';

/**
 * TCF 2.0 Consent Categories based on IAB Europe Transparency & Consent Framework
 */
export const TCF_PURPOSES = {
  // Core TCF Purposes
  STORE_INFO: 1, // Store and/or access information on a device
  BASIC_ADS: 2, // Select basic ads
  PERSONALIZED_ADS: 3, // Create a personalised ads profile
  SELECT_PERSONALIZED_ADS: 4, // Select personalised ads
  PERSONALIZED_CONTENT: 5, // Create a personalised content profile
  SELECT_PERSONALIZED_CONTENT: 6, // Select personalised content
  AD_PERFORMANCE: 7, // Measure ad performance
  CONTENT_PERFORMANCE: 8, // Measure content performance
  MARKET_RESEARCH: 9, // Apply market research to generate audience insights
  PRODUCT_DEVELOPMENT: 10, // Develop and improve products
  
  // Special Purposes (Legitimate Interest only)
  ENSURE_SECURITY: 11, // Use data to ensure security, prevent fraud, and debug
  TECHNICAL_DELIVERY: 12, // Use technical data to deliver ads or content
};

/**
 * Special Features that require opt-in consent
 */
export const SPECIAL_FEATURES = {
  PRECISE_GEO: 1, // Use precise geolocation data
  DEVICE_CHARACTERISTICS: 2, // Actively scan device characteristics for identification
};

/**
 * Default Klaro configuration with TCF 2.0 support
 */
export const klaroConfig: KlaroConfig = {
  // General settings
  testing: process.env.NODE_ENV !== 'production',
  elementID: 'json-explorer-cmp',
  storageMethod: 'localStorage',
  storageName: 'json-explorer-consent',
  htmlTexts: true,
  embedded: false,
  groupByPurpose: true,
  tokenExpiration: 365, // in days
  cookieExpiresAfterDays: 365,
  
  // Custom styling (matching app theme)
  styling: {
    theme: ['light', 'top', 'wide'],
    additionalClass: 'json-explorer-cmp-modal',
  },
  
  // TCF 2.0 Integration
  tcf2: {
    enabled: true,
    scope: 'service', // Configure scope properly for TCF 2.0
    contextualConsentOnly: false,
    defaultConsents: {
      purposes: {
        [TCF_PURPOSES.STORE_INFO]: true, // Essential functionality
        [TCF_PURPOSES.BASIC_ADS]: true,
        [TCF_PURPOSES.PERSONALIZED_ADS]: false,
        [TCF_PURPOSES.SELECT_PERSONALIZED_ADS]: false,
        [TCF_PURPOSES.PERSONALIZED_CONTENT]: false,
        [TCF_PURPOSES.SELECT_PERSONALIZED_CONTENT]: false,
        [TCF_PURPOSES.AD_PERFORMANCE]: false,
        [TCF_PURPOSES.CONTENT_PERFORMANCE]: false,
        [TCF_PURPOSES.MARKET_RESEARCH]: false,
        [TCF_PURPOSES.PRODUCT_DEVELOPMENT]: false,
        [TCF_PURPOSES.ENSURE_SECURITY]: true,
        [TCF_PURPOSES.TECHNICAL_DELIVERY]: true,
      },
      specialFeatures: {
        [SPECIAL_FEATURES.PRECISE_GEO]: false,
        [SPECIAL_FEATURES.DEVICE_CHARACTERISTICS]: false,
      },
    },
    // IAB CMP Configuration
    cmpId: 123, // Replace with your IAB registered CMP ID
    cmpVersion: 1,
    vendorListUpdateFrequency: 7, // days between refreshing vendor list
    publisherCountryCode: 'DE',
    purposeOneTreatment: false,
    publisherConsentScope: 'service',
    vendorList: 'https://vendor-list.consensu.org/v2/vendor-list.json',
  },
  
  // Services configuration
  services: [
    {
      name: 'analytics',
      title: 'Google Analytics',
      purposes: [
        TCF_PURPOSES.STORE_INFO,
        TCF_PURPOSES.AD_PERFORMANCE,
        TCF_PURPOSES.CONTENT_PERFORMANCE,
        TCF_PURPOSES.MARKET_RESEARCH
      ],
      cookies: [
        /^_ga/,
        /^_gid/,
        /^_gat/
      ],
      required: false,
      default: false,
      optOut: false,
      onlyOnce: true,
    },
    {
      name: 'googleads',
      title: 'Google Ads',
      purposes: [
        TCF_PURPOSES.STORE_INFO, 
        TCF_PURPOSES.BASIC_ADS,
        TCF_PURPOSES.PERSONALIZED_ADS, 
        TCF_PURPOSES.SELECT_PERSONALIZED_ADS,
        TCF_PURPOSES.AD_PERFORMANCE
      ],
      cookies: [
        /^IDE/,
        /^test_cookie/,
        /^conversion/,
        /^rcid$/,
        /^VISITOR_INFO1_LIVE$/
      ],
      required: false,
      default: false,
      optOut: false,
      onlyOnce: false,
    }
  ],
  
  // Translation texts for UI elements
  translations: {
    en: {
      acceptAll: 'Accept all',
      acceptSelected: 'Accept selected',
      service: {
        disableAll: {
          title: 'Enable or disable all services',
          description: 'Use this switch to enable or disable all services.',
        },
        optOut: {
          title: 'This service is loaded by default (but you can opt out)',
          description: 'This service is loaded by default but you can opt out.',
        },
        required: {
          title: 'This service is always required',
          description: 'This service is always required for the website to function and cannot be disabled.',
        },
        purposes: 'Processing purposes: ',
        purpose: 'Processing purpose: ',
      },
      purposes: {
        [TCF_PURPOSES.STORE_INFO]: 'Store information on your device',
        [TCF_PURPOSES.BASIC_ADS]: 'Select basic ads',
        [TCF_PURPOSES.PERSONALIZED_ADS]: 'Create personalized ad profile',
        [TCF_PURPOSES.SELECT_PERSONALIZED_ADS]: 'Select personalized ads',
        [TCF_PURPOSES.PERSONALIZED_CONTENT]: 'Create personalized content profile',
        [TCF_PURPOSES.SELECT_PERSONALIZED_CONTENT]: 'Select personalized content',
        [TCF_PURPOSES.AD_PERFORMANCE]: 'Measure ad performance',
        [TCF_PURPOSES.CONTENT_PERFORMANCE]: 'Measure content performance',
        [TCF_PURPOSES.MARKET_RESEARCH]: 'Market research',
        [TCF_PURPOSES.PRODUCT_DEVELOPMENT]: 'Develop and improve products',
        [TCF_PURPOSES.ENSURE_SECURITY]: 'Ensure security and prevent fraud',
        [TCF_PURPOSES.TECHNICAL_DELIVERY]: 'Technical delivery of ads or content',
      },
      specialFeatures: {
        [SPECIAL_FEATURES.PRECISE_GEO]: 'Use precise geolocation data',
        [SPECIAL_FEATURES.DEVICE_CHARACTERISTICS]: 'Actively scan device characteristics for identification',
      },
      purposeItem: {
        service: 'service',
        services: 'services',
      },
      privacyPolicy: {
        name: 'privacy policy',
        text: 'For more information, please read our {privacyPolicy}.',
      },
    },
    de: {
      acceptAll: 'Alle akzeptieren',
      acceptSelected: 'Ausgewählte akzeptieren',
      service: {
        disableAll: {
          title: 'Alle Dienste aktivieren oder deaktivieren',
          description: 'Nutzen Sie diesen Schalter, um alle Dienste zu aktivieren oder zu deaktivieren.',
        },
        optOut: {
          title: 'Dieser Dienst wird standardmäßig geladen (Sie können sich jedoch abmelden)',
          description: 'Dieser Dienst wird standardmäßig geladen, Sie können ihn aber deaktivieren.',
        },
        required: {
          title: 'Dieser Dienst wird immer benötigt',
          description: 'Dieser Dienst ist für die Funktion der Website immer erforderlich und kann nicht deaktiviert werden.',
        },
        purposes: 'Verarbeitungszwecke: ',
        purpose: 'Verarbeitungszweck: ',
      },
      purposes: {
        [TCF_PURPOSES.STORE_INFO]: 'Informationen auf Ihrem Gerät speichern',
        [TCF_PURPOSES.BASIC_ADS]: 'Einfache Anzeigen auswählen',
        [TCF_PURPOSES.PERSONALIZED_ADS]: 'Personalisiertes Anzeigenprofil erstellen',
        [TCF_PURPOSES.SELECT_PERSONALIZED_ADS]: 'Personalisierte Anzeigen auswählen',
        [TCF_PURPOSES.PERSONALIZED_CONTENT]: 'Personalisiertes Inhaltsprofil erstellen',
        [TCF_PURPOSES.SELECT_PERSONALIZED_CONTENT]: 'Personalisierte Inhalte auswählen',
        [TCF_PURPOSES.AD_PERFORMANCE]: 'Anzeigenleistung messen',
        [TCF_PURPOSES.CONTENT_PERFORMANCE]: 'Inhaltsleistung messen',
        [TCF_PURPOSES.MARKET_RESEARCH]: 'Marktforschung',
        [TCF_PURPOSES.PRODUCT_DEVELOPMENT]: 'Produkte entwickeln und verbessern',
        [TCF_PURPOSES.ENSURE_SECURITY]: 'Sicherheit gewährleisten und Betrug verhindern',
        [TCF_PURPOSES.TECHNICAL_DELIVERY]: 'Technische Bereitstellung von Anzeigen oder Inhalten',
      },
      specialFeatures: {
        [SPECIAL_FEATURES.PRECISE_GEO]: 'Genaue Standortdaten verwenden',
        [SPECIAL_FEATURES.DEVICE_CHARACTERISTICS]: 'Geräteeigenschaften zur Identifikation aktiv scannen',
      },
      purposeItem: {
        service: 'Dienst',
        services: 'Dienste',
      },
      privacyPolicy: {
        name: 'Datenschutzerklärung',
        text: 'Für weitere Informationen lesen Sie bitte unsere {privacyPolicy}.',
      },
    },
  },
};

export default klaroConfig; 