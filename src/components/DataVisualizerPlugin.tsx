import React, { useState } from 'react';
import { DataRow, AggregatedData, ChartType } from '../types';
import DataVisualizerAITab from './DataVisualizerAITab';

interface DataVisualizerPluginProps {
  data: DataRow[];
  dimensions: string[];
  metrics: string[];
  selectedDimension: string;
  selectedMetric: string;
  chartData: AggregatedData[];
  chartType: ChartType;
  onVisualizationSuggestion: (
    chartType: ChartType,
    dimension: string,
    metric: string
  ) => void;
  renderChart: () => React.ReactNode;
  renderTable: () => React.ReactNode;
  isDarkMode: boolean;
}

/**
 * Plugin für den DataVisualizer, das die KI-Tabs hinzufügt
 */
const DataVisualizerPlugin: React.FC<DataVisualizerPluginProps> = ({
  data,
  dimensions,
  metrics,
  selectedDimension,
  selectedMetric,
  chartData,
  chartType,
  onVisualizationSuggestion,
  renderChart,
  renderTable,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'standard'>('standard');

  const handleTabChange = (tab: 'ai' | 'standard') => {
    setActiveTab(tab);
  };

  // Rendern der Tabs
  const renderTabs = () => (
    <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} mb-4`}>
      <button
        className={`py-2 px-4 font-medium ${
          activeTab === 'standard'
            ? isDarkMode 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-blue-600 border-b-2 border-blue-600'
            : isDarkMode 
              ? 'text-gray-300 hover:text-gray-100' 
              : 'text-gray-600 hover:text-gray-800'
        }`}
        onClick={() => handleTabChange('standard')}
      >
        Standard
      </button>
      <button
        className={`py-2 px-4 font-medium ${
          activeTab === 'ai'
            ? isDarkMode 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-blue-600 border-b-2 border-blue-600'
            : isDarkMode 
              ? 'text-gray-300 hover:text-gray-100' 
              : 'text-gray-600 hover:text-gray-800'
        }`}
        onClick={() => handleTabChange('ai')}
      >
        KI-Analyse
      </button>
    </div>
  );

  return (
    <div>
      {renderTabs()}
      
      {activeTab === 'ai' ? (
        <DataVisualizerAITab
          data={data}
          dimensions={dimensions}
          metrics={metrics}
          selectedDimension={selectedDimension}
          selectedMetric={selectedMetric}
          aggregatedData={chartData}
          chartType={chartType}
          onVisualizationSuggestion={onVisualizationSuggestion}
          renderChart={renderChart}
          renderTable={renderTable}
          isDarkMode={isDarkMode}
        />
      ) : null}
    </div>
  );
};

export default DataVisualizerPlugin; 