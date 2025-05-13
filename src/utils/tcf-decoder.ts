// TCF String Decoder - Supports TCF v2.0 and v2.2

import { TCString } from '@iabtechlabtcf/core';

export const DEFAULT_VENDORS = [136, 137, 44];

/**
 * Converts a Base64-encoded TCF string to bits
 */
export function base64ToBits(base64String: string): number[] {
  console.log("Decoding Base64 string:", base64String);
  
  // Base64-URL decoding to binary data
  const normalizedBase64 = base64String
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64String.length + (4 - (base64String.length % 4)) % 4, '=');
  
  console.log("Normalized Base64 string:", normalizedBase64);
  
  try {
    const decodedString = atob(normalizedBase64);
    console.log("Decoded binary length:", decodedString.length);
    
    // Convert binary data to bit array
    const bits: number[] = [];
    for (let i = 0; i < decodedString.length; i++) {
      const byte = decodedString.charCodeAt(i);
      for (let j = 7; j >= 0; j--) {
        bits.push((byte >> j) & 1);
      }
    }
    
    console.log(`Converted to ${bits.length} bits`);
    
    // Debug: show first 32 bits for validation
    console.log("First 32 bits:", bits.slice(0, 32).join(''));
    
    return bits;
  } catch (e) {
    console.error("Error decoding Base64 string:", e);
    throw new Error(`Failed to decode TCF string: ${e}`);
  }
}

/**
 * Converts bits to an integer
 */
export function bitsToInt(bits: number[]): number {
  let result = 0;
  for (let i = 0; i < bits.length; i++) {
    result = (result << 1) | bits[i];
  }
  return result;
}

/**
 * Parses a bitfield and returns the set bits as 1-based indices
 */
export function parseBitField(bitString: number[], offset: number, length: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    if (bitString[offset + i]) {
      result.push(i + 1);  // 1-based index
    }
  }
  return result;
}

/**
 * Converts a bit sequence to a string (for language codes etc.)
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
 * Parses a vendor section in the TCF string
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
  
  // Debug logging
  console.log(`Vendor Section - MaxVendorId: ${maxVendorId}, IsRangeEncoding: ${isRangeEncoding}`);
  
  if (isRangeEncoding) {
    // Range encoding
    const numEntries = bitsToInt(bitString.slice(offset, offset + 12));
    offset += 12;
    
    console.log(`Range encoding with ${numEntries} entries`);
    
    for (let i = 0; i < numEntries; i++) {
      const isRange = bitString[offset];
      offset += 1;
      
      if (isRange) {
        const startVendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        const endVendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        
        console.log(`Range ${i+1}/${numEntries}: VendorIds ${startVendorId}-${endVendorId}`);
        
        for (let j = startVendorId; j <= endVendorId; j++) {
          vendors.push(j);
        }
      } else {
        const vendorId = bitsToInt(bitString.slice(offset, offset + 16));
        offset += 16;
        console.log(`Single entry ${i+1}/${numEntries}: VendorId ${vendorId}`);
        vendors.push(vendorId);
      }
    }
  } else {
    // Bitfield encoding
    console.log(`Bitfield encoding with ${maxVendorId} vendors`);
    for (let i = 1; i <= maxVendorId; i++) {
      if (bitString[offset]) {
        vendors.push(i);
      }
      offset += 1;
    }
  }
  
  // Debug: Check for key vendors
  if (vendors.includes(136)) {
    console.log('Vendor 136 found in vendor list');
  }
  if (vendors.includes(137)) {
    console.log('Vendor 137 found in vendor list');
  }
  if (vendors.includes(44)) {
    console.log('Vendor 44 found in vendor list');
  }
  
  return {
    vendors,
    newOffset: offset
  };
}

/**
 * Parses the Publisher Restrictions section
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
  
  // Number of restrictions
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
      case 0: restrictionTypeString = "Not allowed"; break;
      case 1: restrictionTypeString = "Consent required"; break;
      case 2: restrictionTypeString = "Legitimate Interest required"; break;
      default: restrictionTypeString = "Unknown";
    }
    
    // Vendor list for this restriction
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
 * Decodes a TCF 2.0 string
 */
export function decodeTCF2_0(bitString: number[], segments: string[]): any {
  // Extract TCF 2.0 structure
  let offset = 0;
  
  // Core metadata
  const version = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const created = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const lastUpdated = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const cmpId = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const cmpVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const consentScreen = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const consentLanguage = bitStringToString(bitString.slice(offset, offset + 12)); offset += 12;
  const vendorListVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const policyVersion = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  
  // Debug logging for dates
  console.log(`Created timestamp: ${created} => ${new Date(created * 100).toISOString()}`);
  console.log(`LastUpdated timestamp: ${lastUpdated} => ${new Date(lastUpdated * 100).toISOString()}`);
  
  // Debug logging für Offsets
  console.log(`Offset nach PolicyVersion: ${offset}`);
  
  // Korrigierter Offset für Vendor Consent Section
  offset = 138;
  console.log(`Korrigierter Offset für Vendor Consent Section: ${offset}`);

  // Vendor section
  console.log("Parsing Vendor Consent Section...");
  const vendorConsentBits = parseVendorSection(bitString, offset);
  offset = vendorConsentBits.newOffset;
  
  // Vendor Legitimate Interest section
  console.log("Parsing Vendor Legitimate Interest Section...");
  const vendorLIBits = parseVendorSection(bitString, offset);
  offset = vendorLIBits.newOffset;
  
  // Jetzt die Felder nach den Vendor-Sections dekodieren
  const isServiceSpecific = bitString[offset]; offset += 1;
  const useNonStandardStacks = bitString[offset]; offset += 1;
  const specialFeatureOptIns = parseBitField(bitString, offset, 12); offset += 12;
  const purposesConsent = parseBitField(bitString, offset, 24); offset += 24;
  const purposesLITransparency = parseBitField(bitString, offset, 24); offset += 24;
  
  // Publisher Restrictions section
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
 * Decodes a TCF 2.2 string
 */
export function decodeTCF2_2(bitString: number[], segments: string[]): any {
  // Extract TCF 2.2 structure - similar to 2.0 with some differences
  let offset = 0;
  
  // Core metadata (identical to 2.0)
  const version = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const created = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const lastUpdated = bitsToInt(bitString.slice(offset, offset + 36)); offset += 36;
  const cmpId = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const cmpVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const consentScreen = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  const consentLanguage = bitStringToString(bitString.slice(offset, offset + 12)); offset += 12;
  const vendorListVersion = bitsToInt(bitString.slice(offset, offset + 12)); offset += 12;
  const policyVersion = bitsToInt(bitString.slice(offset, offset + 6)); offset += 6;
  
  // Debug logging for dates
  console.log(`Created timestamp (2.2): ${created} => ${new Date(created * 100).toISOString()}`);
  console.log(`LastUpdated timestamp (2.2): ${lastUpdated} => ${new Date(lastUpdated * 100).toISOString()}`);
  
  // New in 2.2: Fields for Global Consent
  const isServiceSpecific = bitString[offset]; offset += 1;
  const useNonStandardStacks = bitString[offset]; offset += 1;
  const specialFeatureOptIns = parseBitField(bitString, offset, 12); offset += 12;
  const purposesConsent = parseBitField(bitString, offset, 24); offset += 24;
  const purposesLITransparency = parseBitField(bitString, offset, 24); offset += 24;
  
  // New in 2.2: Additional fields
  const purposeOneTreatment = bitString[offset]; offset += 1;
  const publisherCC = bitStringToString(bitString.slice(offset, offset + 12)); offset += 12;
  
  // Vendor section - identical to 2.0
  console.log("Parsing Vendor Consent Section (2.2)...");
  const vendorConsentBits = parseVendorSection(bitString, offset);
  offset = vendorConsentBits.newOffset;
  
  // Vendor Legitimate Interest section - identical to 2.0
  console.log("Parsing Vendor Legitimate Interest Section (2.2)...");
  const vendorLIBits = parseVendorSection(bitString, offset);
  offset = vendorLIBits.newOffset;
  
  // Publisher Restrictions section - identical to 2.0
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
 * Collects information about a specific vendor
 */
export function getVendorInfo(decodedCore: any, vendorId: number): {
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  purposeConsents: number[];
  legitimateInterests: number[];
} {
  // Check consent and legitimate interest for a vendor
  const hasConsent = decodedCore.vendorConsent.includes(vendorId);
  const hasLegitimateInterest = decodedCore.vendorLI.includes(vendorId);
  
  // The vendor only has access to purposes for which global consent was given
  // AND for which the vendor explicitly has consent
  let purposeConsents: number[] = [];
  if (hasConsent) {
    // We take the global purposes if the vendor has consent
    purposeConsents = [...decodedCore.purposesConsent];
  }
  
  // Only show legitimate interests if the vendor has permission for them
  let legitimateInterests: number[] = [];
  if (hasLegitimateInterest) {
    legitimateInterests = [...decodedCore.purposesLITransparency];
  }
  
  // Find all restrictions for this vendor
  const vendorRestrictions = decodedCore.publisherRestrictions
    .filter((r: any) => r.vendors.includes(vendorId));
  
  // Adjust processing purposes based on publisher restrictions
  for (const restriction of vendorRestrictions) {
    const purposeId = restriction.purposeId;
    
    // If "Not allowed", then remove purpose from both lists
    if (restriction.restrictionType === "Not allowed") {
      purposeConsents = purposeConsents.filter(p => p !== purposeId);
      legitimateInterests = legitimateInterests.filter(p => p !== purposeId);
    }
    // If "Consent required", then remove from Legitimate Interests
    else if (restriction.restrictionType === "Consent required") {
      legitimateInterests = legitimateInterests.filter(p => p !== purposeId);
    }
    // If "Legitimate Interest required", then remove from Purpose Consents
    else if (restriction.restrictionType === "Legitimate Interest required") {
      purposeConsents = purposeConsents.filter(p => p !== purposeId);
    }
  }
  
  return {
    hasConsent,  // The vendor has basic consent, regardless of purpose restrictions
    hasLegitimateInterest, // The vendor has basic legitimate interest, regardless of purpose restrictions
    purposeConsents,
    legitimateInterests
  };
}

/**
 * Finds restrictions for a specific vendor
 */
export function getVendorRestrictions(decodedCore: any, vendorId: number): {
  purposeId: number;
  restrictionType: string;
}[] {
  // Finds restrictions for a specific vendor
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
 * Main function for decoding a TCF string
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
  console.log("Decoding TCF string:", tcfString);

  // Split the string into segments
  const segments = tcfString.split('.');
  
  // Decode the core segment (first segment)
  const coreSegment = segments[0];
  const bitString = base64ToBits(coreSegment);
  
  // Determine the version (same position in both versions)
  const versionNumber = bitsToInt(bitString.slice(0, 6));
  let decodedCore;
  let versionString = '';
  
  console.log(`TCF Version Number: ${versionNumber}`);
  
  if (versionNumber === 2) {
    // TCF v2.0 decoding
    decodedCore = decodeTCF2_0(bitString, segments);
    versionString = "2.0";
  } else if (versionNumber === 3) {
    // TCF v2.2 decoding (Version 3 in the bitstring)
    decodedCore = decodeTCF2_2(bitString, segments);
    versionString = "2.2";
  } else {
    throw new Error(`Unsupported TCF version: ${versionNumber}`);
  }
  
  // Process default vendors
  const vendorResults = [];
  for (const vendorId of DEFAULT_VENDORS) {
    // Get vendor-specific information
    const vendorInfo = getVendorInfo(decodedCore, vendorId);
    
    // Get restrictions for this vendor
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

/**
 * Namen von TCF Purposes für bessere Lesbarkeit
 */
export const purposeNames: Record<number, string> = {
  1: 'Geräte-Informationen speichern und/oder darauf zugreifen',
  2: 'Grundlegende Werbung',
  3: 'Personalisierte Werbung',
  4: 'Personalisierte Inhalte',
  5: 'Werbemessung',
  6: 'Inhaltsmessung',
  7: 'Marktforschung',
  8: 'Produktentwicklung',
  9: 'Notwendige Funktionen',
  10: 'Produktverbesserung'
};

/**
 * Generates a bit representation of a TCF string for debugging purposes
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

/**
 * JSON export of results
 */
export function handleExportJSON(decodedData: any): any {
  if (!decodedData) return null;
  
  return {
    version: decodedData.version,
    created: new Date(decodedData.created * 100).toISOString(),
    lastUpdated: new Date(decodedData.lastUpdated * 100).toISOString(),
    // ... other fields
  };
}

/**
 * Decodes a TCF string using the IAB library (@iabtcf/core) and adds status checks.
 */
export function decodeTCStringIAB(tcString: string): { 
  tcModel: any | null; // We use 'any' here as TCModel type seems complex for direct use
  decodingStatus: 'complete' | 'incomplete' | 'error';
  errorMessage: string | null; 
} {
  try {
    const tcModel = TCString.decode(tcString);

    // Basic check if decoding itself failed
    if (!tcModel) {
      return {
        tcModel: null,
        decodingStatus: 'error',
        errorMessage: 'IAB library failed to decode the string. It might be invalid or corrupted.'
      };
    }

    // Check for potential incompleteness or issues
    let status: 'complete' | 'incomplete' = 'complete';
    let messages: string[] = [];

    // Check common fields that might be missing or have default/unexpected values
    if (tcModel.cmpId === undefined || tcModel.cmpId === null || tcModel.cmpId === 0) {
      messages.push('CMP ID is missing or zero.');
      status = 'incomplete';
    }
    if (tcModel.vendorListVersion === undefined || tcModel.vendorListVersion === null || tcModel.vendorListVersion === 0) {
      messages.push('Vendor List Version is missing or zero.');
      status = 'incomplete';
    }
     if (tcModel.policyVersion === undefined || tcModel.policyVersion === null || tcModel.policyVersion === 0) {
       messages.push('Policy Version is missing or zero.');
       status = 'incomplete';
     }
    // Standard tools often assume service-specific strings
    if (tcModel.isServiceSpecific === false) {
      messages.push('String is globally scoped (not service-specific).');
      // This might not always be an 'error', but often tools expect service-specific
      // status = 'incomplete'; // Decide if this should mark as incomplete
    }
    // Check for potentially very old dates (like the 1970 one observed)
    const createdDate = tcModel.created ? new Date(tcModel.created) : null;
    if (createdDate && createdDate.getFullYear() < 2018) { // TCF v2 launched later
        messages.push(`Creation date (${createdDate.toLocaleDateString()}) seems unusually old.`);
        status = 'incomplete';
    }


    return {
      tcModel: tcModel,
      decodingStatus: status,
      errorMessage: messages.length > 0 ? `Potential issues found: ${messages.join(' ')}` : null
    };

  } catch (error) {
    console.error('Error during IAB TCF decoding:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during decoding.';
    // Add specific checks for common IAB library errors if needed
    if (message.includes('Unable to parse')) {
       return { tcModel: null, decodingStatus: 'error', errorMessage: `IAB library error: String is not parseable. (${message})` };
    }
     if (message.includes('Invalid')) {
       return { tcModel: null, decodingStatus: 'error', errorMessage: `IAB library error: String contains invalid data. (${message})` };
     }
    
    return {
      tcModel: null,
      decodingStatus: 'error',
      errorMessage: `An unexpected error occurred: ${message}`
    };
  }
}

/**
 * Prüft ob ein Vendor Consent hat
 * @param tcString TCF-String
 * @param vendorId Vendor-ID
 * @returns true wenn der Vendor Consent hat, false sonst oder bei Fehlern
 */
export function checkVendorConsent(tcString: string, vendorId: number): boolean {
  try {
    const decoded = TCString.decode(tcString);
    return Boolean(decoded.vendorConsents?.has?.(vendorId));
  } catch (e) {
    console.error("Fehler bei der Vendor-Consent-Prüfung:", e);
    return false;
  }
}

// Die alte Bit-Parsing-Logik bleibt vorerst auskommentiert erhalten
// export function decodeTCFString(...) { ... } 