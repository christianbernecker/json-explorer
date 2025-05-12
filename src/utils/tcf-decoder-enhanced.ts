import * as TCFDecoder from './tcf-decoder';
import { GVLData } from './gvl-loader';

// Erweiterter Vendor-Ergebnis-Typ mit GVL-Daten
export interface EnhancedVendorResult {
  id: number;
  name: string;
  policyUrl?: string;
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  
  // Purposes aus GVL und TCF-String 
  purposes: {
    id: number;
    name: string;
    description?: string;
    // Definiert im GVL für diesen Vendor
    isAllowed: boolean;           // Darf der Vendor diesen Purpose nutzen?
    isLegitimateInterestAllowed: boolean; // Darf der Vendor Legitimate Interest verwenden?
    isFlexiblePurpose: boolean;   // Ist der Purpose flexibel (Consent oder LegInt)?
    // Aus dem TCF-String
    hasConsent: boolean;          // Hat Consent im String?
    hasLegitimateInterest: boolean; // Hat LegInt im String?
    // Publisher Restrictions
    restriction?: string;   // Art der Einschränkung
  }[];
  
  // Special Features aus GVL und TCF-String
  specialFeatures: {
    id: number;
    name: string;
    description?: string;
    // Definiert im GVL für diesen Vendor
    isAllowed: boolean;
    // Aus dem TCF-String
    hasConsent: boolean;
  }[];
  
  // Special Purposes aus GVL
  specialPurposes?: {
    id: number;
    name: string;
    description?: string;
    isAllowed: boolean;
  }[];
  
  // Features aus GVL
  features?: {
    id: number;
    name: string;
    description?: string;
    isAllowed: boolean;
  }[];
}

// GVL-Purpose-Typ
interface PurposeInfo {
  id: number;
  name: string;
  description: string;
  [key: string]: any;
}

// GVL-Special-Feature-Typ
interface SpecialFeatureInfo {
  id: number;
  name: string;
  description: string;
  [key: string]: any;
}

/**
 * Erweiterte TCF-Analyse mit GVL-Integration
 */
export function analyzeTCFWithGVL(tcfString: string, gvl: GVLData): {
  coreData: any;
  version: string;
  vendorResults: EnhancedVendorResult[];
} {
  // Standard TCF-Dekodierung
  const result = TCFDecoder.decodeTCFString(tcfString);
  
  // Vendor-spezifische Auswertung mit GVL
  const vendorResults: EnhancedVendorResult[] = [];
  
  // Liste der Vendor-IDs, die ausgewertet werden sollen
  const vendorIdsSet = new Set([
    ...result.vendorResults.map(v => v.id),
    ...result.coreData.vendorConsent,
    ...result.coreData.vendorLI
  ]);
  const vendorIds = Array.from(vendorIdsSet);
  
  // Purposes, Special Features, etc. aus GVL
  const purposes: { [id: string]: PurposeInfo } = gvl.purposes || {};
  const specialFeatures: { [id: string]: SpecialFeatureInfo } = gvl.specialFeatures || {};
  const specialPurposes: { [id: string]: PurposeInfo } = gvl.specialPurposes || {};
  const features: { [id: string]: PurposeInfo } = gvl.features || {};
  
  // Für jeden Vendor eine erweiterte Auswertung durchführen
  for (const vendorId of vendorIds) {
    const gvlVendor = gvl.vendors[vendorId.toString()];
    
    // Vendor überspringen, wenn er nicht in der GVL ist
    if (!gvlVendor) continue;
    
    // Basis-Vendor-Informationen
    const hasConsent = result.coreData.vendorConsent.includes(vendorId);
    const hasLegitimateInterest = result.coreData.vendorLI.includes(vendorId);
    
    // Restrictions für diesen Vendor
    const restrictions = result.coreData.publisherRestrictions
      .filter((r: any) => r.vendors.includes(vendorId))
      .reduce((acc: {[key: number]: string}, r: any) => {
        acc[r.purposeId] = r.restrictionType;
        return acc;
      }, {});
    
    // Alle Purposes analysieren (1-24)
    const enhancedPurposes = [];
    for (let i = 1; i <= 24; i++) {
      // Purpose-Info aus GVL
      const purposeInfo = purposes[i.toString()];
      if (!purposeInfo) continue;
      
      // Darf dieser Vendor diesen Purpose verwenden (laut GVL)?
      const isAllowed = gvlVendor.purposes?.includes(i) || false;
      const isLegitimateInterestAllowed = gvlVendor.legIntPurposes?.includes(i) || false;
      const isFlexiblePurpose = gvlVendor.flexiblePurposes?.includes(i) || false;
      
      // Hat dieser Vendor Consent/LegInt für diesen Purpose im TCF-String?
      let purposeHasConsent = false;
      let purposeHasLegitimateInterest = false;
      
      // Check für Consent (nur relevant, wenn der Vendor generell Consent hat)
      if (hasConsent && isAllowed) {
        purposeHasConsent = result.coreData.purposesConsent.includes(i);
      }
      
      // Check für Legitimate Interest (nur relevant, wenn der Vendor generell LegInt hat)
      if (hasLegitimateInterest && isLegitimateInterestAllowed) {
        purposeHasLegitimateInterest = result.coreData.purposesLITransparency.includes(i);
      }
      
      // Publisher Restrictions berücksichtigen
      const restriction = restrictions[i] || null;
      if (restriction) {
        // Wenn "Nicht erlaubt", dann Purpose aus beiden Listen entfernen
        if (restriction === "Nicht erlaubt") {
          purposeHasConsent = false;
          purposeHasLegitimateInterest = false;
        }
        // Wenn "Zustimmung erforderlich", dann aus Legitimate Interests entfernen
        else if (restriction === "Zustimmung erforderlich") {
          purposeHasLegitimateInterest = false;
          // Bei flexiblen Purposes und Consent: füge Consent hinzu
          if (isFlexiblePurpose && hasConsent && result.coreData.purposesConsent.includes(i)) {
            purposeHasConsent = true;
          }
        }
        // Wenn "Berechtigtes Interesse erforderlich", dann aus Purpose Consents entfernen
        else if (restriction === "Berechtigtes Interesse erforderlich") {
          purposeHasConsent = false;
          // Bei flexiblen Purposes und LegInt: füge LegInt hinzu
          if (isFlexiblePurpose && hasLegitimateInterest && result.coreData.purposesLITransparency.includes(i)) {
            purposeHasLegitimateInterest = true;
          }
        }
      }
      
      // Nur Purposes anzeigen, die für diesen Vendor relevant sind
      if (isAllowed || isLegitimateInterestAllowed) {
        enhancedPurposes.push({
          id: i,
          name: purposeInfo.name || `Purpose ${i}`,
          description: purposeInfo.description,
          isAllowed,
          isLegitimateInterestAllowed,
          isFlexiblePurpose,
          hasConsent: purposeHasConsent,
          hasLegitimateInterest: purposeHasLegitimateInterest,
          restriction: restriction
        });
      }
    }
    
    // Special Features analysieren
    const enhancedSpecialFeatures = [];
    for (const featureId of gvlVendor.specialFeatures || []) {
      const featureInfo = specialFeatures[featureId.toString()];
      if (!featureInfo) continue;
      
      // Hat der User für dieses Special Feature Consent gegeben?
      const featureHasConsent = result.coreData.specialFeatureOptIns.includes(featureId);
      
      enhancedSpecialFeatures.push({
        id: featureId,
        name: featureInfo.name || `Special Feature ${featureId}`,
        description: featureInfo.description,
        isAllowed: true,
        hasConsent: featureHasConsent
      });
    }
    
    // Special Purposes analysieren
    const enhancedSpecialPurposes = [];
    for (const purposeId of gvlVendor.specialPurposes || []) {
      const purposeInfo = specialPurposes[purposeId.toString()];
      if (!purposeInfo) continue;
      
      enhancedSpecialPurposes.push({
        id: purposeId,
        name: purposeInfo.name || `Special Purpose ${purposeId}`,
        description: purposeInfo.description,
        isAllowed: true
      });
    }
    
    // Features analysieren
    const enhancedFeatures = [];
    for (const featureId of gvlVendor.features || []) {
      const featureInfo = features[featureId.toString()];
      if (!featureInfo) continue;
      
      enhancedFeatures.push({
        id: featureId,
        name: featureInfo.name || `Feature ${featureId}`,
        description: featureInfo.description,
        isAllowed: true
      });
    }
    
    // Ergebnisse hinzufügen
    vendorResults.push({
      id: vendorId,
      name: gvlVendor.name,
      policyUrl: gvlVendor.policyUrl,
      hasConsent,
      hasLegitimateInterest,
      purposes: enhancedPurposes,
      specialFeatures: enhancedSpecialFeatures,
      specialPurposes: enhancedSpecialPurposes,
      features: enhancedFeatures
    });
  }
  
  // Nach Vendor-ID sortieren
  vendorResults.sort((a, b) => a.id - b.id);
  
  return {
    coreData: result.coreData,
    version: result.version,
    vendorResults
  };
}

/**
 * Hilfsfunktion zum Filtern von Zwecken nach Status
 */
export function filterPurposesByStatus(
  purposes: EnhancedVendorResult['purposes'], 
  status: 'allowed' | 'consent' | 'legitimate'
): EnhancedVendorResult['purposes'] {
  switch (status) {
    case 'allowed':
      return purposes.filter(p => p.isAllowed);
    case 'consent':
      return purposes.filter(p => p.hasConsent);
    case 'legitimate':
      return purposes.filter(p => p.hasLegitimateInterest);
    default:
      return purposes;
  }
}

/**
 * Generiert eine zusammenfassende Übersicht der Vendor-Zustimmungen
 */
export function generateVendorSummary(vendorResults: EnhancedVendorResult[]): {
  totalVendors: number;
  vendorsWithConsent: number;
  vendorsWithLegitimateInterest: number;
  purposesWithConsent: { [id: number]: number };  // ID: Anzahl Vendors
  purposesWithLegInt: { [id: number]: number };
} {
  const summary = {
    totalVendors: vendorResults.length,
    vendorsWithConsent: 0,
    vendorsWithLegitimateInterest: 0,
    purposesWithConsent: {} as { [id: number]: number },
    purposesWithLegInt: {} as { [id: number]: number }
  };
  
  for (const vendor of vendorResults) {
    if (vendor.hasConsent) summary.vendorsWithConsent++;
    if (vendor.hasLegitimateInterest) summary.vendorsWithLegitimateInterest++;
    
    // Zähle Zwecke mit Zustimmung
    for (const purpose of vendor.purposes) {
      if (purpose.hasConsent) {
        summary.purposesWithConsent[purpose.id] = (summary.purposesWithConsent[purpose.id] || 0) + 1;
      }
      if (purpose.hasLegitimateInterest) {
        summary.purposesWithLegInt[purpose.id] = (summary.purposesWithLegInt[purpose.id] || 0) + 1;
      }
    }
  }
  
  return summary;
}

/**
 * Prüft, ob ein Vendor Consent für einen bestimmten Zweck hat
 */
export function vendorHasPurposeConsent(vendor: EnhancedVendorResult, purposeId: number): boolean {
  const purpose = vendor.purposes.find(p => p.id === purposeId);
  return purpose ? purpose.hasConsent : false;
}

/**
 * Prüft, ob ein Vendor Legitimate Interest für einen bestimmten Zweck hat
 */
export function vendorHasPurposeLegitimateInterest(vendor: EnhancedVendorResult, purposeId: number): boolean {
  const purpose = vendor.purposes.find(p => p.id === purposeId);
  return purpose ? purpose.hasLegitimateInterest : false;
} 