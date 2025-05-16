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
/* // Auskommentiert, da wir jetzt eine detailliertere Analyse direkt in decodeTCStringStrict haben
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
*/

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
    
    // DETAILLIERTE DEBUG-AUSGABEN der tatsächlichen Daten im TCF-String
    console.log('=== DETAILED TCF STRING CONTENT ANALYSIS ===');
    
    // 1. Global Purpose Consents
    console.log('GLOBAL PURPOSE CONSENTS:');
    const globalPurposeConsents: number[] = [];
    tcModel.purposeConsents.forEach((value, key) => {
      if (value) {
        globalPurposeConsents.push(key);
        console.log(`- Purpose ${key}: CONSENT`);
      }
    });
    
    // 2. Global Legitimate Interests
    console.log('GLOBAL LEGITIMATE INTERESTS:');
    const globalLegitimateInterests: number[] = [];
    tcModel.purposeLegitimateInterests.forEach((value, key) => {
      if (value) {
        globalLegitimateInterests.push(key);
        console.log(`- Purpose ${key}: LEGITIMATE INTEREST`);
      }
    });
    
    // 3. Vendor Consents - insbesondere für Key Vendors
    console.log('VENDOR CONSENTS:');
    [136, 137, 44].forEach(vendorId => {
      const hasConsent = tcModel.vendorConsents.has(vendorId);
      console.log(`- Vendor ${vendorId}: ${hasConsent ? 'HAS CONSENT' : 'NO CONSENT'}`);
    });
    
    // 4. Vendor Legitimate Interests - insbesondere für Key Vendors
    console.log('VENDOR LEGITIMATE INTERESTS:');
    [136, 137, 44].forEach(vendorId => {
      const hasLI = tcModel.vendorLegitimateInterests.has(vendorId);
      console.log(`- Vendor ${vendorId}: ${hasLI ? 'HAS LI' : 'NO LI'}`);
    });
    
    console.log('=== END TCF STRING ANALYSIS ===');
    
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

// Neue Funktion für Vector-Typen
function vectorToIdsArray(vector: any): number[] {
  if (!vector) return [];
  const result: number[] = [];
  
  try {
    // @ts-ignore - Ignoriere Typenprobleme, damit wir alle Operationen ausprobieren können
    if (typeof vector.forEach === 'function') {
      // @ts-ignore
      vector.forEach((value: boolean, key: number) => {
        if (value) result.push(key);
      });
    } else if (typeof vector[Symbol.iterator] === 'function') {
      // Falls es ein iterierbares Objekt ist
      for (const entry of vector) {
        result.push(Number(entry));
      }
    }
  } catch (error) {
    console.error('Error converting vector to array:', error);
  }
  
  return result.sort((a, b) => a - b);
}

interface ProcessedVendorInfo {
  id: number;
  name: string;
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  policyUrl?: string;
  purposesConsent: number[]; 
  purposesLI: number[];      
  specialFeaturesOptIn: number[];
  // Neue Felder für Features und Special Purposes
  features: number[];
  specialPurposes: number[];
  gvlVendor?: any;
  debugInfo: any;
  // Neue Felder für erweiterte Funktionalität
  publisherRestrictions?: {
    purposeId: number;
    restrictionType: number;
  }[];
  isFullyRestricted?: boolean;
}

function getVendorDetails(vendorId: number, tcModel: TCModel): ProcessedVendorInfo {
  // Prüfen, ob der Vendor in der GVL vorhanden ist
  const vendorFromGVL = tcModel.gvl?.vendors?.[vendorId] || null;
  const vendorName = vendorFromGVL?.name || `Vendor ID ${vendorId}`;
  
  console.log(`TCF-Decoder: Processing Vendor ${vendorId} (${vendorName})`);
  
  // DIREKTER TCF-DATEN-CHECK für diesen spezifischen Vendor 
  console.log(`\nTCF-Decoder: DIREKTER CHECK für Vendor ${vendorId} (${vendorName})`);
  console.log(`1. Consent-Bit im TCF-String: ${tcModel.vendorConsents.has(vendorId)}`);
  console.log(`2. LI-Bit im TCF-String: ${tcModel.vendorLegitimateInterests.has(vendorId)}`);

  // Zeige alle Purposes im TCF-String
  console.log("3. Alle Purpose Consents im TCF-String (global):");
  for (let i = 1; i <= 10; i++) {
    console.log(`   Purpose ${i}: ${tcModel.purposeConsents.has(i)}`);
  }
  
  console.log("4. Alle LI Purposes im TCF-String (global):");
  for (let i = 1; i <= 10; i++) {
    console.log(`   Purpose ${i}: ${tcModel.purposeLegitimateInterests.has(i)}`);
  }
  
  // Nun prüfen und ausgeben, welche Purposes dieser Vendor laut GVL unterstützt
  if (vendorFromGVL) {
    console.log(`5. Purposes, die dieser Vendor laut GVL unterstützt:`);
    console.log(`   Consent Purposes: ${JSON.stringify(vendorFromGVL.purposes || [])}`);
    console.log(`   LI Purposes: ${JSON.stringify(vendorFromGVL.legIntPurposes || [])}`);
  }
  
  // EXTREME DEBUG: Alle relevanten Daten direkt ausgeben
  console.log(`\n==== COMPLETE TCF DATA FOR VENDOR ${vendorId} (${vendorName}) ====`);
  
  // 1. Global Purpose Consents aus TCF String direkt extrahieren
  const globalPurposeConsents: number[] = [];
  if (tcModel.purposeConsents) {
    console.log('- Global Purpose Consents:');
    tcModel.purposeConsents.forEach((value, key) => {
      if (value) {
        globalPurposeConsents.push(key);
        console.log(`  Purpose ${key}: TRUE (User has given consent)`);
      } else {
        console.log(`  Purpose ${key}: FALSE (No consent)`);
      }
    });
  }
  
  // 2. Global Legitimate Interests aus TCF String direkt extrahieren
  const globalPurposesLI: number[] = [];
  if (tcModel.purposeLegitimateInterests) {
    console.log('- Global Purpose Legitimate Interests:');
    tcModel.purposeLegitimateInterests.forEach((value, key) => {
      if (value) {
        globalPurposesLI.push(key);
        console.log(`  Purpose ${key}: TRUE (Legitimate Interest)`);
      } else {
        console.log(`  Purpose ${key}: FALSE (No Legitimate Interest)`);
      }
    });
  }
  
  // 3. Vendor-spezifische Daten aus GVL
  console.log('- Vendor GVL Data:');
  if (vendorFromGVL) {
    console.log(`  Consent Purposes from GVL: [${vendorFromGVL.purposes?.join(', ') || 'none'}]`);
    console.log(`  LI Purposes from GVL: [${vendorFromGVL.legIntPurposes?.join(', ') || 'none'}]`);
  } else {
    console.log('  No GVL data available for this vendor');
  }
  
  // 4. Vendor-Bits im TCF String
  const hasConsent = tcModel.vendorConsents.has(vendorId);
  const hasLegitimateInterestBit = tcModel.vendorLegitimateInterests.has(vendorId);
  
  console.log('- Vendor Bits in TCF String:');
  console.log(`  vendorConsents[${vendorId}]: ${hasConsent ? 'TRUE' : 'FALSE'}`);
  console.log(`  vendorLegitimateInterests[${vendorId}]: ${hasLegitimateInterestBit ? 'TRUE' : 'FALSE'}`);
  
  // 5. Publisher Restrictions
  const publisherRestrictions = getPublisherRestrictionsForVendor(tcModel, vendorId);
  console.log('- Publisher Restrictions:');
  if (publisherRestrictions.length > 0) {
    publisherRestrictions.forEach(r => {
      console.log(`  Purpose ${r.purposeId}: ${getRestrictionTypeDescription(r.restrictionType)}`);
    });
  } else {
    console.log('  No publisher restrictions');
  }
  
  console.log('====================================\n');
  
  // VEREINFACHTE LOGIK: Direkte Extraktion der Purposes ohne komplexe Weiterverarbeitung
  let activeConsentPurposesForVendor: number[] = [];
  let activeLIPurposesForVendor: number[] = [];
  
  // Neue, direktere Implementierung für Consent Purposes
  if (hasConsent && vendorFromGVL) {
    const supportedPurposes = vendorFromGVL.purposes || [];
    activeConsentPurposesForVendor = [];
    
    // Prüfe jeden Purpose einzeln
    for (let i = 1; i <= 10; i++) {
      const purposeHasGlobalConsent = tcModel.purposeConsents.has(i);
      const vendorSupportsPurpose = supportedPurposes.includes(i);
      
      if (purposeHasGlobalConsent && vendorSupportsPurpose) {
        activeConsentPurposesForVendor.push(i);
      }
    }
    
    console.log(`TCF-Decoder: Vendor ${vendorId} (${vendorName}) - Neue Purpose Berechnung:`);
    console.log(`- Vendor hat grundsätzlich Consent: ${hasConsent}`);
    console.log(`- Vendor unterstützt diese Consent Purposes: ${JSON.stringify(supportedPurposes)}`);
    console.log(`- Tatsächlich aktive Consent Purposes: ${JSON.stringify(activeConsentPurposesForVendor)}`);
  } else if (hasConsent) {
    // Fallback, wenn keine GVL-Daten verfügbar sind
    // Extrahiere die globalen Purpose Consents direkt
    activeConsentPurposesForVendor = [];
    for (let i = 1; i <= 10; i++) {
      if (tcModel.purposeConsents.has(i)) {
        activeConsentPurposesForVendor.push(i);
      }
    }
    console.log(`Vendor ${vendorId} (${vendorName}) hat Consent mit Purposes: ${JSON.stringify(activeConsentPurposesForVendor)}`);
  }
  
  // Neue, direktere Implementierung für Legitimate Interest Purposes
  if (vendorFromGVL) {
    const supportedLIPurposes = vendorFromGVL.legIntPurposes || [];
    activeLIPurposesForVendor = [];
    
    // KORREKTUR 3: Leere Global LI berücksichtigen - gemäß TCF-Spec
    // Wir müssen unterscheiden zwischen "leer" (keine Angabe = implizit erlaubt)
    // und "explizit FALSE" (Benutzer hat LI aktiv abgelehnt)
    for (const purposeId of supportedLIPurposes) {
      // KORREKTUR: Neuimplementierung der LI-Logik gemäß TCF-Spezifikation
      // Nach der TCF-Spezifikation ist ein LI-Purpose erlaubt, wenn:
      // 1. Der Vendor diesen Purpose in der GVL als LI-Purpose registriert hat (bereits durch supportedLIPurposes gefiltert)
      // 2. Es im TCF-String KEINEN EXPLIZITEN OPT-OUT (false) gibt
      
      // Prüfen, ob der Purpose im TCF-String als false eingetragen ist (OPT-OUT)
      let purposeIsExplicitlyOptedOut = false;
      
      // Wir müssen hier spezifisch prüfen, ob der Wert false ist
      // In der tcModel.purposeLegitimateInterests.forEach können wir sehen, wie
      // die Werte abgefragt werden - dort werden nur Einträge mit value=true hinzugefügt
      tcModel.purposeLegitimateInterests.forEach((value, key) => {
        if (key === purposeId && value === false) {
          purposeIsExplicitlyOptedOut = true;
        }
      });

      // Wenn der Purpose NICHT explizit abgelehnt wurde, kann er verwendet werden
      if (!purposeIsExplicitlyOptedOut) {
        activeLIPurposesForVendor.push(purposeId);
        console.log(`  Purpose ${purposeId}: AKTIV (kein explizites Opt-out im TCF String)`);
      } else {
        console.log(`  Purpose ${purposeId}: INAKTIV (explizites Opt-out im TCF String)`);
      }
    }
    
    console.log(`TCF-Decoder: Vendor ${vendorId} (${vendorName}) - FINAL LI Purpose Berechnung:`);
    console.log(`- Vendor hat grundsätzlich LI-Bit: ${hasLegitimateInterestBit}`);
    console.log(`- Vendor unterstützt diese LI Purposes: ${JSON.stringify(supportedLIPurposes)}`);
    console.log(`- Tatsächlich aktive LI Purposes: ${JSON.stringify(activeLIPurposesForVendor)}`);
  } else if (hasLegitimateInterestBit) {
    // Fallback, wenn keine GVL-Daten verfügbar sind
    // Wir können nicht wissen, welche LI-Purposes der Vendor hat
    activeLIPurposesForVendor = [];
    console.log(`Vendor ${vendorId} (${vendorName}) hat LI, aber GVL fehlt - keine Purposes aktiv`);
  }
  
  // Special Features Verarbeitung
  const globalSpecialFeatures = vectorToIdsArray(tcModel.specialFeatureOptins);
  const vendorSpecialFeatures: number[] = vendorFromGVL?.specialFeatures || [];
  const activeSpecialFeaturesForVendor = vendorSpecialFeatures.filter(featureId => 
    globalSpecialFeatures.includes(featureId)
  );
  
  // Neue Verarbeitung für Features und Special Purposes
  const vendorFeatures: number[] = vendorFromGVL?.features || [];
  const vendorSpecialPurposes: number[] = vendorFromGVL?.specialPurposes || [];
  
  // End-Status: Ein Vendor hat LI, wenn er mindestens einen aktiven LI-Purpose hat
  const hasLegitimateInterest = activeLIPurposesForVendor.length > 0;
  const isFullyRestricted = isVendorFullyRestricted(tcModel, vendorId);
  
  return {
    id: vendorId,
    name: vendorName,
    hasConsent,
    hasLegitimateInterest,
    policyUrl: vendorFromGVL?.policyUrl,
    purposesConsent: activeConsentPurposesForVendor,
    purposesLI: activeLIPurposesForVendor,
    specialFeaturesOptIn: activeSpecialFeaturesForVendor,
    // Neue Felder für Features und Special Purposes
    features: vendorFeatures,
    specialPurposes: vendorSpecialPurposes,
    gvlVendor: vendorFromGVL,
    debugInfo: {
      hasConsent,
      hasLegitimateInterestBit,
      hasLegitimateInterest,
      globalPurposeConsents,
      globalPurposesLI,
      vendorConsentPurposes: vendorFromGVL?.purposes || [],
      vendorLIPurposes: vendorFromGVL?.legIntPurposes || [],
      activeConsentPurposesForVendor,
      activeLIPurposesForVendor,
      vendorFeatures,
      vendorSpecialPurposes
    },
    publisherRestrictions,
    isFullyRestricted
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
      // Wenn keine GVL verfügbar ist, können wir nur grundlegende Informationen bereitstellen
      // @ts-ignore - Typprobleme behandeln wir explizit im intMapToIdsArray
      const globalPurposesConsent = intMapToIdsArray(tcModel.purposeConsents);
      // @ts-ignore - Typprobleme behandeln wir explizit im intMapToIdsArray
      const globalPurposesLI = intMapToIdsArray(tcModel.purposeLegitimateInterests);
      // @ts-ignore - Typprobleme behandeln wir explizit im intMapToIdsArray
      const globalSpecialFeatures = intMapToIdsArray(tcModel.specialFeatureOptins);
      
      keyVendorIds.forEach(id => {
          const hasVendorConsent = tcModel.vendorConsents.has(id);
          const hasVendorLIFlag = tcModel.vendorLegitimateInterests.has(id);
          
          keyVendorResults.push({
              id,
              name: `Vendor ${id} (GVL not loaded)`,
              hasConsent: hasVendorConsent,
              // Ohne GVL können wir nicht wissen, welche spezifischen Purposes dieser Vendor unterstützt
              // Daher ist der LI-Status in diesem Fall nicht vollständig, sondern nur das Flag
              hasLegitimateInterest: hasVendorLIFlag,
              purposesConsent: [], // Wir können ohne GVL nicht wissen, welche Purposes der Vendor unterstützt
              purposesLI: [],      // Wir können ohne GVL nicht wissen, welche LI-Purposes der Vendor unterstützt
              specialFeaturesOptIn: [], // Wir können ohne GVL nicht wissen, welche Special Features der Vendor unterstützt
              // Neue Felder für Features und Special Purposes
              features: [],    // Wir können ohne GVL nicht wissen, welche Features der Vendor unterstützt
              specialPurposes: [], // Wir können ohne GVL nicht wissen, welche Special Purposes der Vendor unterstützt
              gvlVendor: null,
              debugInfo: {
                  hasVendorLIBit: hasVendorLIFlag,
                  vendorConsentPurposes: [],
                  vendorLIPurposes: [],
                  vendorSpecialFeatures: [],
                  vendorFeatures: [],
                  vendorSpecialPurposes: [],
                  globalPurposesConsent,
                  globalPurposesLI,
                  globalSpecialFeatures,
                  activeConsentPurposesForVendor: [],
                  activeLIPurposesForVendor: [],
                  activeSpecialFeaturesForVendor: [],
                  finalLIStatus: hasVendorLIFlag,
                  publisherRestrictions: [],
                  isFullyRestricted: false
              }
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
    // Angepasst für Vector-Typ
    globalSpecialFeatureOptIns: vectorToIdsArray(tcModel.specialFeatureOptins),

    keyVendorResults,
    rawTCModel: tcModel, 
    gvlStatus,
  };
  
  console.log('Processed data for UI in tcfService:', processedData);
  return processedData;
}

// Weitere Hilfsfunktionen können hier bei Bedarf hinzugefügt werden. 

/**
 * Prüft, ob ein Vendor Consent für einen bestimmten Purpose hat, 
 * entweder durch direkten Consent ODER durch Legitimate Interest.
 * Diese Funktion folgt dem Ansatz aus dem Kotlin-Code:
 * `vendorHasConsent(vendorId, purpose) || vendorHasPurposeConsentFromLegitimateInterest(vendorId, purpose)`
 * 
 * @param vendorInfo Die aufbereiteten Vendor-Informationen
 * @param purposeId Die Purpose-ID, die geprüft werden soll
 * @returns true, wenn der Vendor Consent für den Purpose hat (über Consent oder LI)
 */
export function vendorHasCombinedPurposeConsent(vendorInfo: ProcessedVendorInfo, purposeId: number): boolean {
  // Der Vendor hat Consent für den Purpose, wenn:
  // 1. Er direkten Consent hat UND der Purpose in seiner Consent-Liste ist ODER
  // 2. Er Legitimate Interest hat UND der Purpose in seiner LI-Liste ist
  
  const hasPurposeConsent = vendorInfo.hasConsent && 
                           vendorInfo.purposesConsent.includes(purposeId);
  
  const hasPurposeLI = vendorInfo.hasLegitimateInterest && 
                       vendorInfo.purposesLI.includes(purposeId);
                       
  return hasPurposeConsent || hasPurposeLI;
}

/**
 * Liefert alle Purposes zurück, für die ein Vendor Consent hat,
 * entweder durch direkten Consent ODER durch Legitimate Interest.
 * 
 * @param vendorInfo Die aufbereiteten Vendor-Informationen
 * @returns Array mit allen Purpose-IDs, für die der Vendor Consent hat
 */
export function getVendorCombinedPurposes(vendorInfo: ProcessedVendorInfo): number[] {
  // Kombiniere Consent und LI Purposes ohne Duplikate
  const combinedPurposes = new Set<number>();
  
  // Füge alle Purpose Consents hinzu, wenn Vendor Consent hat
  if (vendorInfo.hasConsent) {
    vendorInfo.purposesConsent.forEach(purpose => combinedPurposes.add(purpose));
  }
  
  // Füge alle LI Purposes hinzu, wenn Vendor LI hat
  if (vendorInfo.hasLegitimateInterest) {
    vendorInfo.purposesLI.forEach(purpose => combinedPurposes.add(purpose));
  }
  
  return Array.from(combinedPurposes).sort((a, b) => a - b);
}

/**
 * Prüft, ob ein Vendor vollständig eingeschränkt ist. Ein Vendor gilt als 
 * vollständig eingeschränkt, wenn alle seine Purposes durch Publisher 
 * Restrictions eingeschränkt sind.
 * 
 * @param tcModel Das TCF Modell mit den Daten
 * @param vendorId Die Vendor-ID
 * @returns true, wenn der Vendor vollständig eingeschränkt ist
 */
export function isVendorFullyRestricted(tcModel: TCModel, vendorId: number): boolean {
  if (!tcModel.publisherRestrictions) {
    return false;
  }

  // Publisher Restrictions für diesen Vendor extrahieren
  const vendorRestrictions = getPublisherRestrictionsForVendor(tcModel, vendorId);
  
  // Prüfen, ob es Restrictions vom Typ "Not Allowed" gibt
  const purposesNotAllowed = vendorRestrictions
    .filter(r => r.restrictionType === 0) // 0 = "Not allowed"
    .map(r => r.purposeId);
    
  // Prüfen, ob es Restrictions vom Typ "Require Consent" gibt
  // (die LI ausschließen, sodass nur Consent möglich ist)
  const purposesConsentRequired = vendorRestrictions
    .filter(r => r.restrictionType === 1) // 1 = "Require Consent"
    .map(r => r.purposeId);
  
  // Prüfen, ob alle Purposes durch Restrictions abgedeckt sind
  // Das ist eine Vereinfachung, da wir die exakten Purposes des Vendors berücksichtigen müssten
  const totalStandardPurposes = 10; // 1-10 sind Standard-Purposes
  const totalLIPurposes = 10; // Gleiche Anzahl für LI-Purposes
  
  return (purposesNotAllowed.length >= totalStandardPurposes &&
         purposesConsentRequired.length >= totalLIPurposes);
}

/**
 * Extrahiert alle Publisher Restrictions für einen bestimmten Vendor.
 * 
 * @param tcModel Das TCF Modell mit den Daten
 * @param vendorId Die Vendor-ID
 * @returns Array mit Restriction-Objekten für diesen Vendor
 */
export function getPublisherRestrictionsForVendor(tcModel: TCModel, vendorId: number): {
  purposeId: number;
  restrictionType: number;
}[] {
  if (!tcModel.publisherRestrictions) {
    return [];
  }
  
  const restrictions: {
    purposeId: number;
    restrictionType: number;
  }[] = [];
  
  // Die publisherRestrictions im TCModel haben eine andere Struktur als angenommen
  // Wir müssen die TCF-Library-Struktur genauer verstehen
  
  try {
    // Anpassung für die tatsächliche Struktur der publisherRestrictions in der TCF Library
    // In einigen Implementierungen existiert eine getRestrictions()-Methode, in anderen ist
    // der Zugriff anders strukturiert.
    
    // @ts-ignore - Wir ignorieren Typ-Probleme, da die exakte Struktur von der Library abhängt
    const allRestrictions = tcModel.publisherRestrictions.getRestrictions?.() || [];
    
    // Durchlaufe die Restrictions und finde die für den angegebenen Vendor
    allRestrictions.forEach((restriction: any) => {
      if (restriction && restriction.vendorId === vendorId) {
        restrictions.push({
          purposeId: restriction.purposeId,
          restrictionType: restriction.restrictionType
        });
      }
    });
  } catch (error) {
    console.warn('Error accessing publisher restrictions:', error);
  }
  
  return restrictions;
}

/**
 * Hilfsfunktion zur Umwandlung von restriction.restrictionType in lesbare Beschreibungen
 */
export function getRestrictionTypeDescription(restrictionType: number): string {
  switch (restrictionType) {
    case 0: return "Not allowed";
    case 1: return "Consent required";
    case 2: return "Legitimate Interest required";
    default: return "Unknown";
  }
} 