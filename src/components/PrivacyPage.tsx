import React from 'react';
import { SEO } from './seo';

function PrivacyPage() {
  return (
    <div>
      <SEO 
        canonical="https://www.adtech-toolbox.com/legal/privacy" 
        title="Privacy Policy | AdTech Toolbox"
      />
      <h1>Privacy Policy</h1>
      <p>Details about the privacy policy go here.</p>
    </div>
  );
}

export default PrivacyPage; 