import React from 'react';
import { useParams } from 'react-router-dom';

const Legal: React.FC = () => {
  const { page } = useParams<{ page: string }>();

  const renderContent = () => {
    switch (page) {
      case 'privacy':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose dark:prose-invert">
              <p>
                This privacy policy describes how we handle your personal data when you use our JSON Explorer application.
              </p>
              {/* Add your privacy policy content here */}
            </div>
          </div>
        );
      case 'imprint':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Imprint</h1>
            <div className="prose dark:prose-invert">
              <p>
                This is the imprint for the JSON Explorer application.
              </p>
              {/* Add your imprint content here */}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {renderContent()}
    </div>
  );
};

export default Legal; 