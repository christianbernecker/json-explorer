import React from 'react';
import Button from '../shared/Button';

export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'area';

interface ChartControlsProps {
  isDarkMode: boolean;
  dimensions: string[];
  metrics: string[];
  selectedDimension: string;
  selectedMetric: string;
  chartType: ChartType;
  onDimensionChange: (dimension: string) => void;
  onMetricChange: (metric: string) => void;
  onChartTypeChange: (type: ChartType) => void;
  onSaveChart?: () => void;
  hasChartData: boolean;
}

/**
 * Komponente für die Steuerung der Datenvisualisierung
 * 
 * Ermöglicht die Auswahl von Dimensionen, Metriken und Diagrammtypen
 * für die Visualisierung der Daten.
 */
const ChartControls: React.FC<ChartControlsProps> = ({
  isDarkMode,
  dimensions,
  metrics,
  selectedDimension,
  selectedMetric,
  chartType,
  onDimensionChange,
  onMetricChange,
  onChartTypeChange,
  onSaveChart,
  hasChartData
}) => {
  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const activeBgColor = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const inactiveBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  
  // Chart-Typen mit Icons
  const chartTypes: { type: ChartType; label: string; icon: JSX.Element }[] = [
    {
      type: 'bar',
      label: 'Balken',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      type: 'line',
      label: 'Linie',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
      )
    },
    {
      type: 'pie',
      label: 'Kreis',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      type: 'radar',
      label: 'Radar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      type: 'area',
      label: 'Fläche',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a4 4 0 00-4 4h8a4 4 0 00-4-4z" clipRule="evenodd" />
        </svg>
      )
    }
  ];
  
  return (
    <div className={`chart-controls p-4 rounded-lg border ${borderColor} ${textColor}`}>
      <h3 className="text-lg font-bold mb-4">Visualisierungseinstellungen</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimension und Metrik Auswahl */}
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Dimension (X-Achse / Kategorien)</label>
            <select 
              value={selectedDimension} 
              onChange={(e) => onDimensionChange(e.target.value)}
              className={`w-full p-2 rounded-md border ${inputBorderColor} ${inputBgColor}`}
            >
              <option value="">Dimension auswählen...</option>
              {dimensions.map((dim) => (
                <option key={dim} value={dim}>{dim}</option>
              ))}
            </select>
            <p className={`mt-1 text-sm ${secondaryTextColor}`}>
              Dimensionen sind kategorische oder zeitbasierte Daten.
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium">Metrik (Y-Achse / Werte)</label>
            <select 
              value={selectedMetric} 
              onChange={(e) => onMetricChange(e.target.value)}
              className={`w-full p-2 rounded-md border ${inputBorderColor} ${inputBgColor}`}
            >
              <option value="">Metrik auswählen...</option>
              {metrics.map((metric) => (
                <option key={metric} value={metric}>{metric}</option>
              ))}
            </select>
            <p className={`mt-1 text-sm ${secondaryTextColor}`}>
              Metriken sind numerische Daten, die gemessen werden.
            </p>
          </div>
        </div>
        
        {/* Diagrammtyp-Auswahl */}
        <div>
          <label className="block mb-2 font-medium">Diagrammtyp</label>
          <div className="flex flex-wrap gap-2">
            {chartTypes.map((chart) => (
              <button
                key={chart.type}
                onClick={() => onChartTypeChange(chart.type)}
                className={`
                  p-2 rounded-md flex items-center gap-2 transition-colors
                  ${chartType === chart.type 
                    ? `${activeBgColor} text-white` 
                    : `${inactiveBgColor} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:bg-opacity-80`
                  }
                `}
              >
                {chart.icon}
                <span>{chart.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-6">
            {onSaveChart && (
              <Button
                onClick={onSaveChart}
                isDarkMode={isDarkMode}
                className="bg-green-600 hover:bg-green-700"
                disabled={!hasChartData}
              >
                Diagramm exportieren
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartControls; 