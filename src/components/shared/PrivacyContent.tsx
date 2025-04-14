import React from 'react';

interface PrivacyContentProps {
  isDarkMode: boolean;
}

const PrivacyContent: React.FC<PrivacyContentProps> = ({ isDarkMode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          1. Data Controller
        </h3>
        <p className="mt-2">
          Adtech Toolbox<br />
          Email: <a href="mailto:info@adtech-toolbox.com" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            info@adtech-toolbox.com
          </a>
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          2. Data Protection Officer
        </h3>
        <p className="mt-2">
          We have not appointed a Data Protection Officer as it is not required for our operations under Art. 37 GDPR.
          For all data protection related inquiries, please contact:
        </p>
        <p className="mt-1">
          Email: <a href="mailto:info@adtech-toolbox.com" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            info@adtech-toolbox.com
          </a>
        </p>
      </div>

      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          3. Data Processing and Legal Basis
        </h3>
        <p className="mt-2">
          JSON Tools is designed to operate primarily client-side, processing data directly in your browser. 
          No user data is transmitted to our servers during normal operation of the core functionality.
        </p>
        <p className="mt-2">
          When you use our tools to format or compare JSON or analyze VAST files, all processing happens locally 
          on your device. The data you input is not sent to our servers.
        </p>
        <p className="mt-2">
          <strong>Legal basis for processing:</strong>
        </p>
        <ul className="list-disc ml-5 mt-1">
          <li>For the functionality of our website: Art. 6(1)(b) GDPR - processing is necessary for the performance of a contract</li>
          <li>For analytics and improving our service: Art. 6(1)(f) GDPR - legitimate interests</li>
          <li>For marketing (if applicable): Art. 6(1)(a) GDPR - consent</li>
        </ul>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          4. Data Storage and Retention
        </h3>
        <p className="mt-2">
          We use local storage to save your preferences (like dark mode) and history items. 
          This data is stored only on your device and is not accessible to us.
        </p>
        <p className="mt-2">
          <strong>Storage duration:</strong>
        </p>
        <ul className="list-disc ml-5 mt-1">
          <li>Local storage data: Until you clear your browser data or we update the application structure</li>
          <li>Server logs (for technical purposes): 30 days</li>
          <li>Analytics data (if applicable): 14 months in anonymized form</li>
        </ul>
      </div>
      
      {/* Usercentrics Data Processing Services Embedding */}
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          5. Data Processing Services
        </h3>
        <p className="mt-2">
          Below you will find information about all data processing services we use on this website:
        </p>
        <div className="mt-4 p-4 rounded border border-gray-300 dark:border-gray-600">
          <div className="uc-embed" uc-embed-type="category"></div>
        </div>
      </div>
      
      {/* Tracker Declaration */}
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          6. Tracker Information
        </h3>
        <p className="mt-2">
          The following is a list of all trackers used on our website:
        </p>
        <div className="mt-4 p-4 rounded border border-gray-300 dark:border-gray-600">
          <div className="uc-embed-tracker"></div>
        </div>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          7. Cookies and Tracking
        </h3>
        <p className="mt-2">
          We may use cookies for essential functionality and analytics purposes. Third-party vendors, 
          including Google, may use cookies to serve ads based on a user's prior visits to our website.
        </p>
        <p className="mt-2">
          <strong>Types of cookies we use:</strong>
        </p>
        <ul className="list-disc ml-5 mt-1">
          <li><strong>Essential cookies:</strong> Required for the basic functionality of the website</li>
          <li><strong>Preference cookies:</strong> Allow the website to remember your preferences</li>
          <li><strong>Statistics cookies:</strong> Help us understand how visitors interact with our website</li>
          <li><strong>Marketing cookies:</strong> Used to track visitors across websites for advertising purposes</li>
        </ul>
        <p className="mt-2">
          You can opt out of personalized advertising by visiting <a href="https://www.aboutads.info/choices/" 
          target="_blank" rel="noopener noreferrer" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            www.aboutads.info
          </a>.
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          8. Third-Party Services and Data Transfer
        </h3>
        <p className="mt-2">
          We may use third-party services for analytics and advertising purposes:
        </p>
        <ul className="list-disc ml-5 mt-1">
          <li>Google Analytics</li>
          <li>Google AdSense</li>
        </ul>
        <p className="mt-2">
          <strong>Data transfer to third countries:</strong> Some of our service providers are based outside the EU/EEA. 
          When we transfer your data to these providers, we ensure appropriate safeguards through Standard Contractual Clauses 
          or adequacy decisions by the European Commission.
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          9. Your Rights
        </h3>
        <p className="mt-2">You have the right to:</p>
        <ul className="list-disc ml-5 mt-2">
          <li>Request information about your stored data (Art. 15 GDPR)</li>
          <li>Request the correction of incorrect data (Art. 16 GDPR)</li>
          <li>Request the deletion of your data (Art. 17 GDPR)</li>
          <li>Request the restriction of data processing (Art. 18 GDPR)</li>
          <li>Data portability (Art. 20 GDPR)</li>
          <li>Revoke your consent for future processing (Art. 7(3) GDPR)</li>
          <li>Object to data processing based on legitimate interests (Art. 21 GDPR)</li>
        </ul>
        <p className="mt-2">
          To exercise these rights, please contact us at <a href="mailto:info@adtech-toolbox.com" 
          className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            info@adtech-toolbox.com
          </a>.
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          10. Right to Lodge a Complaint
        </h3>
        <p className="mt-2">
          You have the right to lodge a complaint with a supervisory authority if you believe that the processing of your 
          personal data violates the GDPR. The responsible supervisory authority for data protection issues is the data 
          protection authority in your country of residence or the location of the alleged infringement.
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          11. Changes to this Privacy Policy
        </h3>
        <p className="mt-2">We may update this privacy policy from time to time to reflect changes in our practices or for legal reasons. 
          We will notify you of any material changes by posting the new privacy policy on this page.</p>
        <p className="mt-2">Last updated: {new Date().toISOString().split('T')[0]}</p>
      </div>
    </div>
  );
};

export default PrivacyContent; 