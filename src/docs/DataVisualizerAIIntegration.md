# KI-Integration im DataVisualizer

Diese Dokumentation beschreibt die Integration von KI-Funktionalitäten (Large Language Models) in die DataVisualizer-Komponente.

## Überblick

Die KI-Integration ermöglicht es, hochgeladene Daten automatisch zu analysieren und Erkenntnisse sowie Visualisierungsvorschläge zu erhalten. Die Implementierung unterstützt sowohl OpenAI (ChatGPT) als auch Anthropic (Claude) als LLM-Provider.

## Komponenten

Die Integration besteht aus den folgenden Hauptkomponenten:

1. **llmService**: Ein Service, der die Kommunikation mit den LLM-APIs übernimmt.
2. **DataVisualizerAITab**: Eine Komponente, die KI-Analysen und Visualisierungsvorschläge anzeigt.
3. **DataVisualizerPlugin**: Eine Komponente, die als Wrapper fungiert, um die KI-Funktionalität in den bestehenden DataVisualizer zu integrieren.

## Verwendung

### LLM-Service

Der LLM-Service stellt Funktionen zur Verfügung, um Daten an LLMs zu senden und strukturierte Antworten zu erhalten:

```typescript
import llmService from '../services/llmService';

// Analysiere Daten mit dem LLM
const response = await llmService.analyzeDatatWithLLM({
  data: yourData,
  dimensions: dimensionColumns,
  metrics: metricColumns,
  aggregatedData: chartData,
  selectedDimension: currentDimension,
  selectedMetric: currentMetric
}, 'anthropic'); // oder 'openai'
```

### Integration in den DataVisualizer

Um die KI-Funktionalität in den bestehenden DataVisualizer zu integrieren, kann das DataVisualizerPlugin verwendet werden:

```jsx
// Innerhalb einer Komponente, die den DataVisualizer erweitert
const handleVisualizationSuggestion = (
  suggestedChartType,
  suggestedDimension,
  suggestedMetric
) => {
  setChartType(suggestedChartType);
  setSelectedDimension(suggestedDimension);
  setSelectedMetric(suggestedMetric);
};

const renderChart = () => {
  // Implementierung des Chart-Renderings basierend auf chartType, selectedDimension und selectedMetric
};

const renderTable = () => {
  // Implementierung des Tabellen-Renderings
};

return (
  <div>
    {/* Andere UI-Elemente */}
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
  </div>
);
```

## API-Konfiguration

Um die APIs von OpenAI oder Anthropic zu verwenden, müssen die entsprechenden API-Keys konfiguriert werden:

1. Füge die API-Keys als Umgebungsvariablen hinzu:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_key
   REACT_APP_ANTHROPIC_API_KEY=your_anthropic_key
   ```

2. Entkommentiere die API-Implementierung im llmService.ts und verwende die API-Keys:
   ```typescript
   const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
   // oder
   const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || '';
   ```

## Prototyp vs. Produktionsversion

Die aktuelle Implementierung ist ein Prototyp, der Mock-Antworten zurückgibt, ohne tatsächlich eine API aufzurufen. Um den Prototyp in eine Produktionsversion zu überführen:

1. Aktualisiere die API-Implementierung im llmService
2. Füge Fehlerbehandlung und Ratenbegrenzung hinzu
3. Integriere die KI-Funktionalität nahtlos in den bestehenden DataVisualizer

## Beispiel für den LLM-Prompt

Der an die LLMs gesendete Prompt enthält:

1. Informationen über die Daten (Anzahl der Datensätze, Dimensionen, Metriken)
2. Beispieldaten (die ersten 5 Zeilen)
3. Aggregierte Daten, falls vorhanden
4. Anweisungen zur Analyse und zum Format der Antwort

Das LLM antwortet mit:

1. Erkenntnissen aus den Daten
2. Einem Visualisierungsvorschlag (Typ, Dimension, Metrik)
3. Begründung für den Vorschlag
4. Zusätzlichen Fragen zur weiteren Analyse 