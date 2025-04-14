import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  additionalMetaTags?: Array<{ name: string; content: string }>;
}

const SEO: React.FC<SEOProps> = ({
  title = 'JSON Validator, Formatter & Diff Tool | Online JSON and VAST Analyzer',
  description = 'Free tools for comparing, validating, and analyzing JSON files and VAST AdTags. Easy to use with no installation required.',
  canonical = 'https://www.adtech-toolbox.com/json-explorer',
  ogType = 'website',
  ogImage = '/json-explorer/og-image.png',
  additionalMetaTags = []
}) => {
  // Determine current URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : canonical;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      
      {/* Preload Critical Assets */}
      <link rel="preload" href="/json-explorer/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/json-explorer/og-image.png" as="image" />
      
      {/* Performance & Security */}
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Additional Meta Tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta key={index} name={tag.name} content={tag.content} />
      ))}
    </Helmet>
  );
};

export default SEO; 