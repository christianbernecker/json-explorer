import React, { useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataRow } from '../../services/types';
import Button from '../shared/Button';

interface FileUploadProps {
  onFileSelected: (data: DataRow[]) => void;
}

/**
 * Komponente für den Datei-Upload im DataVisualizer
 * 
 * Ermöglicht das Hochladen von Dateien per Drag & Drop oder Dateiauswahl.
 * Unterstützt CSV, Excel und JSON-Dateien.
 */
export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let parsedData: DataRow[] = [];

      if (file.name.endsWith('.csv')) {
        // CSV-Datei parsen
        parsedData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (result) => {
              if (result.errors && result.errors.length > 0) {
                console.warn('CSV parsing errors:', result.errors);
              }
              resolve(result.data as DataRow[]);
            },
            error: (error) => {
              reject(error);
            }
          });
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Excel-Datei parsen
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.name.endsWith('.json')) {
        // JSON-Datei parsen
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Prüfen, ob es ein Array oder ein Objekt mit einem Datenarray ist
        if (Array.isArray(jsonData)) {
          parsedData = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          parsedData = jsonData.data;
        } else {
          // Versuchen, ein verschachteltes Objekt zu einem flachen Array zu konvertieren
          if (typeof jsonData === 'object' && jsonData !== null) {
            const firstKey = Object.keys(jsonData)[0];
            if (jsonData[firstKey] && Array.isArray(jsonData[firstKey])) {
              parsedData = jsonData[firstKey];
            } else {
              parsedData = [jsonData]; // Einzelnes Objekt als Array behandeln
            }
          }
        }
      } else {
        throw new Error('Nicht unterstütztes Dateiformat');
      }

      if (parsedData.length === 0) {
        throw new Error('Keine Daten gefunden');
      }

      onFileSelected(parsedData);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Fehler beim Verarbeiten der Datei: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }, [onFileSelected]);

  return (
    <div className="p-4">
      <div className="max-w-xl mx-auto">
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Datei hochladen</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileUpload}
                />
              </label>
              <p className="pl-1">oder hierher ziehen</p>
            </div>
            <p className="text-xs text-gray-500">
              CSV, Excel oder JSON bis zu 10MB
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Beispieldaten</h3>
          <p className="text-gray-500 mb-4">
            Du kannst auch mit einem unserer Beispieldatensätze starten:
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                fetch('/example-data/ad-performance.csv')
                  .then(response => response.blob())
                  .then(blob => {
                    const file = new File([blob], 'ad-performance.csv', { type: 'text/csv' });
                    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(event);
                  })
                  .catch(error => console.error('Error loading example file:', error));
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Ad Performance Daten
            </Button>
            <Button
              onClick={() => {
                fetch('/example-data/sales-report.json')
                  .then(response => response.blob())
                  .then(blob => {
                    const file = new File([blob], 'sales-report.json', { type: 'application/json' });
                    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(event);
                  })
                  .catch(error => console.error('Error loading example file:', error));
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Sales Report Daten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 