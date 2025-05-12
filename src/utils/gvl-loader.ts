const GVL_URL = 'https://vendor-list.consensu.org/v2/vendor-list.json';
const GVL_URL_FALLBACK = 'https://cmp.cdn-origin.cloudfront.net/vendor-list.json';
const GVL_LOCAL_FALLBACK = '/vendor-list.json'; // Lokaler Fallback für CORS-Probleme
const GVL_CACHE_KEY = 'iab_gvl_cache';
const GVL_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 Stunden

export interface GVLVendor {
  id: number;
  name: string;
  purposes: number[];
  legIntPurposes: number[];
  flexiblePurposes: number[];
  specialPurposes: number[];
  features: number[];
  specialFeatures: number[];
  policyUrl: string;
  deletedDate?: string;
  [key: string]: any;
}

export interface GVLData {
  gvlSpecificationVersion: number;
  vendorListVersion: number;
  tcfPolicyVersion: number;
  lastUpdated: string;
  vendors: { [id: string]: GVLVendor };
  purposes: { [id: string]: any };
  specialPurposes: { [id: string]: any };
  features: { [id: string]: any };
  specialFeatures: { [id: string]: any };
  [key: string]: any;
}

function isCacheValid(cache: { timestamp: number }) {
  return cache && cache.timestamp && (Date.now() - cache.timestamp < GVL_CACHE_TTL);
}

export async function loadGVL(): Promise<GVLData> {
  console.log('Lade Global Vendor List...');
  
  // Prüfe LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const cacheRaw = localStorage.getItem(GVL_CACHE_KEY);
    if (cacheRaw) {
      try {
        const cache = JSON.parse(cacheRaw);
        if (isCacheValid(cache)) {
          console.log('GVL aus Cache geladen.');
          return cache.data;
        }
      } catch (e) {
        console.error('Cache konnte nicht gelesen werden:', e);
      }
    }
  }
  
  // Hole von IAB
  try {
    console.log('Versuche GVL von primärem Endpunkt zu laden...');
    const resp = await fetch(GVL_URL, { 
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      // Cache speichern
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }
      console.log('GVL erfolgreich geladen.');
      return data;
    }
    throw new Error(`Primärer GVL-Endpunkt nicht erreichbar (Status: ${resp.status})`);
  } catch (error) {
    console.warn('Primärer GVL-Endpunkt nicht erreichbar:', error);
    
    // Fallback verwenden
    try {
      console.log('Versuche GVL von Fallback-Endpunkt zu laden...');
      const fallbackResp = await fetch(GVL_URL_FALLBACK, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!fallbackResp.ok) {
        throw new Error(`Fallback GVL-Endpunkt nicht erreichbar (Status: ${fallbackResp.status})`);
      }
      const data = await fallbackResp.json();
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }
      console.log('GVL erfolgreich vom Fallback geladen.');
      return data;
    } catch (fallbackError) {
      console.warn('Fallback GVL-Endpunkt nicht erreichbar:', fallbackError);
      
      // Lokaler Fallback als letzte Option
      try {
        console.log('Versuche GVL von lokalem Fallback zu laden...');
        const localFallbackResp = await fetch(GVL_LOCAL_FALLBACK);
        if (!localFallbackResp.ok) {
          throw new Error(`Lokaler Fallback nicht erreichbar (Status: ${localFallbackResp.status})`);
        }
        const data = await localFallbackResp.json();
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
        }
        console.log('GVL erfolgreich vom lokalen Fallback geladen.');
        return data;
      } catch (localFallbackError) {
        console.error('Fehler beim Laden der GVL (alle Versuche fehlgeschlagen):', localFallbackError);
        throw new Error('Global Vendor List konnte nicht geladen werden. Bitte versuchen Sie es später erneut.');
      }
    }
  }
}

export function getVendors(gvl: GVLData): GVLVendor[] {
  return Object.values(gvl.vendors).sort((a, b) => a.id - b.id);
}

export function getVendorById(gvl: GVLData, id: number): GVLVendor | undefined {
  return gvl.vendors[id.toString()];
} 