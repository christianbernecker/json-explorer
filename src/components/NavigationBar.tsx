import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar: React.FC = () => {
  // Basic styling, assuming Tailwind CSS is setup
  const linkStyle = "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium";

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              AdTech Toolbox
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={linkStyle}>Homepage</Link>
              <Link to="/apps" className={linkStyle}>Apps</Link>
              {/* Add other main navigation links here if needed */}
            </div>
          </div>
          <div className="hidden md:block">
            {/* Right side links like Legal, could also be in a footer */}
            <Link to="/legal/imprint" className={linkStyle}>Imprint</Link>
            <Link to="/legal/privacy" className={linkStyle}>Privacy</Link>
          </div>
          {/* Mobile menu button can be added here */}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar; 