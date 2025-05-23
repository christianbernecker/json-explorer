export interface DataRow {
  [key: string]: any;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface AggregatedData {
  [key: string]: {
    [key: string]: number;
  };
}

export interface ColumnTypes {
  dimensions: string[];
  metrics: string[];
}

// ****** TCF/GVL Typen ******

/**
 * History Item Interface für History Service
 */
export interface HistoryItem {
  id: string;
  type: 'tcf' | 'json' | 'vast';
  content: string;
  timestamp: number;
}

/**
 * Basisstruktur für einen TCF-Vendor aus der GVL
 */
export interface GVLVendor {
  id: number;
  name: string;
  policyUrl?: string;
  deletedDate?: string;
  purposes?: Record<string, {
    id?: number;
    name?: string;
    description?: string;
  }>;
  legIntPurposes?: Record<string, {
    id?: number;
    name?: string;
    description?: string;
  }>;
  specialPurposes?: Record<string, {
    id?: number;
    name?: string;
    description?: string;
  }>;
  features?: Record<string, {
    id?: number;
    name?: string;
    description?: string;
  }>;
  specialFeatures?: Record<string, {
    id?: number;
    name?: string;
    description?: string;
  }>;
  usesCookies?: boolean;
  cookieMaxAgeSeconds?: number;
  deviceStorageDisclosureUrl?: string;
}

/**
 * Interface für Vendor-Informationen nach Verarbeitung des TCF-Strings
 */
export interface ProcessedVendorInfo {
  id: number;
  name: string;
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  policyUrl?: string;
  purposesConsent: number[]; 
  purposesLI: number[];      
  specialFeaturesOptIn: number[];
  features: number[];
  specialPurposes: number[];
  gvlVendor?: GVLVendor;
  debugInfo: any;
  publisherRestrictions?: {
    purposeId: number;
    restrictionType: number;
  }[];
  isFullyRestricted?: boolean;
  
  // GVL-spezifische Eigenschaften, die aus dem GVL-Vendor kopiert werden können
  deletedDate?: string;
  usesCookies?: boolean;
  cookieMaxAgeSeconds?: number;
  deviceStorageDisclosureUrl?: string;
  
  // GVL-spezifische Strukturierte Eigenschaften
  purposes?: Record<string, any>; // Die strukturierten Purposes aus der GVL
  legIntPurposes?: Record<string, any>;
  specialFeatures?: Record<string, any>;
}

/**
 * Interface für die verarbeiteten TCF-Daten für die UI-Anzeige
 */
export interface ProcessedTCData {
  version: number;
  created?: string;
  lastUpdated?: string;
  cmpId?: string | number;
  cmpVersion?: string | number;
  consentScreen?: string | number;
  consentLanguage?: string;
  vendorListVersion?: string | number;
  policyVersion?: string | number;
  isServiceSpecific?: boolean;
  useNonStandardTexts?: boolean;
  purposeOneTreatment?: boolean;
  publisherCountryCode?: string;
  supportsOOB?: boolean;

  globalPurposeConsents: number[];
  globalPurposeLegitimateInterests: number[];
  globalSpecialFeatureOptIns: number[];

  keyVendorResults: ProcessedVendorInfo[];
  gvlStatus: 'loaded' | 'not_loaded' | 'error_loading';
}

/**
 * Interface für die Darstellung von Vendor-Zwecken in der UI
 */
export interface CombinedPurposesData {
  purposes: Array<{id: number, name: string, consent: boolean, li: boolean}>;
  specialPurposes: Array<{id: number, name: string}>;
  features: Array<{id: number, name: string}>;
  specialFeatures: Array<{id: number, name: string, consent: boolean}>;
} 