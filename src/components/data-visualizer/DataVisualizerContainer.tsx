import React, { useState } from 'react';
import { DataRow } from '../../services/types';
import { FileUpload } from './FileUpload';
import { DataGrid } from './DataGrid';
import { DataVisualizer } from './DataVisualizer';

export const DataVisualizerContainer: React.FC = () => {
  const [data, setData] = useState<DataRow[] | null>(null);
  const [activeView, setActiveView] = useState<'upload' | 'grid' | 'visualization'>('upload');

  const handleFileSelected = (parsedData: DataRow[]) => {
    setData(parsedData);
    setActiveView('grid');
  };

  const switchToVisualization = () => {
    setActiveView('visualization');
  };

  const backToGrid = () => {
    setActiveView('grid');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'upload':
        return <FileUpload onFileSelected={handleFileSelected} />;
      case 'grid':
        return data ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Daten Explorer</h2>
              <button
                onClick={switchToVisualization}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Visualisieren
              </button>
            </div>
            <DataGrid data={data} />
          </div>
        ) : null;
      case 'visualization':
        return data ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Daten Visualisierung</h2>
              <button
                onClick={backToGrid}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                ← Zurück zur Datenansicht
              </button>
            </div>
            <DataVisualizer data={data} />
          </div>
        ) : null;
      default:
        return <FileUpload onFileSelected={handleFileSelected} />;
    }
  };

  return (
    <div className="data-visualizer-container">
      {renderActiveView()}
    </div>
  );
}; 