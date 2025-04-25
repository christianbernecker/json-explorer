// Panel component TypeScript definition
import { ReactNode } from 'react';

export interface PanelProps {
  id?: string;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  isDarkMode: boolean;
  isCollapsed?: boolean;
  onCollapse?: () => void;
  collapsible?: boolean;
} 