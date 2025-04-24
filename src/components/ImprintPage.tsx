import React from 'react';
import { SEO } from './seo';

function ImprintPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <SEO 
        canonical="https://www.adtech-toolbox.com/legal/imprint" 
        title="Imprint | AdTech Toolbox"
        description="Legal information and imprint for the AdTech Toolbox web application."
      />
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Imprint</h1>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Information According to § 5 TMG</h2>
            <div className="space-y-2">
              <p>AdTech Toolbox</p>
              <p>Musterstraße 123</p>
              <p>12345 Musterstadt</p>
              <p>Germany</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Contact</h2>
            <div className="space-y-2">
              <p>Phone: +49 123 456789</p>
              <p>Email: contact@adtech-toolbox.com</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Represented by</h2>
            <p>Jane Doe, CEO</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">VAT ID</h2>
            <p>VAT ID Number according to § 27 a of the Value Added Tax Act:</p>
            <p>DE123456789</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Responsible for Content</h2>
            <p>Jane Doe</p>
            <p>AdTech Toolbox</p>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Dispute Resolution</h2>
            <p>
              The European Commission provides a platform for online dispute resolution (OS):
              <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-500 hover:text-blue-700 ml-1" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Liability for Content</h2>
            <p>
              As a service provider, we are responsible for our own content on these pages according to general laws. 
              However, we are not obliged to monitor transmitted or stored third-party information or to investigate 
              circumstances that indicate illegal activity.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ImprintPage; 