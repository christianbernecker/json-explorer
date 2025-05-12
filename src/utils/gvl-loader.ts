const GVL_URL = 'https://vendor-list.consensu.org/v3/vendor-list.json';
const GVL_URL_FALLBACK = 'https://cmp.cdn-origin.cloudfront.net/vendor-list.json';
const GVL_LOCAL_FALLBACK = '/vendor-list.json'; // Local fallback for CORS issues
const GVL_CACHE_KEY = 'iab_gvl_cache';
const GVL_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

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

// Neue Funktion zum Löschen des Caches
export function clearGVLCache(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(GVL_CACHE_KEY);
    console.log('GVL cache cleared.');
  }
}

export async function loadGVL(): Promise<GVLData> {
  console.log('Loading Global Vendor List...');
  
  // Check LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const cacheRaw = localStorage.getItem(GVL_CACHE_KEY);
    if (cacheRaw) {
      try {
        const cache = JSON.parse(cacheRaw);
        if (isCacheValid(cache)) {
          console.log('GVL loaded from cache.');
          return cache.data;
        }
      } catch (e) {
        console.error('Cache could not be read:', e);
      }
    }
  }
  
  // Fetch from IAB
  try {
    console.log('Trying to load GVL from primary endpoint...');
    const resp = await fetch(GVL_URL, { 
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (resp.ok) {
      const data = await resp.json();
      // Save cache
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }
      console.log('GVL successfully loaded.');
      return data;
    }
    throw new Error(`Primary GVL endpoint not available (Status: ${resp.status})`);
  } catch (error) {
    console.warn('Primary GVL endpoint not available:', error);
    
    // Use fallback
    try {
      console.log('Trying to load GVL from fallback endpoint...');
      const fallbackResp = await fetch(GVL_URL_FALLBACK, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!fallbackResp.ok) {
        throw new Error(`Fallback GVL endpoint not available (Status: ${fallbackResp.status})`);
      }
      const data = await fallbackResp.json();
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }
      console.log('GVL successfully loaded from fallback.');
      return data;
    } catch (fallbackError) {
      console.warn('Fallback GVL endpoint not available:', fallbackError);
      
      // Local fallback as last option
      try {
        console.log('Trying to load GVL from local fallback...');
        const localFallbackResp = await fetch(GVL_LOCAL_FALLBACK);
        if (!localFallbackResp.ok) {
          throw new Error(`Local fallback not available (Status: ${localFallbackResp.status})`);
        }
        const data = await localFallbackResp.json();
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
        }
        console.log('GVL successfully loaded from local fallback.');
        return data;
      } catch (localFallbackError) {
        console.error('Error loading GVL (all attempts failed):', localFallbackError);
        throw new Error('Global Vendor List could not be loaded. Please try again later.');
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