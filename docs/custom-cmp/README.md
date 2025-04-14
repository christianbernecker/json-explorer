# Custom TCF 2.0 Consent Management Platform

This directory contains documentation for our custom TCF 2.0 compliant Consent Management Platform (CMP) implementation.

## Overview

Our CMP is built using the open-source [Klaro](https://github.com/kiprotect/klaro) library and extended with TCF 2.0 support. It provides:

1. **TCF 2.0 Compliance**: Implements the IAB Europe Transparency & Consent Framework v2.0
2. **Custom UI/UX**: Styled to match our application's design system
3. **Multi-language support**: Available in English and German
4. **Dark/Light Mode**: Adapts to the user's preferred color scheme

## Implementation Details

### Structure

The CMP implementation is located in the `/src/cmp` directory with the following structure:

- `index.tsx` - Main component and API exports
- `config.ts` - Klaro configuration with TCF 2.0 settings
- `styles.css` - Custom styling for the CMP
- `/docs/custom-cmp/` - Documentation

### Usage

To use the CMP in your components:

```jsx
// Import the ConsentManager component
import ConsentManager from './cmp';

// Add it to your app
function App() {
  return (
    <div>
      <ConsentManager />
      {/* Rest of your app */}
    </div>
  );
}
```

### API

The CMP exports several utility functions:

1. **Check if a service has consent**:
   ```typescript
   import { hasConsent } from './cmp';
   
   if (hasConsent('analytics')) {
     // Initialize analytics
   }
   ```

2. **Check if a TCF purpose has consent**:
   ```typescript
   import { hasPurposeConsent, TCF_PURPOSES } from './cmp';
   
   async function checkPurposeConsent() {
     const hasPersonalizationConsent = await hasPurposeConsent(TCF_PURPOSES.PERSONALIZED_ADS);
     if (hasPersonalizationConsent) {
       // Initialize personalized ads
     }
   }
   ```

3. **Open the consent manager programmatically**:
   ```typescript
   import { openConsentManager } from './cmp';
   
   <button onClick={openConsentManager}>
     Manage Cookie Preferences
   </button>
   ```

## TCF 2.0 Compliance

The CMP implements the TCF 2.0 specification with:

1. **Purpose Management**: All standard TCF 2.0 purposes (1-10) and special features
2. **Vendor Management**: Integration with the Global Vendor List
3. **Consent String**: Generation and storage of TCF 2.0 consent strings
4. **TCF API**: Implementation of the `__tcfapi()` interface

## Customization

To customize the CMP, you can modify:

1. **`config.ts`**: Change default settings, purposes, and services
2. **`styles.css`**: Adjust the styling to match your design system

## Future Improvements

1. Add support for upgrading to TCF 2.2
2. Improve vendor list management with caching
3. Add analytics for consent rates
4. Implement A/B testing for consent UI

## Resources

- [IAB TCF v2.0 Specification](https://iabeurope.eu/tcf-2-0/)
- [Klaro Documentation](https://kiprotect.com/docs/klaro) 
- [IAB TCF CMP Validator](https://cmpvalidator.consensu.org/) 