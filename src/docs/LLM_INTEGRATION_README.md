# LLM-Integration im DataVisualizer

Dieser Prototyp demonstriert die Integration von Large Language Models (LLMs) in den DataVisualizer zur automatischen Datenanalyse und Visualisierungsvorschlägen.

## Überblick

Die LLM-Integration ermöglicht folgende Funktionen:

1. **Automatische Datenanalyse**: Nach dem Hochladen von XLSX/CSV-Dateien werden die Daten an ein LLM geschickt, das wichtige Erkenntnisse extrahiert
2. **Visualisierungsvorschläge**: Das LLM schlägt geeignete Visualisierungstypen basierend auf den Daten vor
3. **Einheitliche Ansicht**: Die LLM-Insights werden zusammen mit der Visualisierung und Tabelle in einer Ansicht dargestellt

## Komponenten des Prototyps

Der Prototyp besteht aus folgenden Hauptkomponenten:

### 1. llmService (src/services/llmService.ts)

Ein Service, der die Kommunikation mit LLM-APIs (Claude oder ChatGPT) übernimmt. Im Prototyp werden Mock-Antworten zurückgegeben, die in einer Produktionsversion durch echte API-Aufrufe ersetzt werden würden.

### 2. DataVisualizerAITab (src/components/DataVisualizerAITab.tsx)

Eine Komponente, die die LLM-Analysen und Visualisierungsvorschläge anzeigt. Sie enthält:
- Ein Panel für die LLM-Insights
- Steuerelemente zum Wechseln des LLM-Providers
- Die Visualisierung und Tabelle

### 3. DataVisualizerPlugin (src/components/DataVisualizerPlugin.tsx)

Ein Wrapper für die Integration in den bestehenden DataVisualizer.

## Integration in den DataVisualizer

Da der bestehende DataVisualizer komplex ist und direkte Änderungen zu Konflikten führen können, wurde ein Plugin-basierter Ansatz gewählt:

1. Das Plugin kann als separate Komponente hinzugefügt werden
2. Es kommuniziert mit dem bestehenden DataVisualizer über Props und Callbacks
3. Es gibt einen nahtlosen Übergang zwischen Standard- und KI-basierter Ansicht

## Beispiel-Integration

Die Datei `src/docs/DataVisualizerPlugin.example.tsx` zeigt, wie das Plugin in eine Komponente integriert werden kann.

## Nächste Schritte

Um den Prototyp in eine Produktionsversion zu überführen:

1. **API-Integration**: Die Mock-Implementierungen im llmService durch echte API-Aufrufe ersetzen
2. **DataVisualizer-Integration**: Das Plugin in die bestehende DataVisualizer-Komponente integrieren
3. **UI-Verbesserungen**: Die UI für die LLM-Insights und Visualisierungsvorschläge optimieren
4. **Erweiterte Funktionen**: Möglichkeit hinzufügen, direktes Feedback zum LLM zu geben und Folge-Anfragen zu stellen

## Prototyp-Limitierungen

- Keine echten API-Aufrufe
- Keine Integration in den bestehenden DataVisualizer
- Begrenzte UI-Funktionalität
- Fehlende Fehlerbehandlung und Ratenbegrenzung

## Verwendete Technologien

- React & TypeScript
- Tailwind CSS für das Styling
- Recharts für die Visualisierungen
- AG-Grid für die Tabellen

## Autoren

- Das AdTech-Toolbox-Team 