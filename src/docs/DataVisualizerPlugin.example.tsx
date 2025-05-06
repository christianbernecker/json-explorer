// Beispiel für die Integration des DataVisualizerPlugins in eine Komponente

import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { DataRow, AggregatedData, ChartType } from '../types';
import DataVisualizerPlugin from '../components/DataVisualizerPlugin';

// Beispiel-Komponente, die den DataVisualizer erweitert
const ExampleDataVisualizer: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  // State
  const [data, setData] = useState<DataRow[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<AggregatedData[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  // Callback für Visualisierungsvorschläge vom LLM
  const handleVisualizationSuggestion = useCallback((
    suggestedChartType: ChartType,
    suggestedDimension: string,
    suggestedMetric: string
  ) => {
    console.log('Visualization suggestion:', { suggestedChartType, suggestedDimension, suggestedMetric });
    
    // Charttyp aktualisieren
    setChartType(suggestedChartType);
    
    // Dimension und Metrik aktualisieren, wenn sie existieren
    if (dimensions.includes(suggestedDimension)) {
      setSelectedDimension(suggestedDimension);
    }
    
    if (metrics.includes(suggestedMetric)) {
      setSelectedMetric(suggestedMetric);
    }
  }, [dimensions, metrics]);

  // Renderfunktion für die Tabelle
  const renderTable = useCallback(() => {
    if (data.length === 0) return null;
    
    return (
      <div className={`h-64 ag-theme-${isDarkMode ? 'alpine-dark' : 'alpine'}`}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={data}
          pagination={true}
          paginationPageSize={10}
        />
      </div>
    );
  }, [data, columnDefs, isDarkMode]);

  // Renderfunktion für das Chart
  const renderChart = useCallback(() => {
    if (chartData.length === 0 || !selectedDimension || !selectedMetric) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Bitte wählen Sie eine Dimension und eine Metrik aus, um ein Diagramm zu erstellen.
          </p>
        </div>
      );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FCCDE5', '#8DD1E1', '#FFFFB3', '#FB8072'];

    // Gemeinsame Properties für ResponsiveContainer
    const containerProps = {
      width: '100%',
      height: 400,
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...containerProps}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#ccc'} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#fff', 
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  color: isDarkMode ? '#e5e7eb' : '#374151'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <Bar 
                dataKey="value" 
                name={`${selectedMetric}`} 
                fill={isDarkMode ? '#60a5fa' : '#3b82f6'} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...containerProps}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#ccc'} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#fff', 
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  color: isDarkMode ? '#e5e7eb' : '#374151'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <Line
                type="monotone"
                dataKey="value"
                name={`${selectedMetric}`}
                stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...containerProps}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} (${selectedMetric})`, '']}
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#fff', 
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  color: isDarkMode ? '#e5e7eb' : '#374151'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer {...containerProps}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke={isDarkMode ? '#555' : '#ccc'} />
              <PolarAngleAxis dataKey="name" tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <PolarRadiusAxis tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <Radar 
                name={`${selectedMetric}`}
                dataKey="value"
                stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
                fill={isDarkMode ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)'}
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#fff', 
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  color: isDarkMode ? '#e5e7eb' : '#374151'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...containerProps}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#ccc'} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#fff', 
                  borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  color: isDarkMode ? '#e5e7eb' : '#374151'
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} />
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDarkMode ? '#60a5fa' : '#3b82f6'} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isDarkMode ? '#60a5fa' : '#3b82f6'} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="value"
                name={`${selectedMetric}`}
                stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex justify-center items-center h-64">
            <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Unbekannter Chart-Typ: {chartType}
            </p>
          </div>
        );
    }
  }, [chartData, chartType, isDarkMode, selectedDimension, selectedMetric]);

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <h2 className="text-xl font-bold mb-4">Datenvisualisierung mit KI-Unterstützung</h2>
      
      <div className="mb-4">
        <p>Diese Komponente demonstriert die Integration des DataVisualizerPlugins.</p>
        <p>Nach dem Hochladen von Daten steht ein KI-Tab zur Verfügung, der automatisch Erkenntnisse und Visualisierungsvorschläge liefert.</p>
      </div>
      
      {/* Hier würde normalerweise die Upload-Komponente stehen */}
      
      {/* Integration des DataVisualizerPlugins */}
      {data.length > 0 && (
        <DataVisualizerPlugin
          data={data}
          dimensions={dimensions}
          metrics={metrics}
          selectedDimension={selectedDimension}
          selectedMetric={selectedMetric}
          chartData={chartData}
          chartType={chartType}
          onVisualizationSuggestion={handleVisualizationSuggestion}
          renderChart={renderChart}
          renderTable={renderTable}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ExampleDataVisualizer; 