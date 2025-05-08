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
    
  try {
    // Debug-Info für Diagnose
    console.log('API-Route: Model:', CLAUDE_MODEL);
    console.log('API-Route: API-Key vorhanden:', !!apiKey);
    console.log('API-Route: API-Key-Format korrekt:', apiKey.startsWith('sk-ant-'));
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-api-key': apiKey
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    
    // Ausführliches Logging des HTTP-Status
    console.log('API-Route: Claude API HTTP Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API-Route: Claude API Fehler:', response.status, errorData);
      
      // Detailliertere Fehlermeldung erstellen
      let errorMessage = `Claude API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = `API-Authentifizierungsfehler: Ungültiger API-Schlüssel. Bitte ANTHROPIC_API_KEY in den Vercel-Umgebungsvariablen überprüfen.`;
      } else if (response.status === 400) {
        errorMessage = `Claude API Bad Request: ${errorData}`;
      } else if (response.status === 429) {
        errorMessage = `Claude API Rate Limit überschritten. Bitte später erneut versuchen.`;
      } else if (response.status >= 500) {
        errorMessage = `Claude API Server-Fehler: ${response.status}. Bitte später erneut versuchen.`;
      }
      
      throw new Error(errorMessage);
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
  } catch (error: any) {
    // Verbesserte Fehlerbehandlung
    console.error('API-Route: Netzwerkfehler bei Claude API-Anfrage:', error);
    const errorMessage = error.message || 'Unbekannter Fehler bei Claude API-Anfrage';
    throw new Error(errorMessage);
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
      console.error('API-Route: Kein API-Schlüssel gefunden!');
      console.error('ANTHROPIC_API_KEY in Vercel-Umgebungsvariablen konfigurieren');
      console.error('Verfügbare Umgebungsvariablen:', Object.keys(process.env).filter(key => !key.includes('NODE') && !key.includes('npm')).join(', '));
      
      return response.status(500).json({ 
        message: 'API key missing',
        details: 'Bitte konfigurieren Sie ANTHROPIC_API_KEY in den Vercel-Einstellungen unter "Environment Variables".'
      });
    }

    console.log(`API-Route: Empfange Anfrage für Provider ${analysisRequest.provider}...`);

    let llmResult: LLMAnalysisResponse;

    if (analysisRequest.provider === 'anthropic') {
      try {
        const prompt = generatePrompt(analysisRequest);
        llmResult = await queryAnthropicClaude(prompt, apiKey);
      } catch (apiError: any) {
        console.error('API-Route: Fehler bei der Claude API-Anfrage:', apiError);
        
        // Prüfen, ob es ein API-Schlüssel-Problem ist
        if (apiError.message && (
          apiError.message.includes('API-Authentifizierungsfehler') || 
          apiError.message.includes('401') ||
          apiError.message.includes('authentication')
        )) {
          return response.status(401).json({ 
            message: 'API key invalid',
            details: 'Der konfigurierte API-Schlüssel ist ungültig oder abgelaufen. Bitte aktualisieren Sie den ANTHROPIC_API_KEY in den Vercel-Einstellungen.'
          });
        }
        
        // Andere API-Fehler
        return response.status(500).json({ 
          message: 'Error querying Claude API',
          details: apiError.message
        });
      }
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
    const statusCode = error.message?.includes('Bad Request') ? 400 : 500;

    // Verbesserte Fehlerdetails
    const errorDetails = {
      message: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15),
      errorType: error.name || 'UnknownError'
    };
    
    return response.status(statusCode).json(errorDetails);
  }
} 