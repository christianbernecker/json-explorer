import React from 'react';
import { SEO } from './seo';

function Homepage() {
  return (
    <div>
      <SEO canonical="https://www.adtech-toolbox.com/" />
      <h1>Homepage</h1>
      <p>Welcome to the AdTech Toolbox!</p>
      {/* Link to /apps overview will go here */}
    </div>
  );
}

export default Homepage; 