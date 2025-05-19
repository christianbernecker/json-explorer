import React, { useState, useEffect } from 'react';
import { GVL } from '@iabtechlabtcf/core';
import { loadAndCacheGVL } from '../../services/tcfService';
import Button from '../shared/Button';

interface GVLExplorerProps {
  isDarkMode: boolean;
  onViewVendorDetails: (vendor: any) => void;
}

/**
 * Komponente zum Durchsuchen und Anzeigen der Global Vendor List (GVL)
 * 
 * Ermöglicht das Durchsuchen der GVL nach Vendor-Namen oder IDs und
 * die Anzeige von Details zu einzelnen Vendoren.
 */
const GVLExplorer: React.FC<GVLExplorerProps> = ({
  isDarkMode,
  onViewVendorDetails
}) => {
  // State
  const [gvlExplorerInstance, setGvlExplorerInstance] = useState<GVL | null>(null);
  const [isLoadingGVL, setIsLoadingGVL] = useState<boolean>(false);
  const [gvlError, setGvlError] = useState<string | null>(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>('');
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);

  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const errorColor = isDarkMode ? 'text-red-300' : 'text-red-600';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
  const tableRowBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  // Laden der GVL, wenn die Komponente initialisiert wird
  useEffect(() => {
    async function fetchGVLForExplorer() {
      try {
        setIsLoadingGVL(true);
        setGvlError(null);
        const gvl = await loadAndCacheGVL();
        setGvlExplorerInstance(gvl);
        updateFilteredVendors(gvl, vendorSearchTerm);
      } catch (error) {
        console.error('Error loading GVL for Explorer:', error);
        setGvlError(error instanceof Error ? error.message : 'Unknown error loading GVL for Explorer');
        setGvlExplorerInstance(null);
      } finally {
        setIsLoadingGVL(false);
      }
    }
    
    fetchGVLForExplorer();
  }, [vendorSearchTerm]);

  // Update filtered vendors wenn GVL-Instanz oder Suchbegriff sich ändert
  useEffect(() => {
    if (gvlExplorerInstance) {
      updateFilteredVendors(gvlExplorerInstance, vendorSearchTerm);
    }
  }, [gvlExplorerInstance, vendorSearchTerm]);

  // Filter function for vendors
  function updateFilteredVendors(gvl: GVL, searchTerm: string) {
    if (!gvl || !gvl.vendors) {
      setFilteredVendors([]);
      return;
    }
    
    // `gvl.vendors` ist ein Objekt { id: vendorObject }. Konvertiere zu Array.
    let filtered = Object.values(gvl.vendors);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        const idMatch = v.id.toString().includes(term);
        const nameMatch = v.name.toLowerCase().includes(term);
        return idMatch || nameMatch;
      });
    }
    
    // Sortiere nach ID
    filtered.sort((a, b) => a.id - b.id);

    setFilteredVendors(filtered);
  }

  // Export the entire GVL as JSON
  const handleExportGVL = () => {
    if (!gvlExplorerInstance) return;
    
    try {
      const jsonStr = JSON.stringify(gvlExplorerInstance, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gvl-export.json';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting GVL:', error);
    }
  };

  return (
    <div className={`${textColor}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Global Vendor List (GVL) Explorer</h2>
        <p className={`mb-4 ${secondaryTextColor}`}>
          Durchsuche und erforsche die aktuelle Global Vendor List
        </p>
        
        {/* GVL-Fehler anzeigen */}
        {gvlError && (
          <div className={`p-3 mb-4 rounded-md ${errorColor} bg-opacity-20 bg-red-900`}>
            <p>Error: {gvlError}</p>
          </div>
        )}
        
        {/* Suchfeld */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex-grow">
            <input 
              type="text"
              placeholder="Suche nach Vendor-Name oder ID..."
              className={`w-full p-2 border ${inputBorderColor} ${inputBgColor} rounded-md`}
              value={vendorSearchTerm}
              onChange={(e) => setVendorSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleExportGVL}
            isDarkMode={isDarkMode}
            className="bg-green-600 hover:bg-green-700"
            disabled={!gvlExplorerInstance}
            variant="export"
          >
            GVL exportieren
          </Button>
        </div>
      </div>
      
      {/* Loading-Anzeige */}
      {isLoadingGVL && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Lade GVL...</span>
        </div>
      )}
      
      {/* Vendor-Tabelle */}
      {!isLoadingGVL && gvlExplorerInstance && (
        <div className={`border ${borderColor} rounded-md overflow-hidden`}>
          <table className="min-w-full divide-y divide-gray-700">
            <thead className={tableHeaderBg}>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Zwecke</th>
                <th className="px-4 py-2 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredVendors.length === 0 ? (
                <tr className={tableRowBg}>
                  <td colSpan={4} className="px-4 py-3 text-center">
                    {vendorSearchTerm ? 'Keine Vendoren gefunden.' : 'Lade Vendoren...'}
                  </td>
                </tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id} className={tableRowBg}>
                    <td className="px-4 py-2">{vendor.id}</td>
                    <td className="px-4 py-2">{vendor.name}</td>
                    <td className="px-4 py-2">
                      {vendor.purposes && Object.keys(vendor.purposes).length > 0 
                        ? Object.keys(vendor.purposes).join(', ') 
                        : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <Button 
                        onClick={() => onViewVendorDetails(vendor)}
                        isDarkMode={isDarkMode}
                        className="text-xs"
                        variant="primary"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GVLExplorer; 