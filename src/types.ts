export interface HistoryItemProps {
  item: HistoryItem;
  index: number;
  onRestore: (item: HistoryItem) => void;
  isDarkMode: boolean;
}

export interface HistoryItem {
  type: 'json' | 'json_vast' | 'json_diff';
  content?: any;
  jsonContent?: any;
  vastContent?: string;
  vastPath?: string;
  vastUrl?: string;
  leftJson?: string;
  rightJson?: string;
  comparisonMode?: string;
  timestamp: number;
}

export interface SearchPanelProps {
  targetRef: React.RefObject<HTMLDivElement>;
  contentType: 'JSON' | 'VAST' | string;
  isDarkMode: boolean;
  onSearch?: (term: string) => void;
}

export interface JsonVastExplorerProps {
  isDarkMode: boolean;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  addToHistory?: (item: HistoryItem) => void;
}

export interface JsonDiffInspectorProps {
  isDarkMode: boolean;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface TabNavigationProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isDarkMode: boolean;
}

export interface StructuralDifference {
  path: string;
  type: 'missing_in_right' | 'missing_in_left';
  description: string;
}

export interface ValueDifference {
  path: string;
  leftValue: any;
  rightValue: any;
  description: string;
}

export interface JsonToolsAppProps {
  parentIsDarkMode: boolean;
  toggleDarkMode: () => void;
}

// DataVisualizer Typen
export interface DataRow {
  [key: string]: any;
}

export interface AggregatedData {
  name: string;
  value: number;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'area'; 

// Neue Typen für die Suchfunktionalität
export enum ContentType {
  JSON = 'JSON',
  XML = 'XML',
  TEXT = 'TEXT'
}

export interface SearchResult {
  type: string;
  path: string;
  line: number;
  context: string;
  match: string;
  contentType: ContentType;
}

export interface SearchOptions {
  caseSensitive: boolean;
  inKeys: boolean;
  inValues: boolean;
  useRegex: boolean;
} 