import React, { useState, useEffect, useCallback } from 'react';
import { DataRow, AggregatedData, ChartType } from '../types';
import { LLMAnalysisResponse } from '../services/llmService';
import llmService from '../services/llmService';

interface DataVisualizerAITabProps {
  data: DataRow[];
  dimensions: string[];
  metrics: string[];
  selectedDimension: string;
  selectedMetric: string;
  aggregatedData: AggregatedData[];
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
 * KI-Tab für den DataVisualizer, der LLM-Analysen und Visualisierungsvorschläge anzeigt
 */
const DataVisualizerAITab: React.FC<DataVisualizerAITabProps> = ({
  data,
  dimensions,
  metrics,
  selectedDimension,
  selectedMetric,
  aggregatedData,
  chartType,
  onVisualizationSuggestion,
  renderChart,
  renderTable,
  isDarkMode
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [insights, setInsights] = useState<LLMAnalysisResponse | null>(null);
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('anthropic');

  // LLM Analysefunktion
  const analyzeDatatWithLLM = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Debug-Info zum Finden des Problems
    console.log('KI-Analyse wird gestartet mit:', {
      dataLength: data.length,
      dimensionsCount: dimensions.length,
      metricsCount: metrics.length,
      selectedDimension,
      selectedMetric,
      provider
    });

    try {
      // Reduziere die Datenmenge für die API-Anfrage, um Timeout-Probleme zu vermeiden
      const maxSampleSize = 100; // Maximal 100 Datensätze senden
      const sampledData = data.length > maxSampleSize 
        ? data.slice(0, maxSampleSize) 
        : data;
      
      console.log(`KI-Analyse nutzt ${sampledData.length} von ${data.length} Datensätzen (abgeschnitten für Performanz)`);

      const response = await llmService.analyzeDatatWithLLM({
        data: sampledData,
        dimensions,
        metrics,
        aggregatedData,
        selectedDimension,
        selectedMetric
      }, provider);

      console.log('KI-Analyse erfolgreich:', response);
      setInsights(response);

      // Aktualisiere die Visualisierung basierend auf den Vorschlägen
      if (response.visualizationSuggestion) {
        onVisualizationSuggestion(
          response.visualizationSuggestion.type,
          response.visualizationSuggestion.dimension || selectedDimension,
          response.visualizationSuggestion.metric || selectedMetric
        );
      }
    } catch (err: any) {
      console.error('KI-Analysefehler:', err);
      
      // Zeige eine verbesserte Fehlermeldung an
      if (err.message && err.message.includes('API key missing')) {
        setError(
          <span>
            <strong>Claude API-Schlüssel fehlt.</strong> Bitte konfigurieren Sie die Umgebungsvariable <code>ANTHROPIC_API_KEY</code> in den Vercel-Einstellungen.
            <br />
            <small>Siehe Dokumentation unter <code>src/docs/API_KEY_CONFIG.md</code> für weitere Details.</small>
          </span>
        );
      } else {
        setError(`Fehler bei der KI-Analyse: ${err.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, dimensions, metrics, aggregatedData, selectedDimension, selectedMetric, provider, onVisualizationSuggestion]);

  // Analyse beim ersten Rendern oder bei Änderung der Daten starten
  useEffect(() => {
    if (data.length > 0 && dimensions.length > 0 && metrics.length > 0) {
      analyzeDatatWithLLM();
    }
  }, [data, selectedDimension, selectedMetric, aggregatedData, dimensions.length, metrics.length, analyzeDatatWithLLM]);

  // Handler für den Wechsel des LLM-Providers
  const handleProviderChange = (newProvider: 'openai' | 'anthropic') => {
    setProvider(newProvider);
    analyzeDatatWithLLM();
  };

  const renderInsightsPanel = () => (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">KI-Analyse</h2>
        
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md text-sm ${
              provider === 'anthropic' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleProviderChange('anthropic')}
          >
            Claude
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm ${
              provider === 'openai' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleProviderChange('openai')}
          >
            ChatGPT
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm ${isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}
            onClick={analyzeDatatWithLLM}
            disabled={isLoading}
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Analysiere Daten...</span>
        </div>
      )}

      {error && (
        <div className={`p-2 rounded-md mb-4 ${isDarkMode ? 'bg-red-800 text-white' : 'bg-red-100 text-red-700'}`}>
          <p className="font-medium">Fehler bei der Analyse:</p>
          <p>{error}</p>
        </div>
      )}

      {insights && !isLoading && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Erkenntnisse:</h3>
            <ul className={`list-disc pl-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {insights.insights.map((insight, index) => (
                <li key={index} className="mb-1">{insight}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Visualisierungsempfehlung:</h3>
            <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p><span className="font-medium">Typ:</span> {insights.visualizationSuggestion.type}</p>
              <p><span className="font-medium">Dimension:</span> {insights.visualizationSuggestion.dimension}</p>
              <p><span className="font-medium">Metrik:</span> {insights.visualizationSuggestion.metric}</p>
              <p className="mt-1"><span className="font-medium">Begründung:</span> {insights.visualizationSuggestion.explanation}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Weitere Fragen zur Analyse:</h3>
            <ul className={`list-disc pl-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {insights.additionalQuestions.map((question, index) => (
                <li key={index} className="mb-1">{question}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full">
      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            {renderInsightsPanel()}
          </div>
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Visualisierung: {selectedDimension} nach {selectedMetric}
              </h3>
              <div className="h-[400px]">
                {renderChart()}
              </div>
            </div>
            <div>
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Datentabelle
              </h3>
              {renderTable()}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Bitte laden Sie zuerst Daten hoch, um KI-Analysen zu erhalten.
          </p>
        </div>
      )}
    </div>
  );
};

export default DataVisualizerAITab; 