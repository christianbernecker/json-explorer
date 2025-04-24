import React from 'react';
import { SEO } from './seo';

function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <SEO 
        canonical="https://www.adtech-toolbox.com/legal/privacy" 
        title="Privacy Policy | AdTech Toolbox"
        description="Privacy Policy for the AdTech Toolbox web application."
      />
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">1. Introduction</h2>
            <p>
              At AdTech Toolbox, we respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">2. Data We Collect</h2>
            <p>
              The AdTech Toolbox applications (JSON Explorer and Data Visualizer) process all data locally in your browser. 
              No data that you input into our tools is sent to our servers or stored by us in any way.
            </p>
            <p className="mt-2">
              We may collect anonymous usage statistics to help us improve our tools, such as:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Browser type and version</li>
              <li>Time and duration of visits</li>
              <li>Pages viewed</li>
              <li>Referring website</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">3. Cookies</h2>
            <p>
              We use essential cookies to ensure the proper functioning of our website. These cookies are necessary for 
              the website to work properly and cannot be switched off in our systems.
            </p>
            <p className="mt-2">
              We do not use any advertising or tracking cookies unless you explicitly consent to them.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">4. Your Rights</h2>
            <p>
              Under data protection laws, you have rights including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your right of access</li>
              <li>Your right to rectification</li>
              <li>Your right to erasure</li>
              <li>Your right to restriction of processing</li>
              <li>Your right to data portability</li>
              <li>Your right to object</li>
            </ul>
            <p className="mt-2">
              If you wish to exercise any of these rights, please contact us.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">5. Contact Information</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
            </p>
            <p className="mt-2 font-medium">
              Email: privacy@adtech-toolbox.com
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">6. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. The updated version will be indicated by an updated 
              "Last updated" date and the updated version will be effective as soon as it is accessible.
            </p>
            <p className="mt-4 text-sm">
              Last updated: April 24, 2023
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage; 