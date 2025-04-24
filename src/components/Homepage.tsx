import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from './seo';

interface HomepageProps {
  isDarkMode: boolean;
}

function Homepage({ isDarkMode }: HomepageProps) {
  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <SEO 
        canonical="https://www.adtech-toolbox.com/" 
        title="AdTech Toolbox - Developer Tools for AdTech Professionals"
        description="Powerful web-based tools for AdTech professionals. Validate JSON, explore VAST tags, and visualize data in your browser."
      />
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
          AdTech Toolbox
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Powerful web-based tools designed for AdTech professionals, helping you validate, explore, and visualize your data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* JSON Explorer Card */}
        <Link 
          to="/apps/json-explorer" 
          className="group block rounded-xl overflow-hidden shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="p-8 bg-white dark:bg-gray-800">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">JSON Explorer</h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Validate, format, and explore JSON data with our powerful editor. Analyze VAST ad tags and compare JSON structures with an intuitive diff viewer.
            </p>
            
            <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
              <span className="font-medium">Open Tool</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </Link>
        
        {/* Data Visualizer Card - with same color scheme but different design pattern */}
        <Link 
          to="/apps/data-visualizer" 
          className="group block rounded-xl overflow-hidden shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="h-2 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
          <div className="p-8 bg-white dark:bg-gray-800 relative overflow-hidden">
            {/* Background pattern for visual distinction */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1.5" fill="currentColor" className="text-indigo-500" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            <div className="relative">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center text-white mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Data Visualizer</h2>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Transform raw data into beautiful visualizations. Create charts, graphs, and interactive dashboards to gain insights from your AdTech data.
              </p>
              
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors">
                <span className="font-medium">Open Tool</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Features Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">Why Choose AdTech Toolbox?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Browser-Based</h3>
            <p className="text-gray-600 dark:text-gray-300">All processing happens in your browser. No data is sent to our servers, ensuring maximum privacy.</p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Fast & Efficient</h3>
            <p className="text-gray-600 dark:text-gray-300">Built with performance in mind, our tools work quickly even with large data sets.</p>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Modern Interface</h3>
            <p className="text-gray-600 dark:text-gray-300">Clean, intuitive design with dark mode support and responsive layout for all devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage; 