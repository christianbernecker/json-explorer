export interface DataRow {
  [key: string]: any;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface AggregatedData {
  [key: string]: {
    [key: string]: number;
  };
}

export interface ColumnTypes {
  dimensions: string[];
  metrics: string[];
} 