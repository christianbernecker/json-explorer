import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  appVersion: string;
  isDarkMode?: boolean;
}

const StructuredData: React.FC<StructuredDataProps> = ({ appVersion, isDarkMode }) => {
  // Standard WebApplication Schema
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Explorer",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "description": "Free online tools for comparing, validating, and analyzing JSON files and VAST AdTags. Easy to use with no installation required.",
    "softwareVersion": appVersion,
    "datePublished": "2023-01-15",
    "author": {
      "@type": "Person",
      "name": "Christian Bernecker"
    },
    "potentialAction": {
      "@type": "UseAction",
      "target": "https://www.adtech-toolbox.com/json-explorer/"
    },
    "featureList": [
      "JSON Validation and Formatting",
      "JSON Object Comparison",
      "VAST AdTag Analysis",
      "Syntax Highlighting",
      "Dark Mode"
    ]
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "AdTech Toolbox",
        "item": "https://www.adtech-toolbox.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "JSON Explorer",
        "item": "https://www.adtech-toolbox.com/json-explorer/"
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(webApplicationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default StructuredData; 