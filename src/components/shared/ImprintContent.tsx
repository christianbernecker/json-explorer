import React from 'react';

interface ImprintContentProps {
  isDarkMode: boolean;
}

const ImprintContent: React.FC<ImprintContentProps> = ({ isDarkMode }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Information according to § 5 TMG
        </h3>
        <p className="mt-2">Christian Bernecker</p>
        <p className="mt-3">
          <strong>Email:</strong> <a href="mailto:info@adtech-toolbox.com" className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}>
            info@adtech-toolbox.com
          </a>
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Responsible for Content
        </h3>
        <p className="mt-2">Christian Bernecker</p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          EU Online Dispute Resolution
        </h3>
        <p className="mt-2">
          The European Commission provides a platform for online dispute resolution (OS): 
          <a 
            href="https://ec.europa.eu/consumers/odr/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline ml-1`}
          >
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p className="mt-1">
          My email address can be found in this imprint.
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Disclaimer
        </h3>
        <p className="mt-2">
          The contents of this website have been created with the utmost care. However, the provider does not guarantee the accuracy, 
          completeness, and timeliness of the information provided. The use of the website's content is at the user's own risk.
        </p>
        <p className="mt-2">
          This website contains links to external websites over which the provider has no control. Therefore, the provider cannot 
          assume any liability for these external contents. The respective provider of the linked pages is always responsible for 
          the content of these pages.
        </p>
      </div>
      
      <div>
        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Copyright
        </h3>
        <p className="mt-2">
          The content and works created by the website operator on these pages are subject to German copyright law. The duplication, 
          processing, distribution, and any kind of exploitation outside the limits of copyright law require the written consent of 
          the respective author or creator.
        </p>
      </div>
    </div>
  );
};

export default ImprintContent; 