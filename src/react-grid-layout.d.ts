declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export type Layouts = { [key: string]: Layout[] };

  export interface ResponsiveProps {
    width?: number;
    layouts: Layouts;
    breakpoints?: { [key: string]: number };
    cols?: { [key: string]: number };
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    draggableHandle?: string;
    draggableCancel?: string;
    verticalCompact?: boolean;
    compactType?: "vertical" | "horizontal" | null;
    layout?: Layout[];
    preventCollision?: boolean;
    isResizable?: boolean;
    isDraggable?: boolean;
    useCSSTransforms?: boolean;
    transformScale?: number;
    resizeHandles?: Array<"s" | "w" | "e" | "n" | "sw" | "nw" | "se" | "ne">;
    onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
    onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
    onWidthChange?: (containerWidth: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
    children?: React.ReactNode;
    className?: string;
  }

  export class Responsive extends React.Component<ResponsiveProps> {}
  
  export function WidthProvider<P>(
    ComposedComponent: React.ComponentType<P>
  ): React.ComponentType<P>;
} 