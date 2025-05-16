import React from 'react';
import { Section } from './shared';
import ApplicationHeader from './ApplicationHeader';
import { Helmet } from 'react-helmet-async';

interface HelpPageProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <Helmet>
        <title>Help & Documentation | AdTech Toolbox</title>
        <meta 
          name="description" 
          content="Comprehensive documentation and help for using AdTech Toolbox's features and tools." 
        />
      </Helmet>
      
      <ApplicationHeader 
        title="Help & Documentation" 
        subtitle="Learn how to use AdTech Toolbox effectively"
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        activeTab="guide"
      />
      
      <div className="py-6 px-4 md:px-8 space-y-6">
        <Section 
          title="Getting Started" 
          isDarkMode={isDarkMode}
          className="mb-6"
        >
          <div className="space-y-4">
            <p>
              AdTech Toolbox is a collection of browser-based tools designed for AdTech professionals. 
              All processing is done locally in your browser - no data is sent to our servers, ensuring maximum privacy and security.
            </p>
            
            <h3 className="text-lg font-semibold mt-4">Available Tools:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>JSON Explorer</strong> - Validate, format, and explore JSON data. Extract and decode VAST tags.
              </li>
              <li>
                <strong>Data Visualizer</strong> - Transform raw data into charts and graphs for better insights.
              </li>
              <li>
                <strong>TCF Decoder</strong> - Decode and analyze TCF (Transparency & Consent Framework) consent strings.
              </li>
            </ul>
          </div>
        </Section>
        
        <Section 
          title="JSON Explorer" 
          isDarkMode={isDarkMode}
          className="mb-6"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>JSON validation and formatting</li>
              <li>VAST tag extraction and visualization</li>
              <li>JSON diff comparison</li>
              <li>Syntax highlighting</li>
              <li>History tracking</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-4">How to Use:</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Paste your JSON data into the input field</li>
              <li>Click "Format" to validate and pretty-print the JSON</li>
              <li>If your JSON contains VAST tags, they will be automatically detected and displayed</li>
              <li>Use the search feature to find specific content</li>
              <li>Your history is saved locally for quick access to previous work</li>
            </ol>
          </div>
        </Section>
        
        <Section 
          title="TCF Decoder" 
          isDarkMode={isDarkMode}
          className="mb-6"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Decode TCF strings from IAB Europe's Transparency & Consent Framework</li>
              <li>Support for TCF v2.0 and v2.2</li>
              <li>View decoded core information, global consents, and vendor details</li>
              <li>Explore the Global Vendor List (GVL)</li>
              <li>Track history of decoded strings</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-4">How to Use:</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Paste a TCF consent string into the input field</li>
              <li>Click "Decode String" to analyze the content</li>
              <li>Review the decoded information including core data, purposes, and vendor details</li>
              <li>Switch to the GVL Explorer tab to browse the complete vendor list</li>
              <li>Use the search function to find specific vendors</li>
            </ol>
            
            <div className="mt-4 p-4 border rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
              <h4 className="font-medium">Technical Note:</h4>
              <p className="text-sm mt-1">
                The TCF Decoder follows the IAB Europe's TCF specification regarding Legitimate Interest (LI) handling. 
                LI is enabled by default for all vendors that have registered for it, unless it is explicitly disabled
                in the TCF string. This differs from Consent, which is disabled by default.
              </p>
            </div>
          </div>
        </Section>
        
        <Section 
          title="Data Visualizer" 
          isDarkMode={isDarkMode}
          className="mb-6"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Convert JSON or CSV data into visual charts</li>
              <li>Multiple chart types: bar, line, pie, scatter plots</li>
              <li>Customizable visualization settings</li>
              <li>Interactive data exploration</li>
              <li>Export charts as images</li>
            </ul>
            
            <h3 className="text-lg font-semibold mt-4">How to Use:</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Paste your data or upload a file</li>
              <li>Select a chart type that best represents your data</li>
              <li>Configure dimensions, measures, and other chart settings</li>
              <li>Interact with the generated chart to explore your data</li>
              <li>Export or save your visualization as needed</li>
            </ol>
          </div>
        </Section>
        
        <Section 
          title="FAQ" 
          isDarkMode={isDarkMode}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Is my data secure?</h3>
              <p className="mt-1">
                Yes, all processing happens directly in your browser. No data is sent to our servers unless explicitly stated.
                Your history and preferences are stored in your browser's local storage.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">How do I report bugs or request features?</h3>
              <p className="mt-1">
                Please contact us via GitHub by opening an issue in our repository, or reach out through our contact page.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Does AdTech Toolbox work offline?</h3>
              <p className="mt-1">
                Once loaded, most features will work without an internet connection. However, certain features like 
                fetching external VAST tags or loading the Global Vendor List require internet access.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Is AdTech Toolbox free to use?</h3>
              <p className="mt-1">
                Yes, all current features are free to use. We may introduce premium features in the future, 
                but the core functionality will remain free.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default HelpPage; 