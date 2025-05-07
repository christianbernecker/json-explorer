import React from 'react';
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
 * Plugin für den DataVisualizer, das die KI-Analyse integriert
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
  return (
    <div className="w-full">
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
    </div>
  );
};

export default DataVisualizerPlugin; 