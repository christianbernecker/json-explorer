import { ReactNode } from "react";

// MessageRole für LLM-Services
export type MessageRole = "user" | "assistant" | "system";

// Props für den JsonVastExplorer
export interface JsonVastExplorerProps {
  isDarkMode: boolean;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

// Props für den JSON Diff Tool
export interface JsonDiffToolProps {
  isDarkMode: boolean;
}

// HistoryItem für gespeicherte Dateneingaben
export type HistoryItem = {
  id?: string;
  type: string;
  content: any;
  jsonContent?: any;
  vastContent?: string | null;
  vastUrl?: string;
  timestamp: number;
};

// Props für JsonHistoryPanel
export interface JsonHistoryPanelProps {
  isDarkMode: boolean;
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClose: () => void;
}

// Props für JsonSearch
export interface JsonSearchProps {
  isDarkMode: boolean;
  isVisible: boolean;
  onClose: () => void;
  onSearchComplete: (count: number) => void;
  jsonRef: React.RefObject<HTMLDivElement>;
  vastRef: React.RefObject<HTMLDivElement>;
  activeTabIndex: number;
}

// ButtonProps für shared/Button
export interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  title?: string;
  isDarkMode: boolean;
}

// CardProps für shared/Card
export interface CardProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
  isDarkMode: boolean;
}

// GVLDecoderProps für GVLDecoder
export interface GVLDecoderProps {
  isDarkMode: boolean;
}
