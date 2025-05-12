// TCF String Decoder - Unterstützt TCF v2.0 und v2.2

export const DEFAULT_VENDORS = [136, 137];

/**
 * Wandelt eine Base64-codierte TCF-Zeichenfolge in Bits um
 */
export function base64ToBits(base64String: string): number[] {
  // Base64-URL Dekodierung zu Binärdaten
  const decodedString = atob(
    base64String
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64String.length + (4 - (base64String.length % 4)) % 4, '=')
  );
  
  // Binärdaten in Bit-Array konvertieren
  const bits: number[] = [];
  for (let i = 0; i < decodedString.length; i++) {
    const byte = decodedString.charCodeAt(i);
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1);
    }
  }
  
  return bits;
}

/**
 * Konvertiert Bits in eine Ganzzahl
 */
export function bitsToInt(bits: number[]): number {
  let result = 0;
  for (let i = 0; i < bits.length; i++) {
    result = (result << 1) | bits[i];
  }
  return result;
}

/**
 * Parst ein Bitfeld und gibt die gesetzten Bits als 1-basierte Indices zurück
 */
export function parseBitField(bitString: number[], offset: number, length: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    if (bitString[offset + i]) {
      result.push(i + 1);  // 1-basierter Index
    }
  }
  return result;
}

/**
 * Konvertiert eine Bitfolge in ein String (für Sprachcodes etc.)
 */
export function bitStringToString(bits: number[]): string {
  let result = '';
  for (let i = 0; i < bits.length; i += 6) {
    const charCode = bitsToInt(bits.slice(i, i + 6)) + 65;
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Parst einen Vendor-Abschnitt im TCF-String
 */
export function parseVendorSection(bitString: number[], startOffset: number): { vendors: number[], newOffset: number } {
  let offset = startOffset;
  
  // Max VendorId
  const maxVendorId = bitsToInt(bitString.slice(offset, offset + 16)); 
  offset += 16;
  
  // IsRangeEncoding
  const isRangeEncoding = bitString[offset]; 
  offset += 1;
  
  let vendors: number[] = [];
  
  if (isRangeEncoding) {
    // Range encoding
    const numEntries = bitsToInt(bitString.slice(offset, offset + 12));
    offset += 12;
    
    for (let i = 0; i < numEntries; i++) {
      const isRange = bitString[offset];
      offset += 1;
      
      if (isRange) {
        const startVendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        const endVendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        
        for (let j = startVendorId; j <= endVendorId; j++) {
          vendors.push(j);
        }
      } else {
        const vendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        vendors.push(vendorId);
      }
    }
  } else {
    // Bitfield encoding
    for (let i = 1; i <= maxVendorId; i++) {
      if (bitString[offset]) {
        vendors.push(i);
      }
      offset += 1;
    }
  }
  
  return {
    vendors,
    newOffset: offset
  };
}

/**
 * Parst den Publisher Restrictions-Abschnitt
 */
export function parsePubRestrictions(bitString: number[], startOffset: number): { 
  restrictions: {
    purposeId: number;
    restrictionType: string;
    vendors: number[];
  }[],
  newOffset: number 
} {
  let offset = startOffset;
  const restrictions: {
    purposeId: number;
    restrictionType: string;
    vendors: number[];
  }[] = [];
  
  // Anzahl der Einschränkungen
  const numRestrictions = bitsToInt(bitString.slice(offset, offset + 12));
  offset += 12;
  
  for (let i = 0; i < numRestrictions; i++) {
    // Purpose ID
    const purposeId = bitsToInt(bitString.slice(offset, offset + 6));
    offset += 6;
    
    // Restriction type
    const restrictionType = bitsToInt(bitString.slice(offset, offset + 2));
    offset += 2;
    
    let restrictionTypeString;
    switch (restrictionType) {
      case 0: restrictionTypeString = "Nicht erlaubt"; break;
      case 1: restrictionTypeString = "Zustimmung erforderlich"; break;
      case 2: restrictionTypeString = "Berechtigtes Interesse erforderlich"; break;
      default: restrictionTypeString = "Unbekannt";
    }
    
    // Vendor-Liste für diese Einschränkung
    const numEntries = bitsToInt(bitString.slice(offset, offset + 12));
    offset += 12;
    
    const vendors: number[] = [];
    
    for (let j = 0; j < numEntries; j++) {
      const isRange = bitString[offset];
      offset += 1;
      
      if (isRange) {
        const startVendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        const endVendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        
        for (let k = startVendorId; k <= endVendorId; k++) {
          vendors.push(k);
        }
      } else {
        const vendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        vendors.push(vendorId);
      }
    }
    
    restrictions.push({
      purposeId,
      restrictionType: restrictionTypeString,
      vendors
    });
  }
  
  return {
    restrictions,
    newOffset: offset
  };
}

/**
 * Dekodiert einen TCF 2.0 String
 */
export function decodeTCF2_0(bitString: number[], segments: string[]): any {
  // TCF 2.0 Struktur extrahieren
  let offset = 0;
  
  // Core Metadaten
  const version = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const created = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const lastUpdated = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const cmpId = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const cmpVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const consentScreen = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const consentLanguage = bitStringToString(bitString.slice(offset, offset + 12)); offset += 12;
  const vendorListVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const policyVersion = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  
  // Zwecke und Berechtigungen
  const isServiceSpecific = bitString[offset]; offset += 1;
  const useNonStandardStacks = bitString[offset]; offset += 1;
  const specialFeatureOptIns = parseBitField(bitString, offset, 12); offset += 12;
  const purposesConsent = parseBitField(bitString, offset, 24); offset += 24;
  const purposesLITransparency = parseBitField(bitString, offset, 24); offset += 24;
  
  // Vendor-Bereich
  const vendorConsentBits = parseVendorSection(bitString, offset);
  offset = vendorConsentBits.newOffset;
  
  // Vendor Legitimate Interest-Bereich
  const vendorLIBits = parseVendorSection(bitString, offset);
  offset = vendorLIBits.newOffset;
  
  // Publisher Restrictions-Bereich
  const pubRestrictions = parsePubRestrictions(bitString, offset);
  
  return {
    version,
    created,
    lastUpdated,
    cmpId,
    cmpVersion,
    consentScreen,
    consentLanguage,
    vendorListVersion,
    policyVersion,
    isServiceSpecific,
    useNonStandardStacks,
    specialFeatureOptIns,
    purposesConsent,
    purposesLITransparency,
    vendorConsent: vendorConsentBits.vendors,
    vendorLI: vendorLIBits.vendors,
    publisherRestrictions: pubRestrictions.restrictions,
    fullString: bitString,
    segments
  };
}

/**
 * Dekodiert einen TCF 2.2 String
 */
export function decodeTCF2_2(bitString: number[], segments: string[]): any {
  // TCF 2.2 Struktur extrahieren - Ähnlich zu 2.0 mit einigen Unterschieden
  let offset = 0;
  
  // Core Metadaten (identisch zu 2.0)
  const version = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const created = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const lastUpdated = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const cmpId = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const cmpVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const consentScreen = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const consentLanguage = bitStringToString(bitString.slice(offset, offset + 12)); offset += 12;
  const vendorListVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const policyVersion = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  
  // Neu in 2.2: Felder für Global Consent
  const isServiceSpecific = bitString[offset]; offset += 1;
  const useNonStandardStacks = bitString[offset]; offset += 1;
  const specialFeatureOptIns = parseBitField(bitString, offset, 12); offset += 12;
  const purposesConsent = parseBitField(bitString, offset, 24); offset += 24;
  const purposesLITransparency = parseBitField(bitString, offset, 24); offset += 24;
  
  // Neu in 2.2: Zusätzliche Felder
  const purposeOneTreatment = bitString[offset]; offset += 1;
  const publisherCC = bitStringToString(bitString.slice(offset, offset + 12)); offset += 12;
  
  // Vendor-Bereich - identisch zu 2.0
  const vendorConsentBits = parseVendorSection(bitString, offset);
  offset = vendorConsentBits.newOffset;
  
  // Vendor Legitimate Interest-Bereich - identisch zu 2.0
  const vendorLIBits = parseVendorSection(bitString, offset);
  offset = vendorLIBits.newOffset;
  
  // Publisher Restrictions-Bereich - identisch zu 2.0
  const pubRestrictions = parsePubRestrictions(bitString, offset);
  
  return {
    version,
    created,
    lastUpdated,
    cmpId,
    cmpVersion,
    consentScreen,
    consentLanguage,
    vendorListVersion,
    policyVersion,
    isServiceSpecific,
    useNonStandardStacks,
    specialFeatureOptIns,
    purposesConsent,
    purposesLITransparency,
    purposeOneTreatment,
    publisherCC,
    vendorConsent: vendorConsentBits.vendors,
    vendorLI: vendorLIBits.vendors,
    publisherRestrictions: pubRestrictions.restrictions,
    fullString: bitString,
    segments
  };
}

/**
 * Sammelt Informationen über einen bestimmten Vendor
 */
export function getVendorInfo(decodedCore: any, vendorId: number): {
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  purposeConsents: number[];
  legitimateInterests: number[];
} {
  // Prüft Zustimmung und berechtigtes Interesse für einen Vendor
  const hasConsent = decodedCore.vendorConsent.includes(vendorId);
  const hasLegitimateInterest = decodedCore.vendorLI.includes(vendorId);
  
  // Der Vendor hat nur Zugriff auf die Purposes, für die global Consent gegeben wurde
  // UND für den der Vendor explizit Consent hat
  let purposeConsents: number[] = [];
  if (hasConsent) {
    // Wir nehmen die globalen Purposes, wenn der Vendor Consent hat
    purposeConsents = [...decodedCore.purposesConsent];
  }
  
  // Nur Legitimate Interests anzeigen, wenn der Vendor dafür Berechtigung hat
  let legitimateInterests: number[] = [];
  if (hasLegitimateInterest) {
    legitimateInterests = [...decodedCore.purposesLITransparency];
  }
  
  // Verarbeitungszwecke basierend auf Publisher-Einschränkungen anpassen
  for (const restriction of decodedCore.publisherRestrictions) {
    if (restriction.vendors.includes(vendorId)) {
      // Wenn "Nicht erlaubt", dann Purpose aus beiden Listen entfernen
      if (restriction.restrictionType === "Nicht erlaubt") {
        purposeConsents = purposeConsents.filter(p => p !== restriction.purposeId);
        legitimateInterests = legitimateInterests.filter(p => p !== restriction.purposeId);
      }
      // Wenn "Zustimmung erforderlich", dann aus Legitimate Interests entfernen
      else if (restriction.restrictionType === "Zustimmung erforderlich") {
        legitimateInterests = legitimateInterests.filter(p => p !== restriction.purposeId);
      }
      // Wenn "Berechtigtes Interesse erforderlich", dann aus Purpose Consents entfernen
      else if (restriction.restrictionType === "Berechtigtes Interesse erforderlich") {
        purposeConsents = purposeConsents.filter(p => p !== restriction.purposeId);
      }
    }
  }
  
  return {
    hasConsent,
    hasLegitimateInterest,
    purposeConsents,
    legitimateInterests
  };
}

/**
 * Sucht Einschränkungen für einen bestimmten Vendor
 */
export function getVendorRestrictions(decodedCore: any, vendorId: number): {
  purposeId: number;
  restrictionType: string;
}[] {
  // Findet Einschränkungen für einen bestimmten Vendor
  const vendorRestrictions = [];
  
  for (const restriction of decodedCore.publisherRestrictions) {
    if (restriction.vendors.includes(vendorId)) {
      vendorRestrictions.push({
        purposeId: restriction.purposeId,
        restrictionType: restriction.restrictionType
      });
    }
  }
  
  return vendorRestrictions;
}

/**
 * Hauptfunktion zum Dekodieren eines TCF-Strings
 */
export function decodeTCFString(tcfString: string): {
  version: string;
  coreData: any;
  vendorResults: {
    id: number;
    info: {
      hasConsent: boolean;
      hasLegitimateInterest: boolean;
      purposeConsents: number[];
      legitimateInterests: number[];
    };
    restrictions: {
      purposeId: number;
      restrictionType: string;
    }[];
  }[];
} {
  // Teilt den String in Segmente
  const segments = tcfString.split('.');
  
  // Dekodiert das Core-Segment (erstes Segment)
  const coreSegment = segments[0];
  const bitString = base64ToBits(coreSegment);
  
  // Bestimmt die Version (gleiche Position in beiden Versionen)
  const versionNumber = bitsToInt(bitString.slice(0, 6));
  let decodedCore;
  let versionString = '';
  
  if (versionNumber === 2) {
    // TCF v2.0 Dekodierung
    decodedCore = decodeTCF2_0(bitString, segments);
    versionString = "2.0";
  } else if (versionNumber === 3) {
    // TCF v2.2 Dekodierung (Version 3 im Bitstring)
    decodedCore = decodeTCF2_2(bitString, segments);
    versionString = "2.2";
  } else {
    throw new Error(`Nicht unterstützte TCF-Version: ${versionNumber}`);
  }
  
  // Verarbeitet Default-Vendors
  const vendorResults = [];
  for (const vendorId of DEFAULT_VENDORS) {
    // Holt vendor-spezifische Informationen
    const vendorInfo = getVendorInfo(decodedCore, vendorId);
    
    // Holt Einschränkungen für diesen Vendor
    const restrictions = getVendorRestrictions(decodedCore, vendorId);
    
    vendorResults.push({
      id: vendorId,
      info: vendorInfo,
      restrictions: restrictions
    });
  }
  
  return {
    version: versionString,
    coreData: decodedCore,
    vendorResults
  };
}

// Liste von Purpose-Namen
export const purposeNames = [
  "Informationen auf einem Gerät speichern und/oder abrufen",
  "Einfache Anzeigen",
  "Personalisiertes Anzeigeprofil erstellen",
  "Personalisierte Anzeigen auswählen",
  "Personalisiertes Inhaltsprofil erstellen",
  "Personalisierte Inhalte auswählen",
  "Anzeigenleistung messen",
  "Inhaltsleistung messen",
  "Marktforschung zur Generierung von Zielgruppeneinblicken",
  "Produkte entwickeln und verbessern",
  "Spezielles Profilziel (2.2)",
  "Personalisierungssicherheit (2.2)"
];

/**
 * Generiert eine Bit-Darstellung eines TCF-Strings für Debug-Zwecke
 */
export function generateBitRepresentation(bitString: number[]): string {
  let result = '';
  for (let i = 0; i < bitString.length; i++) {
    if (i > 0 && i % 8 === 0) {
      result += ' ';
    }
    if (i > 0 && i % 64 === 0) {
      result += '\n';
    }
    result += bitString[i];
  }
  return result;
} 