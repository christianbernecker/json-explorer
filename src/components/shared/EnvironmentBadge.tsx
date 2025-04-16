import React from 'react';
import { APP_VERSION_NEXT } from '../../constants';

interface EnvironmentBadgeProps {
  environment: string;
  version: string;
}

const EnvironmentBadge: React.FC<EnvironmentBadgeProps> = ({ environment, version }) => {
  // Determine badge color and style based on environment
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

  // Determine if we should add the preview text for staging/development
  const isPreviewEnvironment = environment.toLowerCase() !== 'production';
  const isStaging = environment.toLowerCase() === 'staging';

  return (
    <div className={`${getBadgeColor()} text-white text-xs font-medium py-1 px-2 rounded-md inline-flex items-center`}>
      {version}
      {isPreviewEnvironment && (
        <span className="ml-1">
          {isStaging ? `(${APP_VERSION_NEXT} Preview)` : `(${environment})`}
        </span>
      )}
    </div>
  );
};

export default EnvironmentBadge; 