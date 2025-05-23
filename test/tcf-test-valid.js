// TCF String Test-Script mit einem bekannten gültigen String
const { TCString, GVL } = require('@iabtcf/core');

// Bekannter, gültiger TCF-String aus der Dokumentation
const validTCFString = "COw4XqLOw4XqLAAAAAENAXCAAP-YAHAAAAAAA";

// Alternative Test-Strings
const testStrings = [
    // Ein anderer Beispiel-String aus der Dokumentation
    "COtybn4PA_zT4KjACBENAPCIAEBAAECAAIAAAAAAAAAA",
];

// Funktion für ausführliches Debug-Logging
async function debugTCFString(tcfString, name = "Default") {
    console.log("===== TCF STRING ANALYZER =====");
    console.log(`Testing string: ${name}`);
    console.log("Input String:", tcfString);
    
    try {
        // 1. Decodieren des TCF-Strings
        const decodedData = TCString.decode(tcfString);
        
        console.log("\n=== DECODED TCF STRING OBJECT ===");
        console.log(JSON.stringify(decodedData, null, 2));
        
        // 2. Basisdaten ausgeben
        console.log("\n=== BASIC INFO ===");
        console.log("TCF Version:", decodedData.version);
        console.log("Created:", new Date(decodedData.created).toISOString());
        console.log("Last Updated:", new Date(decodedData.lastUpdated).toISOString());
        console.log("CMP ID:", decodedData.cmpId);
        console.log("CMP Version:", decodedData.cmpVersion);
        
        // 3. Purpose Consent Daten
        console.log("\n=== PURPOSE CONSENT ===");
        console.log("Purpose Consents (object):", decodedData.purposeConsents);
        
        // 4. Prüfen der Methoden zum Abrufen des Vendor-Consents
        const vendorIds = [136, 137, 44]; 
        
        console.log("\n=== VENDOR CONSENT METHODS ===");
        console.log("Available vendor consent methods:", Object.keys(decodedData.vendorConsents));
        
        vendorIds.forEach(id => {
            console.log(`\nChecking consent for vendor ${id}:`);
            
            // Prüfe mit has() Methode
            if (typeof decodedData.vendorConsents.has === 'function') {
                console.log(`- vendorConsents.has(${id}):`, decodedData.vendorConsents.has(id));
            }
            
            // Prüfe mit get() Methode
            if (typeof decodedData.vendorConsents.get === 'function') {
                console.log(`- vendorConsents.get(${id}):`, decodedData.vendorConsents.get(id));
            }
            
            // Prüfe mit isSet() Methode
            if (typeof decodedData.vendorConsents.isSet === 'function') {
                console.log(`- vendorConsents.isSet(${id}):`, decodedData.vendorConsents.isSet(id));
            }
            
            // Direkte Abfrage als Objekt
            console.log(`- vendorConsents[${id}]:`, decodedData.vendorConsents[id]);
        });
        
        // 5. Prüfe Purpose Consents
        console.log("\n=== PURPOSE CONSENT METHODS ===");
        console.log("Available purpose consent methods:", Object.keys(decodedData.purposeConsents));
        
        if (typeof decodedData.purposeConsents.has === 'function') {
            for (let i = 1; i <= 10; i++) {
                console.log(`- purposeConsents.has(${i}):`, decodedData.purposeConsents.has(i));
            }
        }
        
        return true;
    } catch (error) {
        console.error("ERROR:", error.message);
        console.error(error.stack);
        return false;
    }
}

// Teste mit bekanntem gültigen String
console.log("\n\n========== KNOWN VALID STRING ==========\n\n");
debugTCFString(validTCFString, "Known valid string");

// Teste alternative Strings
console.log("\n\n========== ALTERNATIVE STRINGS ==========\n\n");
testStrings.forEach((str, index) => {
    console.log(`\n\n---------- TEST STRING ${index + 1} ----------\n\n`);
    debugTCFString(str, `Test string ${index + 1}`);
}); 