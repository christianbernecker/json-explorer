import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './shared';
import { SEO } from './seo';

interface NotFoundProps {
  isDarkMode: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({ isDarkMode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SEO 
        canonical="https://www.adtech-toolbox.com/404"
        title="Page Not Found | AdTech Toolbox"
        description="The page you are looking for could not be found."
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The page you are looking for does not exist.
        </p>
        <Link to="/">
          <Button>
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 