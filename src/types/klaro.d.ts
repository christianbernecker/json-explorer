declare module 'klaro' {
  export interface KlaroTranslation {
    [key: string]: any;
  }

  export interface KlaroService {
    name: string;
    title: string;
    purposes: any[];
    callback?: (consent: boolean, service: KlaroService) => void;
    cookies?: (RegExp | string)[];
    default?: boolean;
    contextualConsentOnly?: boolean;
    required?: boolean;
    optOut?: boolean;
    onlyOnce?: boolean;
  }

  export interface KlaroStyling {
    theme?: string[];
    additionalClass?: string;
  }

  export interface KlaroTCF2Config {
    enabled: boolean;
    scope?: string;
    contextualConsentOnly?: boolean;
    defaultConsents?: {
      purposes?: Record<number, boolean>;
      specialFeatures?: Record<number, boolean>;
    };
    cmpId?: number;
    cmpVersion?: number;
    vendorListUpdateFrequency?: number;
    publisherCountryCode?: string;
    purposeOneTreatment?: boolean;
    publisherConsentScope?: string;
    vendorList?: string;
  }

  export interface KlaroConfig {
    testing?: boolean;
    elementID?: string;
    storageMethod?: 'localStorage' | 'cookie';
    storageName?: string;
    htmlTexts?: boolean;
    embedded?: boolean;
    groupByPurpose?: boolean;
    tokenExpiration?: number;
    cookieExpiresAfterDays?: number;
    styling?: KlaroStyling;
    tcf2?: KlaroTCF2Config;
    services?: KlaroService[];
    translations?: {
      [lang: string]: KlaroTranslation;
    };
    privacyPolicy?: {
      default?: string;
      [lang: string]?: string;
    };
    additionalClass?: string;
    cookieDomain?: string;
    cookiePath?: string;
    hideDeclineAll?: boolean;
    hideLearnMore?: boolean;
    noticeAsModal?: boolean;
    acceptAll?: boolean;
    hideToggleAll?: boolean;
  }

  export const render: (config: KlaroConfig, opts?: any) => void;
  export const show: (config: KlaroConfig, opts?: any) => void;
  export const initialize: (config: KlaroConfig, opts?: any) => void;
  export const getManager: () => any;
  export interface ConsentAPI {
    get: (service: string) => boolean;
    getAll: () => Record<string, boolean>;
    onChange: (callback: (consent: Record<string, boolean>) => void) => void;
  }
  export const consent: ConsentAPI;
} 