import React, { useState, useEffect } from 'react';
import { DataRow, ChartData } from '../../services/types';
import { DataProcessing } from '../../services/data/DataProcessing';
import { DataAggregator } from '../../services/data/DataAggregator';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

interface DataVisualizerProps {
  data: DataRow[];
}

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ data }) => {
  const [dataProcessor, setDataProcessor] = useState<DataProcessing | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const processor = new DataProcessing(data);
      if (processor.validateData()) {
        setDataProcessor(processor);
        const dimensions = processor.getDimensions();
        const metrics = processor.getMetrics();
        
        if (dimensions.length > 0) {
          setSelectedDimension(dimensions[0]);
        }
        if (metrics.length > 0) {
          setSelectedMetric(metrics[0]);
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (dataProcessor && selectedDimension && selectedMetric) {
      const aggregator = dataProcessor.createAggregator(selectedDimension, selectedMetric);
      const aggregated = aggregator.aggregate();
      const sorted = aggregator.sortByMetric(aggregated);
      const { labels, data: chartData } = aggregator.toChartData(sorted);

      setChartData({
        labels,
        datasets: [
          {
            label: selectedMetric,
            data: chartData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      });
    }
  }, [dataProcessor, selectedDimension, selectedMetric]);

  if (!dataProcessor || !chartData) {
    return <div>Keine Daten verfügbar</div>;
  }

  const dimensions = dataProcessor.getDimensions();
  const metrics = dataProcessor.getMetrics();

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4">
        <select
          value={selectedDimension}
          onChange={(e) => setSelectedDimension(e.target.value)}
          className="p-2 border rounded"
        >
          {dimensions.map((dim) => (
            <option key={dim} value={dim}>
              {dim}
            </option>
          ))}
        </select>

        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="p-2 border rounded"
        >
          {metrics.map((metric) => (
            <option key={metric} value={metric}>
              {metric}
            </option>
          ))}
        </select>

        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
          className="p-2 border rounded"
        >
          <option value="bar">Balkendiagramm</option>
          <option value="line">Liniendiagramm</option>
        </select>
      </div>

      <div className="h-[400px]">
        {chartType === 'bar' ? (
          <Chart type="bar" data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: `${selectedMetric} nach ${selectedDimension}`,
              },
            },
          }} />
        ) : (
          <Chart type="line" data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: `${selectedMetric} nach ${selectedDimension}`,
              },
            },
          }} />
        )}
      </div>
    </div>
  );
}; 