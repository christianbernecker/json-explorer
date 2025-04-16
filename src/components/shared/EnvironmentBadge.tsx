import React from 'react';

interface EnvironmentBadgeProps {
  environment: string;
  version: string;
}

const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({ environment, version }) => {
  // Determine badge color based on environment
  const getBadgeColor = () => {
    switch (environment.toLowerCase()) {
      case 'production':
        return 'bg-green-600';
      case 'staging':
        return 'bg-orange-500';
      case 'development':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`${getBadgeColor()} text-white text-xs font-medium py-1 px-2 rounded-md inline-flex items-center`}>
      {version}
      {environment.toLowerCase() !== 'production' && (
        <span className="ml-1">({environment})</span>
      )}
    </div>
  );
};

export default EnvironmentBadge; 