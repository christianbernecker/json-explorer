import React, { useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Button from '../shared/Button';
import { ChartType } from './ChartControls';

export interface AggregatedDataItem {
  name: string | number;
  value: number;
}

interface ChartViewProps {
  isDarkMode: boolean;
  chartType: ChartType;
  chartData: AggregatedDataItem[] | null;
  dimensionName: string;
  metricName: string;
}

/**
 * Komponente zur Anzeige verschiedener Diagrammtypen
 * 
 * Visualisiert Daten in verschiedenen Diagrammformaten wie Balken-, Linien-,
 * Kreis-, Radar- und Flächendiagrammen.
 */
const ChartView: React.FC<ChartViewProps> = ({
  isDarkMode,
  chartType,
  chartData,
  dimensionName,
  metricName
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const chartBackgroundColor = isDarkMode ? '#2D3748' : '#FFFFFF';
  const tooltipBgColor = isDarkMode ? '#1A202C' : '#F7FAFC';
  const tooltipTextColor = isDarkMode ? '#E2E8F0' : '#2D3748';
  const labelColor = isDarkMode ? '#E2E8F0' : '#2D3748';
  const gridColor = isDarkMode ? '#4A5568' : '#E2E8F0';
  
  // Farben für die Diagramme
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#A855F7'
  ];
  
  // Export-Funktionen
  const exportToPng = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      
      const link = document.createElement('a');
      link.download = `chart-${dimensionName}-${metricName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting chart as PNG:', error);
    }
  };
  
  const exportToPdf = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // A4 landscape dimensions
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      // Calculate scaling to fit the chart
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.8;
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      pdf.save(`chart-${dimensionName}-${metricName}.pdf`);
    } catch (error) {
      console.error('Error exporting chart as PDF:', error);
    }
  };
  
  // Rendering der verschiedenen Diagrammtypen
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          <p>Keine Daten für die Visualisierung verfügbar.</p>
        </div>
      );
    }
    
    const formatYAxisTick = (value: any) => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value;
    };
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: labelColor }} 
                angle={-45} 
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatYAxisTick}
                tick={{ fill: labelColor }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBgColor, color: tooltipTextColor, border: `1px solid ${borderColor}` }} 
                formatter={(value: any) => [Number(value).toLocaleString('de-DE'), metricName]}
                labelFormatter={(label: any) => `${dimensionName}: ${label}`}
              />
              <Legend wrapperStyle={{ color: labelColor }} />
              <Bar 
                dataKey="value" 
                name={metricName}
                fill={colors[0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: labelColor }} 
                angle={-45} 
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatYAxisTick}
                tick={{ fill: labelColor }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBgColor, color: tooltipTextColor, border: `1px solid ${borderColor}` }} 
                formatter={(value: any) => [Number(value).toLocaleString('de-DE'), metricName]}
                labelFormatter={(label: any) => `${dimensionName}: ${label}`}
              />
              <Legend wrapperStyle={{ color: labelColor }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={metricName} 
                stroke={colors[0]} 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBgColor, color: tooltipTextColor, border: `1px solid ${borderColor}` }} 
                formatter={(value: any) => [Number(value).toLocaleString('de-DE'), metricName]}
                labelFormatter={(label: any) => `${dimensionName}: ${label}`}
              />
              <Legend 
                wrapperStyle={{ color: labelColor }} 
                formatter={(value: any) => `${value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="name" tick={{ fill: labelColor }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: labelColor }} />
              <Radar 
                name={metricName} 
                dataKey="value" 
                stroke={colors[0]} 
                fill={colors[0]} 
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBgColor, color: tooltipTextColor, border: `1px solid ${borderColor}` }} 
                formatter={(value: any) => [Number(value).toLocaleString('de-DE'), metricName]}
                labelFormatter={(label: any) => `${dimensionName}: ${label}`}
              />
              <Legend wrapperStyle={{ color: labelColor }} />
            </RadarChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: labelColor }} 
                angle={-45} 
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={formatYAxisTick}
                tick={{ fill: labelColor }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBgColor, color: tooltipTextColor, border: `1px solid ${borderColor}` }} 
                formatter={(value: any) => [Number(value).toLocaleString('de-DE'), metricName]}
                labelFormatter={(label: any) => `${dimensionName}: ${label}`}
              />
              <Legend wrapperStyle={{ color: labelColor }} />
              <Area 
                type="monotone" 
                dataKey="value" 
                name={metricName} 
                stroke={colors[0]} 
                fill={colors[0]} 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`chart-view p-4 border ${borderColor} rounded-lg ${textColor}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">
          {metricName} nach {dimensionName}
        </h3>
        
        <div className="flex gap-2">
          <Button
            onClick={exportToPng}
            isDarkMode={isDarkMode}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!chartData || chartData.length === 0}
          >
            Als PNG exportieren
          </Button>
          
          <Button
            onClick={exportToPdf}
            isDarkMode={isDarkMode}
            className="bg-green-600 hover:bg-green-700"
            disabled={!chartData || chartData.length === 0}
          >
            Als PDF exportieren
          </Button>
        </div>
      </div>
      
      <div 
        ref={chartRef} 
        className="chart-container" 
        style={{ backgroundColor: chartBackgroundColor, padding: '16px', borderRadius: '8px' }}
      >
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartView; 