import * as TCFDecoder from './tcf-decoder';
import { GVLData } from './gvl-loader';

// Enhanced vendor result type with GVL data
export interface EnhancedVendorResult {
  id: number;
  name: string;
  policyUrl?: string;
  hasConsent: boolean;
  hasLegitimateInterest: boolean;
  
  // Purposes from GVL and TCF string 
  purposes: {
    id: number;
    name: string;
    description?: string;
    // Defined in GVL for this vendor
    isAllowed: boolean;           // Is the vendor allowed to use this purpose?
    isLegitimateInterestAllowed: boolean; // Is the vendor allowed to use Legitimate Interest?
    isFlexiblePurpose: boolean;   // Is the purpose flexible (Consent or LegInt)?
    // From the TCF string
    hasConsent: boolean;          // Has consent in the string?
    hasLegitimateInterest: boolean; // Has LegInt in the string?
    // Publisher Restrictions
    restriction?: string;   // Type of restriction
  }[];
  
  // Special Features from GVL and TCF string
  specialFeatures: {
    id: number;
    name: string;
    description?: string;
    // Defined in GVL for this vendor
    isAllowed: boolean;
    // From the TCF string
    hasConsent: boolean;
  }[];
  
  // Special Purposes from GVL
  specialPurposes?: {
    id: number;
    name: string;
    description?: string;
    isAllowed: boolean;
  }[];
  
  // Features from GVL
  features?: {
    id: number;
    name: string;
    description?: string;
    isAllowed: boolean;
  }[];
}

// GVL Purpose type
interface PurposeInfo {
  id: number;
  name: string;
  description: string;
  [key: string]: any;
}

// GVL Special Feature type
interface SpecialFeatureInfo {
  id: number;
  name: string;
  description: string;
  [key: string]: any;
}

/**
 * Enhanced TCF analysis with GVL integration
 */
export function analyzeTCFWithGVL(tcfString: string, gvl: GVLData): {
  coreData: any;
  version: string;
  vendorResults: EnhancedVendorResult[];
} {
  // Standard TCF decoding
  const result = TCFDecoder.decodeTCFString(tcfString);
  
  // Log important data for debugging
  console.log("TCF Decode Result - Vendor Consent:", result.coreData.vendorConsent);
  console.log("TCF Decode Result - Vendor LI:", result.coreData.vendorLI);
  
  // Vendor-specific evaluation with GVL
  const vendorResults: EnhancedVendorResult[] = [];
  
  // List of vendor IDs to be evaluated
  const vendorIdsSet = new Set([
    ...result.vendorResults.map(v => v.id),
    ...result.coreData.vendorConsent,
    ...result.coreData.vendorLI
  ]);
  const vendorIds = Array.from(vendorIdsSet);
  
  // Purposes, Special Features, etc. from GVL
  const purposes: { [id: string]: PurposeInfo } = gvl.purposes || {};
  const specialFeatures: { [id: string]: SpecialFeatureInfo } = gvl.specialFeatures || {};
  const specialPurposes: { [id: string]: PurposeInfo } = gvl.specialPurposes || {};
  const features: { [id: string]: PurposeInfo } = gvl.features || {};
  
  // Perform an enhanced evaluation for each vendor
  for (const vendorId of vendorIds) {
    const gvlVendor = gvl.vendors[vendorId.toString()];
    
    // Skip vendor if not in GVL
    if (!gvlVendor) continue;
    
    // IMPORTANT: Basic vendor consent status is DIRECTLY derived from the TCF string
    // Check if the vendor ID is present in the vendorConsent array from the TCF string
    const hasConsent = result.coreData.vendorConsent.includes(vendorId);
    const hasLegitimateInterest = result.coreData.vendorLI.includes(vendorId);
    
    // Log for key vendors to verify consent
    if ([136, 137, 44].includes(vendorId)) {
      console.log(`Vendor ${vendorId} (${gvlVendor.name}) - Direct consent: ${hasConsent}, Direct LI: ${hasLegitimateInterest}`);
    }
    
    // Restrictions for this vendor
    const restrictions = result.coreData.publisherRestrictions
      .filter((r: any) => r.vendors.includes(vendorId))
      .reduce((acc: {[key: number]: string}, r: any) => {
        acc[r.purposeId] = r.restrictionType;
        return acc;
      }, {});
    
    // Analyze all purposes (1-24)
    const enhancedPurposes = [];
    for (let i = 1; i <= 24; i++) {
      // Purpose info from GVL
      const purposeInfo = purposes[i.toString()];
      if (!purposeInfo) continue;
      
      // Is this vendor allowed to use this purpose (according to GVL)?
      const isAllowed = gvlVendor.purposes?.includes(i) || false;
      const isLegitimateInterestAllowed = gvlVendor.legIntPurposes?.includes(i) || false;
      const isFlexiblePurpose = gvlVendor.flexiblePurposes?.includes(i) || false;
      
      // Does this vendor have Consent/LegInt for this purpose in the TCF string?
      let purposeHasConsent = false;
      let purposeHasLegitimateInterest = false;
      
      // Check for Consent (only relevant if the vendor generally has consent)
      if (hasConsent && isAllowed) {
        purposeHasConsent = result.coreData.purposesConsent.includes(i);
      }
      
      // Check for Legitimate Interest (only relevant if the vendor generally has LegInt)
      if (hasLegitimateInterest && isLegitimateInterestAllowed) {
        purposeHasLegitimateInterest = result.coreData.purposesLITransparency.includes(i);
      }
      
      // Consider publisher restrictions
      const restriction = restrictions[i] || null;
      if (restriction) {
        // If "Not allowed", then remove purpose from both lists
        if (restriction === "Not allowed") {
          purposeHasConsent = false;
          purposeHasLegitimateInterest = false;
        }
        // If "Consent required", then remove from Legitimate Interests
        else if (restriction === "Consent required") {
          purposeHasLegitimateInterest = false;
          // For flexible purposes with consent: add consent
          if (isFlexiblePurpose && hasConsent && result.coreData.purposesConsent.includes(i)) {
            purposeHasConsent = true;
          }
        }
        // If "Legitimate Interest required", then remove from Purpose Consents
        else if (restriction === "Legitimate Interest required") {
          purposeHasConsent = false;
          // For flexible purposes with LegInt: add LegInt
          if (isFlexiblePurpose && hasLegitimateInterest && result.coreData.purposesLITransparency.includes(i)) {
            purposeHasLegitimateInterest = true;
          }
        }
      }
      
      // Only show purposes that are relevant for this vendor
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
    
    // Analyze Special Features
    const enhancedSpecialFeatures = [];
    for (const featureId of gvlVendor.specialFeatures || []) {
      const featureInfo = specialFeatures[featureId.toString()];
      if (!featureInfo) continue;
      
      // Has the user given consent for this Special Feature?
      const featureHasConsent = result.coreData.specialFeatureOptIns.includes(featureId);
      
      enhancedSpecialFeatures.push({
        id: featureId,
        name: featureInfo.name || `Special Feature ${featureId}`,
        description: featureInfo.description,
        isAllowed: true,
        hasConsent: featureHasConsent
      });
    }
    
    // Analyze Special Purposes
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
    
    // Analyze Features
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
    
    // Add the vendor to the results
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
  
  return {
    coreData: result.coreData,
    version: result.version,
    vendorResults
  };
}

/**
 * Filter purposes by status
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
 * Generate a summary of vendor consents
 */
export function generateVendorSummary(vendorResults: EnhancedVendorResult[]): {
  totalVendors: number;
  vendorsWithConsent: number;
  vendorsWithLegitimateInterest: number;
  purposesWithConsent: { [id: number]: number };  // ID: Number of vendors
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
    
    // Count purposes with consent
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
 * Check if a vendor has consent for a specific purpose
 */
export function vendorHasPurposeConsent(vendor: EnhancedVendorResult, purposeId: number): boolean {
  return vendor.purposes.some(p => 
    p.id === purposeId && p.hasConsent
  );
}

/**
 * Check if a vendor has legitimate interest for a specific purpose
 */
export function vendorHasPurposeLegitimateInterest(vendor: EnhancedVendorResult, purposeId: number): boolean {
  return vendor.purposes.some(p => 
    p.id === purposeId && p.hasLegitimateInterest
  );
} 