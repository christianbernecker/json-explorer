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
        <p className="mb-6 text-gray-600 dark:text-gray-300">Legal Information</p>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Information according to § 5 TMG</h2>
            <p>Christian Bernecker</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Email:</h2>
            <p><a href="mailto:info@adtech-toolbox.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">info@adtech-toolbox.com</a></p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Responsible for Content</h2>
            <p>Christian Bernecker</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">EU Online Dispute Resolution</h2>
            <p>
              The European Commission provides a platform for online dispute resolution (OS):
              <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-1" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              My email address can be found in this imprint.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Disclaimer</h2>
            <p>
              The contents of this website have been created with the utmost care. However, the provider does not guarantee the accuracy, completeness, and 
              timeliness of the information provided. The use of the website's content is at the user's own risk.
            </p>
            <p className="mt-3">
              This website contains links to external websites over which the provider has no control. Therefore, the provider cannot assume any liability for these 
              external contents. The respective provider of the linked pages is always responsible for the content of these pages.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Copyright</h2>
            <p>
              The content and works created by the website operator on these pages are subject to German copyright law. The duplication, processing, 
              distribution, and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator.
            </p>
          </section>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2023 JSON Explorer | <a href="/legal/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">Privacy Policy</a> | <a href="/legal/imprint" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">Contact</a>
        </div>
      </div>
    </div>
  );
}

export default ImprintPage; 