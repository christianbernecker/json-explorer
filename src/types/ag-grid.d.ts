declare module 'ag-grid-community' {
  export interface ColDef {
    field?: string;
    headerName?: string;
    width?: number;
    flex?: number;
    sortable?: boolean;
    filter?: boolean | string;
    resizable?: boolean;
    cellRenderer?: any;
    [key: string]: any;
  }

  export interface GridApi {
    sizeColumnsToFit(): void;
    [key: string]: any;
  }

  export interface GridReadyEvent {
    api: GridApi;
    [key: string]: any;
  }
}

declare module 'ag-grid-react' {
  import { Component } from 'react';
  import { ColDef, GridReadyEvent } from 'ag-grid-community';

  export interface AgGridReactProps {
    columnDefs: ColDef[];
    rowData: any[];
    pagination?: boolean;
    paginationPageSize?: number;
    onGridReady?: (params: GridReadyEvent) => void;
    defaultColDef?: {
      resizable?: boolean;
      sortable?: boolean;
      filter?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export class AgGridReact extends Component<AgGridReactProps> {}
}

declare module 'xlsx' {
  const XLSX: any;
  export = XLSX;
}

declare module 'html2canvas' {
  const html2canvas: (element: HTMLElement) => Promise<HTMLCanvasElement>;
  export default html2canvas;
} 