// LLM Service für die Datenanalyse und Visualisierungsvorschläge
// Dieser Service kommuniziert mit unserer eigenen API-Route (/api/analyze-data)

import { AggregatedData, DataRow } from '../types';
import type { MessageRole } from '../types/index';

// Interface für den LLM-Request (an unsere API-Route)
interface LLMAnalysisRequest {
  data: DataRow[];
  dimensions: string[];
  metrics: string[];
  aggregatedData?: AggregatedData[];
  selectedDimension?: string;
  selectedMetric?: string;
  provider: 'openai' | 'anthropic'; // Provider wird an die API-Route gesendet
}

// Interface für die LLM-Antwort (von unserer API-Route)
export interface LLMAnalysisResponse {
  insights: string[];
  visualizationSuggestion: {
    type: 'bar' | 'line' | 'pie' | 'radar' | 'area';
    dimension: string;
    metric: string;
    explanation: string;
  };
  additionalQuestions: string[];
}

// Nachrichten-Interface für die API (wird aktuell nur für die alte sendMessageToClaude verwendet)
interface Message {
  role: MessageRole;
  content: string;
}

/**
 * Sendet eine Analyseanfrage an unsere Backend API-Route
 */
const queryApiRoute = async (request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> => {
  console.log('llmService: Sende Anfrage an /api/analyze-data', request);
  try {
    const response = await fetch('/api/analyze-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      // Versuche, die Fehlermeldung vom Backend zu parsen
      let errorMessage = `API route error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Fehlerdetails von API-Route:', errorData);
      } catch (jsonError) {
        // Fallback, wenn die Antwort kein JSON ist
        const textError = await response.text();
        console.error('Nicht-JSON Fehler von API-Route:', textError);
        errorMessage = `${errorMessage} - ${textError}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('llmService: Antwort von /api/analyze-data erhalten');
    return data as LLMAnalysisResponse;

  } catch (error: any) {    
    console.error('llmService: Fehler bei der Anfrage an /api/analyze-data:', error);
    // Fallback auf Mock-Antwort bei Netzwerkfehlern etc.
    return {
      insights: [
        "Fehler bei der API-Anfrage - Fallback-Antwort",
        error.message || "Bitte überprüfe deine Netzwerkverbindung und die Serverlogs",
        "Dies ist eine generierte Beispielantwort"
      ],
      visualizationSuggestion: {
        type: "bar",
        dimension: request.selectedDimension || request.dimensions[0] || "",
        metric: request.selectedMetric || request.metrics[0] || "",
        explanation: "Dies ist eine Fallback-Erklärung"
      },
      additionalQuestions: [
        "Ist die API-Route (/api/analyze-data) erreichbar?",
        "Sind die Server-Logs auf Vercel aufschlussreich?"
      ]
    };
  }
};

/**
 * Hauptfunktion zur Analyse der Daten mit einem LLM
 * Ruft jetzt die interne API-Route auf.
 */
export const analyzeDatatWithLLM = async (
  request: Omit<LLMAnalysisRequest, 'provider'>, // Frontend muss keinen Provider mehr angeben, API entscheidet
  provider: 'openai' | 'anthropic' = 'anthropic' // Behalte den Parameter für evtl. zukünftige Frontend-Auswahl
): Promise<LLMAnalysisResponse> => {
  
  // Erstelle das vollständige Request-Objekt für die API-Route
  const apiRequest: LLMAnalysisRequest = { ...request, provider };

  // Rufe die API-Route auf
  const response = await queryApiRoute(apiRequest);
  
  // Fülle ggf. fehlende Werte aus der Antwort (obwohl die API das jetzt tun sollte)
  if (!response.visualizationSuggestion.dimension && request.dimensions.length > 0) {
    response.visualizationSuggestion.dimension = request.selectedDimension || request.dimensions[0];
  }
  
  if (!response.visualizationSuggestion.metric && request.metrics.length > 0) {
    response.visualizationSuggestion.metric = request.selectedMetric || request.metrics[0];
  }
  
  return response;
};

// Erstelle ein benanntes Export-Objekt
const llmService = {
  analyzeDatatWithLLM
};

export default llmService;

// --- Alte Funktionen (können entfernt oder überarbeitet werden) ---

// Die folgenden Funktionen machen jetzt keinen Sinn mehr im Frontend,
// da die API-Keys nicht mehr hier verfügbar sind.
// Sie bleiben vorerst hier, falls sie für andere Zwecke (z.B. Chat) benötigt werden.

export async function sendMessageToClaude(messages: Message[]): Promise<string> {
  // DIESE FUNKTION FUNKTIONIERT NICHT MEHR DIREKT VOM FRONTEND
  // WEGEN FEHLENDEM SICHEREN API KEY ZUGRIFF
  console.error('sendMessageToClaude direkt vom Frontend ist nicht mehr sicher und wird nicht unterstützt.');
  throw new Error('Direkte Frontend-Aufrufe an Claude sind nicht sicher implementiert.');

  /* Alter, unsicherer Code:
  try {
    const CLAUDE_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || '';
    if (!CLAUDE_API_KEY) throw new Error('Claude API Key fehlt (REACT_APP_)');
    
    // ... restlicher alter Code ...

  } catch (error) {
    console.error('Error sending message to Claude:', error);
    throw error;
  }
  */
}

// Generische Funktion zum Senden an jeden LLM-Dienst
export async function sendMessageToLLM(
  provider: 'Claude' | 'ChatGPT',
  messages: Message[]
): Promise<string> {
  // DIESE FUNKTION MUSS ÜBERARBEITET WERDEN, UM EINE API-ROUTE ZU NUTZEN
  console.error('sendMessageToLLM muss überarbeitet werden, um eine sichere API-Route zu nutzen.');
  throw new Error('Direkte Frontend-Aufrufe an LLMs sind nicht sicher implementiert.');

  /*
  try {
    if (provider === 'Claude') {
      return await sendMessageToClaude(messages); // Unsicher!
    } else {
      // ChatGPT wird später implementiert
      throw new Error('ChatGPT is not yet implemented');
    }
  } catch (error) {
    console.error(`Error sending message to ${provider}:`, error);
    throw error;
  }
  */
} 