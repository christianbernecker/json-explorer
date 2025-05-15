import { TCString, GVL, TCModel, IntMap } from '@iabtechlabtcf/core';

// --- GVL Loading and Caching Logic (integriert aus gvl-loader.ts) ---
// Direkte URLs für den Zugriff auf die GVL
const GVL_PRIMARY_URL = '/vendor-list.json'; // Lokale Fallback-Datei in public/ zuerst versuchen
const GVL_FALLBACK_URL = '/api/gvl'; // Unsere eigene API-Route als Fallback
const LOCAL_GVL_URL = 'https://cmp.cdn-origin.cloudfront.net/vendor-list.json'; // Externer Fallback als letzte Option

const GVL_CACHE_KEY = 'tcf_service_gvl_cache'; // Eigener Cache Key für den Service
const GVL_CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 Tage Cache-Dauer, da eine Woche alte GVL ausreichend ist

let gvlInstance: GVL | null = null;
let gvlLoadingPromise: Promise<GVL> | null = null;

function isCacheValid(cache: { timestamp: number; data: any }) {
  return cache && cache.timestamp && cache.data && (Date.now() - cache.timestamp < GVL_CACHE_TTL);
}

export function clearTcfServiceGVLCache(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(GVL_CACHE_KEY);
    gvlInstance = null; 
    console.log('TCF Service GVL cache cleared.');
  }
}

async function fetchGvlJson(url: string): Promise<any> {
  console.log(`Fetching GVL JSON from ${url}...`);
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch GVL from ${url}. Status: ${response.status}`);
  }
  console.log(`GVL JSON from ${url} loaded successfully.`);
  return response.json();
}

async function fetchAndInstantiateGVL(): Promise<GVL> {
  const urlsToTry = [GVL_PRIMARY_URL, GVL_FALLBACK_URL, LOCAL_GVL_URL];
  let lastError: any = null;

  for (const url of urlsToTry) {
    try {
      console.log(`Attempting to load GVL JSON from ${url}...`);
      const gvlJsonData = await fetchGvlJson(url);
      
      // Verifiziere, dass wir eine Vendor List Version 3 haben
      if (gvlJsonData.gvlSpecificationVersion !== 3) {
        console.warn(`Warning: GVL from ${url} has specification version ${gvlJsonData.gvlSpecificationVersion}, expected version 3.`);
      }
      
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
           localStorage.setItem(GVL_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: gvlJsonData }));
           console.log(`GVL JSON from ${url} cached in localStorage.`);
        } catch (cacheError) {
           console.error('Failed to cache GVL JSON in localStorage:', cacheError);
        }
      }
      
      console.log(`GVL JSON loaded successfully from ${url}. Instantiating GVL...`);
      // Die GVL-Klasse aus @iabtcf/core wird mit dem rohen JSON-Objekt instanziiert
      return new GVL(gvlJsonData);
    } catch (error) {
      console.warn(`Failed to load and instantiate GVL from ${url}:`, error);
      lastError = error;
    }
  }

  console.error('Error loading GVL (all remote attempts failed):', lastError);
  throw new Error('Global Vendor List could not be loaded from remote sources.');
}

export async function loadAndCacheGVL(): Promise<GVL> {
  if (gvlInstance) {
    console.log('Returning cached GVL instance (in-memory).');
    return gvlInstance;
  }
  if (gvlLoadingPromise) {
    console.log('Waiting for ongoing GVL loading promise...');
    return gvlLoadingPromise;
  }

  gvlLoadingPromise = new Promise(async (resolve, reject) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheRaw = localStorage.getItem(GVL_CACHE_KEY);
      if (cacheRaw) {
        try {
          const cache = JSON.parse(cacheRaw);
          if (isCacheValid(cache)) {
            console.log('GVL found in localStorage cache. Instantiating GVL from cached data.');
            gvlInstance = new GVL(cache.data); 
            resolve(gvlInstance);
            gvlLoadingPromise = null;
            return;
          }
        } catch (e) {
          console.error('LocalStorage cache could not be read or parsed:', e);
          localStorage.removeItem(GVL_CACHE_KEY);
        }
      }
    }

    console.log('No valid GVL cache found, fetching from network...');
    try {
      gvlInstance = await fetchAndInstantiateGVL();
      resolve(gvlInstance);
    } catch (error) {
      console.error('GVL loading failed permanently after checking cache and network.', error);
      reject(error);
    } finally {
       gvlLoadingPromise = null;
    }
  });

  return gvlLoadingPromise;
}
// --- Ende GVL Loading --- 

// Debug-Funktion für TCF Werte
function debugTCFValues(tcModel: TCModel) {
  console.log('======= TCF DEBUG INFO =======');
  console.log('TCF Version:', tcModel.version);
  
  // Globale Arrays von Purpose IDs extrahieren
  const purposeConsents: number[] = [];
  const purposeLI: number[] = [];
  
  // @ts-ignore - Ignoriere Typescript-Fehler für Debug-Zwecke
  tcModel.purposeConsents.forEach((value: boolean, key: number) => {
    if (value) purposeConsents.push(key);
  });
  
  // @ts-ignore - Ignoriere Typescript-Fehler für Debug-Zwecke
  tcModel.purposeLegitimateInterests.forEach((value: boolean, key: number) => {
    if (value) purposeLI.push(key);
  });
  
  console.log('Global Purpose Consents:', purposeConsents);
  console.log('Global Purpose LI:', purposeLI);
  
  // Alle Vendoren prüfen
  console.log('Vendor Consents:');
  for (let i = 1; i <= 1000; i++) {
    if (tcModel.vendorConsents.has(i)) {
      console.log(`- Vendor ${i}`);
    }
  }
  
  console.log('Vendor LI:');
  for (let i = 1; i <= 1000; i++) {
    if (tcModel.vendorLegitimateInterests.has(i)) {
      console.log(`- Vendor ${i}`);
    }
  }
  
  // Spezifische Key-Vendoren prüfen
  const keyVendors = [136, 137, 44];
  keyVendors.forEach(vendorId => {
    console.log(`\nVendor ${vendorId} Details:`);
    console.log(`- In Vendor Consents: ${tcModel.vendorConsents.has(vendorId)}`);
    console.log(`- In Vendor LI: ${tcModel.vendorLegitimateInterests.has(vendorId)}`);
    
    // GVL-Vendor-Infos, falls verfügbar
    if (tcModel.gvl?.vendors[vendorId]) {
      const gvlVendor = tcModel.gvl.vendors[vendorId];
      console.log(`- GVL Name: ${gvlVendor.name}`);
      console.log(`- Purposes:`, gvlVendor.purposes);
      console.log(`- LI Purposes:`, gvlVendor.legIntPurposes);
    } else {
      console.log('- No GVL info available');
    }
  });
  
  console.log('============================');
}

/**
 * Dekodiert einen TCF-String streng nach IAB-Bibliothek.
 * Lädt die GVL-Daten und verknüpft sie explizit mit dem TCModel.
 * 
 * @param tcString Der zu dekodierende TCF-String.
 * @returns Ein Objekt mit dem dekodierten TCModel oder einem Fehler.
 */
export async function decodeTCStringStrict(tcString: string): Promise<{ tcModel: TCModel | null; error: string | null }> {
  try {
    // Zuerst laden wir die GVL
    try {
      await loadAndCacheGVL();
      console.log('GVL successfully loaded for TCF decoding');
    } catch (err) {
      console.error('Failed to load GVL for TCF decoding:', err);
      // Wir fahren trotzdem fort, auch wenn die GVL nicht geladen werden konnte
    }

    // Dekodiere den TCF-String
    const tcModel = TCString.decode(tcString);

    if (!tcModel) {
      return { tcModel: null, error: 'TCString.decode returned no model (string might be invalid).' };
    }

    // Verknüpfe die GVL manuell mit dem TCModel, wenn sie geladen wurde
    if (gvlInstance) {
      console.log('Manually attaching GVL to TCModel');
      tcModel.gvl = gvlInstance;
      
      // Versuche, die Vendor-Informationen zu laden (wichtig für die korrekte Anzeige)
      try {
        // Erzwinge die Verarbeitung der GVL und der Vendor-Informationen
        await tcModel.gvl.readyPromise;
        console.log('GVL ready promise resolved, vendors should be available');
      } catch (gvlReadyError) {
        console.error('Error while waiting for GVL ready promise:', gvlReadyError);
      }
    } else {
      console.warn('TCModel was decoded, but no GVL instance was available to attach.');
    }

    // Debug-Ausgaben zur Fehleranalyse
    console.log('TCF String decoded, version:', tcModel.version);
    debugTCFValues(tcModel);

    return { tcModel, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown decoding error.';
    console.error('Error in decodeTCStringStrict:', errorMessage);
    return { tcModel: null, error: errorMessage };
  }
}

function intMapToIdsArray(intMap: IntMap<boolean> | undefined): number[] {
  if (!intMap) return [];
  const keys: number[] = [];
  // @ts-ignore - Library type definition or TS inference for IntMap.forEach seems problematic
  (intMap as IntMap<boolean>).forEach((_value: boolean, key: number) => {
    keys.push(key);
  });
  return keys.sort((a, b) => a - b); 
}

// vectorToIdsArray wird vorerst nicht mehr direkt in getVendorDetails benötigt
// function vectorToIdsArray(vector: Vector | undefined): number[] {
//   if (!vector) return [];
//   return Array.from(vector).map(Number); 
// }

interface ProcessedVendorInfo {
  id: number;
  name: string;
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  policyUrl?: string;
  purposesConsent: number[]; 
  purposesLI: number[];      
  specialFeaturesOptIn: number[];
}

function getVendorDetails(vendorId: number, tcModel: TCModel): ProcessedVendorInfo {
  // Prüfen, ob der Vendor in der GVL vorhanden ist
  const vendorFromGVL = tcModel.gvl?.vendors?.[vendorId] || null;
  const vendorName = vendorFromGVL?.name || `Vendor ID ${vendorId}`;
  
  // Generiere Listen der Purpose IDs
  // @ts-ignore - Typprobleme behandeln wir explizit im intMapToIdsArray
  const purposesConsent = intMapToIdsArray(tcModel.purposeConsents);
  // @ts-ignore - Typprobleme behandeln wir explizit im intMapToIdsArray
  const purposesLI = intMapToIdsArray(tcModel.purposeLegitimateInterests);
  
  // Überprüfe den Consent-Status
  const hasConsent = tcModel.vendorConsents.has(vendorId);
  
  // Ermittle den LI-Status basierend auf zwei Kriterien:
  // 1. Ist der Vendor in der vendorLegitimateInterests Map?
  const isInLIList = tcModel.vendorLegitimateInterests.has(vendorId);
  
  // 2. Hat der Vendor mindestens einen aktiven LI-Purpose in der GVL?
  let hasActiveLIPurpose = false;
  const vendorLIPurposes: number[] = vendorFromGVL?.legIntPurposes || [];
  
  // Prüfe, ob mindestens ein LI-Purpose des Vendors auch in den globalen LI-Purposes aktiv ist
  for (const liPurpose of vendorLIPurposes) {
    if (purposesLI.includes(liPurpose)) {
      hasActiveLIPurpose = true;
      break;
    }
  }
  
  // Kombinierte LI-Logik - INTERPRETATION KANN HIER ANGEPASST WERDEN:
  // Ein Vendor hat LI, wenn er in der vendorLegitimateInterests UND mindestens ein LI-Purpose aktiv ist
  // ODER: Ein Vendor hat LI, wenn mindestens ein LI-Purpose aktiv ist (unabhängig von vendorLegitimateInterests)
  
  // OPTION 1: Strenge Interpretation (beide Bedingungen müssen erfüllt sein)
  // const hasLegitimateInterest = isInLIList && hasActiveLIPurpose;
  
  // OPTION 2: Weniger strenge Interpretation (nur LI-Purposes sind entscheidend)
  const hasLegitimateInterest = hasActiveLIPurpose;
  
  // Debug-Ausgabe für wichtige Vendor-IDs
  if ([136, 137, 44].includes(vendorId)) {
    console.log(`Vendor ${vendorId} (${vendorName}) LI Details:`, {
      isInLIList,
      hasActiveLIPurpose,
      vendorLIPurposes,
      activeLIPurposes: vendorLIPurposes.filter(p => purposesLI.includes(p)),
      finalLIStatus: hasLegitimateInterest
    });
  }

  // Spezifische Purpose-Listen für diesen Vendor (Schnittmenge aus globalen und Vendor-Purposes)
  const vendorPurposes = vendorFromGVL?.purposes || [];
  const vendorPurposesLI = vendorFromGVL?.legIntPurposes || [];
  const vendorSpecialFeatures = vendorFromGVL?.specialFeatures || [];
  
  // Berechne die aktivierten Purposes für diesen Vendor (Schnittmenge)
  const activeVendorPurposesConsent = purposesConsent.filter(p => vendorPurposes.includes(p));
  const activeVendorPurposesLI = purposesLI.filter(p => vendorPurposesLI.includes(p));
  // @ts-ignore - Typprobleme behandeln wir explizit im intMapToIdsArray
  const activeSpecialFeatures = intMapToIdsArray(tcModel.specialFeatureOptins)
    .filter(sf => vendorSpecialFeatures.includes(sf));
  
  return {
    id: vendorId,
    name: vendorName,
    hasConsent,
    hasLegitimateInterest,
    policyUrl: vendorFromGVL?.policyUrl,
    purposesConsent: activeVendorPurposesConsent,
    purposesLI: activeVendorPurposesLI,
    specialFeaturesOptIn: activeSpecialFeatures
  };
}

export interface ProcessedTCData {
  version: number; // Sollte immer eine Nummer sein
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
  rawTCModel?: TCModel; 
  gvlStatus: 'loaded' | 'not_loaded' | 'error_loading';
}

/**
 * Bereitet die rohen TC-Modelldaten für die UI auf.
 * Diese Funktion wird das tcModel entgegennehmen und in eine Struktur umwandeln,
 * die von TCFDecoder.tsx leicht konsumiert werden kann.
 * 
 * @param tcModel Das rohe TCModel von TCString.decode().
 * @returns Aufbereitete Daten für die UI.
 */
export function getProcessedTCData(tcModel: TCModel | null): ProcessedTCData | null {
  if (!tcModel) {
    return null;
  }

  const gvlStatus = tcModel.gvl ? 'loaded' : 'not_loaded';

  const keyVendorIds = [136, 137, 44]; 
  const keyVendorResults: ProcessedVendorInfo[] = [];
  if (tcModel.gvl) { 
      keyVendorIds.forEach(id => {
          keyVendorResults.push(getVendorDetails(id, tcModel));
      });
  } else {
      keyVendorIds.forEach(id => {
          // Wenn keine GVL verfügbar ist, können wir die spezifischen Purposes nicht bestimmen
          // Wir verwenden direkt das vendorLegitimateInterests-Flag aus dem TCModel
          const hasVendorLIFlag = tcModel.vendorLegitimateInterests.has(id);
          
          keyVendorResults.push({
              id,
              name: `Vendor ${id} (GVL not loaded)`,
              hasConsent: tcModel.vendorConsents.has(id),
              // Ohne GVL können wir die Purposes nicht prüfen, verlassen uns nur auf das Flag
              hasLegitimateInterest: hasVendorLIFlag,
              purposesConsent: [],
              purposesLI: [],
              specialFeaturesOptIn: []
          });
      });
  }

  const processedData: ProcessedTCData = {
    version: Number(tcModel.version), 
    created: tcModel.created?.toISOString(),
    lastUpdated: tcModel.lastUpdated?.toISOString(),
    cmpId: tcModel.cmpId,
    cmpVersion: tcModel.cmpVersion,
    consentScreen: tcModel.consentScreen,
    consentLanguage: tcModel.consentLanguage.toUpperCase(),
    vendorListVersion: tcModel.vendorListVersion,
    policyVersion: tcModel.policyVersion,
    isServiceSpecific: tcModel.isServiceSpecific,
    useNonStandardTexts: tcModel.useNonStandardTexts,
    purposeOneTreatment: tcModel.purposeOneTreatment,
    publisherCountryCode: tcModel.publisherCountryCode.toUpperCase(),
    supportsOOB: tcModel.supportOOB,

    // Re-aktiviert nach Isolation des Linter-Fehlers
    // @ts-ignore - Library type definition or TS inference seems problematic here
    globalPurposeConsents: intMapToIdsArray(tcModel.purposeConsents),
    // @ts-ignore - Library type definition or TS inference seems problematic here
    globalPurposeLegitimateInterests: intMapToIdsArray(tcModel.purposeLegitimateInterests),
    // @ts-ignore - Library type definition or TS inference seems problematic here
    globalSpecialFeatureOptIns: intMapToIdsArray(tcModel.specialFeatureOptins),

    keyVendorResults,
    rawTCModel: tcModel, 
    gvlStatus,
  };
  
  console.log('Processed data for UI in tcfService:', processedData);
  return processedData;
}

// Weitere Hilfsfunktionen können hier bei Bedarf hinzugefügt werden. 