import React, { useState } from 'react';
import { DataRow } from '../../services/types';
import Button from '../shared/Button';

interface DataGridProps {
  data: DataRow[];
}

/**
 * Komponente zur Anzeige von strukturierten Daten in einer Tabelle
 * 
 * Vereinfachte Version zur Vorschau in der Entwicklung
 */
export const DataGrid: React.FC<DataGridProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (!data || data.length === 0) {
    return <div>Keine Daten verfügbar</div>;
  }

  const columns = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Vereinfachter Export (temporär)
  const downloadAsJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-700">
          Zeige {startIndex + 1} bis {Math.min(endIndex, data.length)} von {data.length} Einträgen
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Zurück
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Weiter
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button 
          onClick={downloadAsJson} 
          className="bg-green-600 hover:bg-green-700"
          disabled={!data || data.length === 0}
        >
          Als JSON exportieren
        </Button>
      </div>
    </div>
  );
}; 