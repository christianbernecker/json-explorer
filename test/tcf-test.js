// TCF String Test-Script zur genaueren Analyse des Decodierungsverhaltens
const { TCString } = require('@iabtcf/core');

// Der TCF-String aus dem Screenshot - in einer einzigen Zeile
const tcfString = "COPBEALOPBEALAKAUADECPACMAKABgA4ACCAIYAYgAwABAAsABQADAAGkANIA1AB6ADyAIEAQgAjABHACUAFEAKoAVwAsgBbgC8AGKAMoAZ4A4QB6AEKAIYAhoBDwCIAEWAJIASkAlQBLgCaAE8AKIAp4BZgDKgGaANQAbIA5QDnAHUAPuAfYA_QCIAEVAI6AkIBIgCUgExAJoATYAnYBPQCnAFWALGAXCAwkBhYDDgGJAMcAZEAyYBlQDLwGcgM_AaGA0QBssDbgNwAboA3iBwIDhQHKgOYAdEA6UB2gDtgHegPCgeSA9MB6oD1wHtgP3Af4NAQAYGBQEH";

// Alternative Strings zum Testen
const testStrings = [
    // Beispiel vom IAB TCF
    "COw4XqLOw4XqLAAAAAENAXCAAP-YAHAAAAAAAAAA",
    // Aus dem ersten Screenshot
    "COPBEALOPBEALAKAUADECPACMAKABgA4ACCAIYAYgAwABAAsABQADAAGkANIA1AB6ADyAIEAQgAjABHACUAFEAKoAVwAsgBbgC8AGKAMoAZ4A4QB6AEKAIYAhoBDwCIAEWAJIASkAlQBLgCaAE8AKIAp4BZgDKgGaANQAbIA5QDnAHUAPuAfYA_QCIAEVAI6AkIBIgCUgExAJoATYAnYBPQCnAFWALGAXCAwkBhYDDgGJAMcAZEAyYBlQDLwGcgM_AaGA0QBssDbgNwAboA3iBwIDhQHKgOYAdEA6UB2gDtgHegPCgeSA9MB6oD1wHtgP3Af4NAQAYGBQEH"
];

// Funktion für ausführliches Debug-Logging
function debugTCFString(tcfString, name = "Default") {
    console.log("===== TCF STRING ANALYZER =====");
    console.log(`Testing string: ${name}`);
    console.log("Input String:", tcfString);
    
    try {
        // 1. Decodieren des TCF-Strings
        const decodedData = TCString.decode(tcfString);
        
        // 2. Basisdaten ausgeben
        console.log("\n=== BASIC INFO ===");
        console.log("TCF Version:", decodedData.version);
        console.log("Created:", new Date(decodedData.created).toISOString());
        console.log("Last Updated:", new Date(decodedData.lastUpdated).toISOString());
        console.log("CMP ID:", decodedData.cmpId);
        console.log("CMP Version:", decodedData.cmpVersion);
        
        // 3. Purpose Consent Daten
        console.log("\n=== PURPOSE CONSENT ===");
        const purposeConsents = Array.from(decodedData.purposeConsents || []).map(Number);
        console.log("Purpose Consents:", purposeConsents);
        
        const purposeLIs = Array.from(decodedData.purposeLegitimateInterests || []).map(Number);
        console.log("Purpose Legitimate Interests:", purposeLIs);
        
        const specialFeatures = Array.from(decodedData.specialFeatureOptins || []).map(Number);
        console.log("Special Feature Opt-ins:", specialFeatures);
        
        // 4. Spezifische Vendor-Analyse
        console.log("\n=== VENDOR ANALYSIS ===");
        const targetVendors = [136, 137, 44];
        
        targetVendors.forEach(vendorId => {
            console.log(`\nVendor ${vendorId}:`);
            
            // Vendor Consent Status
            const hasVendorConsent = decodedData.vendorConsents?.has?.(vendorId);
            console.log(`- Vendor Consent:`, hasVendorConsent);
            
            // Vendor Legitimate Interest Status
            const hasVendorLI = decodedData.vendorLegitimateInterests?.has?.(vendorId);
            console.log(`- Vendor LegInt:`, hasVendorLI);
            
            // 5. Effektiver Consent (Kombination aus Vendor Consent UND Purpose Consent)
            if (hasVendorConsent) {
                console.log(`- Vendor hat grundsätzlich Consent`);
                console.log(`- Purpose Consents: ${purposeConsents.join(', ')}`);
                
                // Da wir die GVL nicht haben, können wir hier keine Überschneidung prüfen
                console.log(`- HINWEIS: Ohne GVL können wir nicht prüfen, welche Purposes der Vendor nutzen darf`);
                console.log(`  Für eine vollständige Analyse wird die GVL benötigt`);
            } else {
                console.log(`- Vendor hat keinen grundsätzlichen Consent`);
            }
            
            // Zusätzliche alternative Prüfmethoden
            try {
                // Versuch, andere Methoden zu testen, falls vorhanden
                console.log("\n=== ALTERNATIVE CHECKS ===");
                
                if (typeof decodedData.vendorConsents.isSet === 'function') {
                    console.log("Using isSet() method:");
                    console.log(`- vendorConsents.isSet(${vendorId}):`, decodedData.vendorConsents.isSet(vendorId));
                }
                
                if (typeof decodedData.vendorConsents.get === 'function') {
                    console.log("Using get() method:");
                    console.log(`- vendorConsents.get(${vendorId}):`, decodedData.vendorConsents.get(vendorId));
                }
                
                // Direktes Auslesen der internen Datenstrukturen, falls möglich
                console.log("Internal data structure check:");
                if (decodedData.vendorConsents instanceof Map) {
                    console.log(`- vendorConsents Map has(${vendorId}):`, decodedData.vendorConsents.has(vendorId));
                } else if (decodedData.vendorConsents instanceof Set) {
                    console.log(`- vendorConsents Set has(${vendorId}):`, decodedData.vendorConsents.has(vendorId));
                } else {
                    console.log(`- vendorConsents is of type:`, typeof decodedData.vendorConsents);
                    if (typeof decodedData.vendorConsents === 'object') {
                        console.log("Keys:", Object.keys(decodedData.vendorConsents));
                    }
                }
            } catch (err) {
                console.log("Error in alternative checks:", err.message);
            }
        });
        
        // 6. Gesamtergebnis
        console.log("\n=== CONCLUSION ===");
        console.log("Der Vendor 136 hat grundsätzlich Consent:", decodedData.vendorConsents?.has?.(136));
        console.log("Der Vendor 137 hat grundsätzlich Consent:", decodedData.vendorConsents?.has?.(137));
        console.log("Der Vendor 44 hat grundsätzlich Consent:", decodedData.vendorConsents?.has?.(44));
        
        return true;
    } catch (error) {
        console.error("ERROR:", error.message);
        console.error(error.stack);
        return false;
    }
}

// Teste mit dem Hauptstring
console.log("\n\n========== HAUPTSTRING ==========\n\n");
const mainResult = debugTCFString(tcfString, "Hauptstring");

// Teste alternative Strings
if (!mainResult) {
    console.log("\n\n========== ALTERNATIVE STRINGS ==========\n\n");
    testStrings.forEach((str, index) => {
        console.log(`\n\n---------- TEST STRING ${index + 1} ----------\n\n`);
        debugTCFString(str, `Teststring ${index + 1}`);
    });
}

// Die Ausgabe dieses Skripts sollte helfen zu verstehen, 
// warum die aktuelle Implementierung nicht die erwarteten Ergebnisse liefert
