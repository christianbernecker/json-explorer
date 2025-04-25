import React from 'react';
import LegalPageLayout from './LegalPageLayout';

interface PrivacyPageProps {
  isDarkMode: boolean;
}

function PrivacyPage({ isDarkMode }: PrivacyPageProps) {
  return (
    <LegalPageLayout
      isDarkMode={isDarkMode}
      title="Privacy Policy | AdTech Toolbox"
      description="Privacy Policy for the AdTech Toolbox web application."
      canonicalUrl="https://www.adtech-toolbox.com/legal/privacy"
    >
      <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Data Privacy</h1>
      <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Privacy Policy</p>
      
      <div className="space-y-8">
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>1. Data Controller</h2>
          <p>Adtech Toolbox</p>
          <p>Email: <a href="mailto:info@adtech-toolbox.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">info@adtech-toolbox.com</a></p>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>2. Data Protection Officer</h2>
          <p>
            We have not appointed a Data Protection Officer as it is not required for our operations under Art. 37 GDPR. For all data protection related inquiries, please contact:
          </p>
          <p className="mt-2">
            Email: <a href="mailto:info@adtech-toolbox.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">info@adtech-toolbox.com</a>
          </p>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>3. Data Processing and Legal Basis</h2>
          <p>
            JSON Tools is designed to operate primarily client-side, processing data directly in your browser. No user data is transmitted to our servers during normal operation of the core functionality.
          </p>
          <p className="mt-2">
            When you use our tools to format or compare JSON or analyze VAST files, all processing happens locally on your device. The data you input is not sent to our servers.
          </p>
          <p className="mt-4 font-medium">Legal basis for processing:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>For the functionality of our website: Art. 6(1)(b) GDPR - processing is necessary for the performance of a contract</li>
            <li>For analytics and improving our service: Art. 6(1)(f) GDPR - legitimate interests</li>
            <li>For marketing (if applicable): Art. 6(1)(a) GDPR - consent</li>
          </ul>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>4. Data Storage and Retention</h2>
          <p>
            We use local storage to save your preferences (like dark mode) and history items. This data is stored only on your device and is not accessible to us.
          </p>
          <p className="mt-4 font-medium">Storage duration:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Local storage data: Until you clear your browser data or we update the application structure</li>
            <li>Server logs (for technical purposes): 30 days</li>
            <li>Analytics data (if applicable): 14 months in anonymized form</li>
          </ul>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>5. Cookies and Tracking</h2>
          <p>
            We may use cookies for essential functionality and analytics purposes. Third-party vendors, including Google, may use cookies to serve ads based on a user's prior visits to our website.
          </p>
          <p className="mt-4 font-medium">Types of cookies we use:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Essential cookies:</strong> Required for the basic functionality of the website</li>
            <li><strong>Preference cookies:</strong> Allow the website to remember your preferences</li>
            <li><strong>Statistics cookies:</strong> Help us understand how visitors interact with our website</li>
            <li><strong>Marketing cookies:</strong> Used to track visitors across websites for advertising purposes</li>
          </ul>
          <p className="mt-3">
            You can opt out of personalized advertising by visiting <a href="http://www.aboutads.info" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">www.aboutads.info</a>.
          </p>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>6. Third-Party Services and Data Transfer</h2>
          <p>We may use third-party services for analytics and advertising purposes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Google Analytics</li>
            <li>Google AdSense</li>
          </ul>
          <p className="mt-4 font-medium">Data transfer to third countries:</p>
          <p>
            Some of our service providers are based outside the EU/EEA. When we transfer your data to these providers, we ensure appropriate safeguards through Standard Contractual Clauses or adequacy decisions by the European Commission.
          </p>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Request information about your stored data (Art. 15 GDPR)</li>
            <li>Request the correction of incorrect data (Art. 16 GDPR)</li>
            <li>Request the deletion of your data (Art. 17 GDPR)</li>
            <li>Request the restriction of data processing (Art. 18 GDPR)</li>
            <li>Data portability (Art. 20 GDPR)</li>
            <li>Revoke your consent for future processing (Art. 7(3) GDPR)</li>
            <li>Object to data processing based on legitimate interests (Art. 21 GDPR)</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, please contact us at <a href="mailto:info@adtech-toolbox.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">info@adtech-toolbox.com</a>.
          </p>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>8. Right to Lodge a Complaint</h2>
          <p>
            You have the right to lodge a complaint with a supervisory authority if you believe that the processing of your personal data violates the GDPR. The responsible supervisory authority for data protection issues is the data protection authority in your country of residence or the location of the alleged infringement.
          </p>
        </section>
        
        <section>
          <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>9. Changes to this Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any material changes by posting the new privacy policy on this page.
          </p>
          <p className="mt-4 text-sm">
            Last updated: April 16, 2023
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

export default PrivacyPage; 