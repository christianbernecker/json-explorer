// api/analyze-data.ts
// Diese API-Route dient als sicherer Proxy für LLM-Anfragen.

import { VercelRequest, VercelResponse } from '@vercel/node';

// --- Von llmService übernommene Typen und Logik ---

interface DataRow {
  [key: string]: any;
}

interface AggregatedData {
  name: string;
  value: number;
}

interface LLMAnalysisRequest {
  data: DataRow[];
  dimensions: string[];
  metrics: string[];
  aggregatedData?: AggregatedData[];
  selectedDimension?: string;
  selectedMetric?: string;
  provider: 'openai' | 'anthropic'; // Provider wird vom Frontend übergeben
}

interface LLMAnalysisResponse {
  insights: string[];
  visualizationSuggestion: {
    type: 'bar' | 'line' | 'pie' | 'radar' | 'area';
    dimension: string;
    metric: string;
    explanation: string;
  };
  additionalQuestions: string[];
}

const CLAUDE_MODEL = 'claude-3-5-sonnet-20240620'; // Verwende das spezifische Modell hier
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const generatePrompt = (request: LLMAnalysisRequest): string => {
  const { data, dimensions, metrics, aggregatedData, selectedDimension, selectedMetric } = request;
  const totalRows = data.length;
  const sampleData = data.slice(0, 5);

  let prompt = `
Du bist ein Datenanalyse-Experte. Analysiere die folgenden Daten und gib Erkenntnisse sowie Visualisierungsempfehlungen.
DATENÜBERSICHT:
- Anzahl der Datensätze: ${totalRows}
- Dimensionen (kategorische Spalten): ${dimensions.join(', ')}
- Metriken (numerische Spalten): ${metrics.join(', ')}
`;

  prompt += `\nBEISPIELDATEN (erste 5 Zeilen):\n`;
  sampleData.forEach((row, index) => {
    prompt += `Zeile ${index + 1}: ${JSON.stringify(row)}\n`;
  });
  
  if (aggregatedData && selectedDimension && selectedMetric) {
    prompt += `\nAGGREGIERTE DATEN für ${selectedDimension} und ${selectedMetric}:\n`;
    prompt += JSON.stringify(aggregatedData);
  }
  
prompt += `
AUFGABE:
1. Analysiere die Daten und gib 3-5 wichtige Erkenntnisse in Bulletpoints.
2. Schlage einen geeigneten Visualisierungstyp vor (bar, line, pie, radar oder area).
3. Begründe deine Empfehlung.
4. Schlage eine geeignete Dimension und Metrik für die Visualisierung vor.
5. Formuliere 2-3 zusätzliche Fragen, die man an diese Daten stellen könnte.

Antworte NUR im folgenden JSON-Format, ohne umschließenden Text oder Markdown:
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

const queryAnthropicClaude = async (prompt: string, apiKey: string): Promise<LLMAnalysisResponse> => {
  console.log('API-Route: Sende Anfrage an Anthropic Claude API...');
    
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01' // Empfohlene Version
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1500, // Etwas höher für komplexere Analysen
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('API-Route: Claude API Fehler:', response.status, errorData);
    throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorData}`);
  }
  
  const data = await response.json();
  console.log('API-Route: Anthropic Claude Antwort erhalten.'); // Logge nicht die gesamte Antwort
  
  const rawResponse = data.content[0]?.text;
  if (!rawResponse) {
    throw new Error('Claude API response format error: No text content found.');
  }
  
  // Parse die JSON-Antwort
  try {
    // Suche nach JSON in der Antwort (Claude gibt manchmal Text um das JSON herum aus)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0]) {
      return JSON.parse(jsonMatch[0]) as LLMAnalysisResponse;
    } else {
      console.error('API-Route: Kein JSON in Claude-Antwort gefunden. Raw:', rawResponse);
      throw new Error('Kein gültiges JSON-Objekt in der Claude-Antwort gefunden.');
    }
  } catch (error: any) {
    console.error('API-Route: Fehler beim Parsen der Claude-Antwort:', error);
    throw new Error(`Fehler beim Parsen der LLM-Antwort: ${error.message}`);
  }
};

// --- Ende übernommene Logik ---

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Nur POST-Anfragen erlauben
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Body als LLMAnalysisRequest parsen
    const analysisRequest: LLMAnalysisRequest = request.body;

    // Prüfen, ob notwendige Felder vorhanden sind
    if (!analysisRequest.data || !analysisRequest.dimensions || !analysisRequest.metrics || !analysisRequest.provider) {
        return response.status(400).json({ message: 'Bad Request: Missing required fields in request body.' });
    }

    // Lese den sicheren API-Key aus den Umgebungsvariablen
    // Unterstützt sowohl ANTHROPIC_API_KEY (Backend) als auch REACT_APP_ANTHROPIC_API_KEY (für lokale Entwicklung)
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('API-Route: Weder ANTHROPIC_API_KEY noch REACT_APP_ANTHROPIC_API_KEY konfiguriert!');
      return response.status(500).json({ 
        message: 'Server configuration error: API key missing',
        details: 'Bitte konfigurieren Sie ANTHROPIC_API_KEY in den Vercel-Umgebungsvariablen.'
      });
    }

    console.log(`API-Route: Empfange Anfrage für Provider ${analysisRequest.provider}...`);

    let llmResult: LLMAnalysisResponse;

    if (analysisRequest.provider === 'anthropic') {
        const prompt = generatePrompt(analysisRequest);
        llmResult = await queryAnthropicClaude(prompt, apiKey);
    } else {
        // TODO: OpenAI implementieren, falls benötigt
        console.warn('API-Route: OpenAI Provider noch nicht implementiert.');
        return response.status(501).json({ message: 'Provider not implemented' });
    }

    // Sende das Ergebnis zurück an das Frontend
    return response.status(200).json(llmResult);

  } catch (error: any) {
    console.error('API-Route Fehler:', error);
    // Sende spezifischere Fehlermeldung, wenn möglich
    const statusCode = error.message?.includes('Claude API error: 4') ? 400 : 500; // 4xx Fehler von Claude als Bad Request behandeln
    return response.status(statusCode).json({ 
        message: error.message || 'Internal Server Error', 
        // Detaillierten Fehler nur loggen, nicht unbedingt zurückgeben
        // error: error.toString() 
    });
  }
} 