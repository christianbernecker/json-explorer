import React from 'react';
import { SEO } from './seo';

function AppOverview() {
  return (
    <div>
      <SEO canonical="https://www.adtech-toolbox.com/apps" />
      <h1>Available Apps</h1>
      <ul>
        <li>{/* Link to /apps/json-explorer */}JSON Explorer</li>
        <li>{/* Link to /apps/data-visualizer */}Data Visualizer</li>
        {/* More apps can be listed here */}
      </ul>
    </div>
  );
}

export default AppOverview; 