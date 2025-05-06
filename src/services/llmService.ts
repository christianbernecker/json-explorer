// LLM Service für die Datenanalyse und Visualisierungsvorschläge
// Dieser Service kommuniziert mit LLM-APIs (Claude 3.5 oder ChatGPT 4 mini)

import { AggregatedData, DataRow } from '../types';

// Interface für den LLM-Request
interface LLMAnalysisRequest {
  data: DataRow[];
  dimensions: string[];
  metrics: string[];
  aggregatedData?: AggregatedData[];
  selectedDimension?: string;
  selectedMetric?: string;
}

// Interface für die LLM-Antwort
export interface LLMAnalysisResponse {
  insights: string[]; // Bulletpoints mit Erkenntnissen
  visualizationSuggestion: {
    type: 'bar' | 'line' | 'pie' | 'radar' | 'area'; // empfohlener Chart-Typ
    dimension: string; // empfohlene Dimension
    metric: string; // empfohlene Metrik
    explanation: string; // Erklärung der Empfehlung
  };
  additionalQuestions: string[]; // Vorschläge für weitere Analysen
}

/**
 * Generiert einen Prompt für das LLM basierend auf den Daten
 */
const generatePrompt = (request: LLMAnalysisRequest): string => {
  const { data, dimensions, metrics, aggregatedData, selectedDimension, selectedMetric } = request;
  
  // Erstelle eine Übersicht der Daten
  const totalRows = data.length;
  const sampleData = data.slice(0, 5); // Nur die ersten 5 Zeilen
  
  // Basisinformationen
  let prompt = `
Du bist ein Datenanalyse-Experte. Analysiere die folgenden Daten und gib Erkenntnisse sowie Visualisierungsempfehlungen.

DATENÜBERSICHT:
- Anzahl der Datensätze: ${totalRows}
- Dimensionen (kategorische Spalten): ${dimensions.join(', ')}
- Metriken (numerische Spalten): ${metrics.join(', ')}
`;

  // Ergänze Beispieldaten
  prompt += `\nBEISPIELDATEN (erste 5 Zeilen):\n`;
  sampleData.forEach((row, index) => {
    prompt += `Zeile ${index + 1}: ${JSON.stringify(row)}\n`;
  });
  
  // Füge aggregierte Daten hinzu, wenn vorhanden
  if (aggregatedData && selectedDimension && selectedMetric) {
    prompt += `\nAGGREGIERTE DATEN für ${selectedDimension} und ${selectedMetric}:\n`;
    prompt += JSON.stringify(aggregatedData);
  }
  
  // Anweisungen für die Analyse
  prompt += `
AUFGABE:
1. Analysiere die Daten und gib 3-5 wichtige Erkenntnisse in Bulletpoints.
2. Schlage einen geeigneten Visualisierungstyp vor (bar, line, pie, radar oder area).
3. Begründe deine Empfehlung.
4. Schlage eine geeignete Dimension und Metrik für die Visualisierung vor.
5. Formuliere 2-3 zusätzliche Fragen, die man an diese Daten stellen könnte.

Antworte in diesem JSON-Format:
{
  "insights": ["Erkenntnis 1", "Erkenntnis 2", "Erkenntnis 3"],
  "visualizationSuggestion": {
    "type": "bar|line|pie|radar|area",
    "dimension": "empfohlene_dimension",
    "metric": "empfohlene_metrik",
    "explanation": "Begründung für die Empfehlung"
  },
  "additionalQuestions": ["Frage 1", "Frage 2", "Frage 3"]
}
`;

  return prompt;
};

/**
 * Sendet eine Anfrage an die OpenAI API (ChatGPT)
 */
const queryOpenAI = async (prompt: string): Promise<LLMAnalysisResponse> => {
  try {
    // In einer echten Implementierung würde hier die OpenAI API aufgerufen werden
    // Dies ist ein Platzhalter für den Prototyp
    
    // Beispielantwort für den Prototyp
    const mockResponse: LLMAnalysisResponse = {
      insights: [
        "Dimension X zeigt einen kontinuierlichen Anstieg der Metrik Y über die letzten 3 Monate",
        "Die Top 3 Einträge machen 45% des Gesamtwertes aus",
        "Es gibt eine statistische Anomalie bei Eintrag Z"
      ],
      visualizationSuggestion: {
        type: "bar",
        dimension: "", // Wird im Hauptcode gefüllt
        metric: "", // Wird im Hauptcode gefüllt
        explanation: "Ein Balkendiagramm eignet sich am besten für den Vergleich kategorischer Daten"
      },
      additionalQuestions: [
        "Wie entwickelt sich der Trend über einen längeren Zeitraum?",
        "Gibt es saisonale Schwankungen in den Daten?"
      ]
    };
    
    return mockResponse;
    
    // Echte API-Implementierung würde so aussehen:
    /*
    const apiKey = process.env.OPENAI_API_KEY || '';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Datenanalyse-Experte. Antworte nur im angeforderten JSON-Format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const rawResponse = data.choices[0].message.content;
    
    // Parse die JSON-Antwort
    try {
      return JSON.parse(rawResponse) as LLMAnalysisResponse;
    } catch (error) {
      console.error('Fehler beim Parsen der LLM-Antwort:', error);
      throw new Error('Ungültiges Antwortformat vom LLM');
    }
    */
  } catch (error) {
    console.error('Fehler bei der OpenAI-Anfrage:', error);
    throw error;
  }
};

/**
 * Sendet eine Anfrage an die Anthropic API (Claude)
 */
const queryAnthropicClaude = async (prompt: string): Promise<LLMAnalysisResponse> => {
  try {
    // In einer echten Implementierung würde hier die Anthropic Claude API aufgerufen werden
    // Dies ist ein Platzhalter für den Prototyp
    
    // Beispielantwort für den Prototyp
    const mockResponse: LLMAnalysisResponse = {
      insights: [
        "Dimension X zeigt einen klaren Aufwärtstrend mit Wachstum von 23% im letzten Quartal",
        "Es gibt eine hohe Korrelation (0.87) zwischen Metrik Y und Metrik Z",
        "Die geografische Verteilung zeigt eine Konzentration in Region A und B"
      ],
      visualizationSuggestion: {
        type: "bar",
        dimension: "", // Wird im Hauptcode gefüllt
        metric: "", // Wird im Hauptcode gefüllt
        explanation: "Ein Balkendiagramm visualisiert die Unterschiede zwischen den Kategorien am deutlichsten"
      },
      additionalQuestions: [
        "Wie verteilen sich die Werte innerhalb der Top-Kategorie?",
        "Gibt es Ausreißer, die näher untersucht werden sollten?"
      ]
    };
    
    return mockResponse;
    
    // Echte API-Implementierung würde so aussehen:
    /*
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const rawResponse = data.content[0].text;
    
    // Parse die JSON-Antwort
    try {
      // Suche nach JSON in der Antwort (Claude gibt manchmal Text um das JSON herum aus)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as LLMAnalysisResponse;
      } else {
        throw new Error('Kein JSON in der Antwort gefunden');
      }
    } catch (error) {
      console.error('Fehler beim Parsen der Claude-Antwort:', error);
      throw new Error('Ungültiges Antwortformat von Claude');
    }
    */
  } catch (error) {
    console.error('Fehler bei der Anthropic-Anfrage:', error);
    throw error;
  }
};

/**
 * Hauptfunktion zur Analyse der Daten mit einem LLM
 */
export const analyzeDatatWithLLM = async (
  request: LLMAnalysisRequest,
  provider: 'openai' | 'anthropic' = 'anthropic'
): Promise<LLMAnalysisResponse> => {
  const prompt = generatePrompt(request);
  
  // Wähle den Provider basierend auf dem Parameter
  const response = provider === 'openai' 
    ? await queryOpenAI(prompt) 
    : await queryAnthropicClaude(prompt);
  
  // Fülle die fehlenden Werte aus
  if (!response.visualizationSuggestion.dimension && request.dimensions.length > 0) {
    response.visualizationSuggestion.dimension = request.selectedDimension || request.dimensions[0];
  }
  
  if (!response.visualizationSuggestion.metric && request.metrics.length > 0) {
    response.visualizationSuggestion.metric = request.selectedMetric || request.metrics[0];
  }
  
  return response;
};

export default {
  analyzeDatatWithLLM
}; 