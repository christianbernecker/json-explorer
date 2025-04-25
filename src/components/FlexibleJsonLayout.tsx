import React, { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../gridlayout.css';

// Import icons
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Definiere den Panel-Typ mit allen erforderlichen Eigenschaften
export interface PanelConfig {
  id: string;
  title: string;
  content: ReactNode;
  defaultSize?: { w: number; h: number; minW?: number; minH?: number };
  visible?: boolean;
}

// Props-Interface für Panel-Komponente
interface PanelProps {
  id: string;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  isDarkMode: boolean;
  isCollapsed?: boolean;
  onCollapse?: () => void;
  collapsible?: boolean;
}

// Panel-Komponente mit eigener Leiste und Styling
const Panel: React.FC<PanelProps> = ({ 
  id, 
  title, 
  onClose, 
  children, 
  isDarkMode, 
  isCollapsed = false,
  onCollapse,
  collapsible = false
}) => {
  return (
    <div 
      className={`json-explorer-panel ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
      border rounded-lg shadow-sm`}
      data-grid-id={id}
    >
      <div 
        className={`json-explorer-panel-header ${isDarkMode ? 'bg-gray-700 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
      >
        <div className="font-medium">{title}</div>
        <div className="flex items-center space-x-2">
          {onCollapse && (
            <button 
              onClick={onCollapse}
              className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              title={isCollapsed ? "Erweitern" : "Einklappen"}
            >
              {isCollapsed ? (
                <ArrowsPointingOutIcon className="w-4 h-4" />
              ) : (
                <ArrowsPointingInIcon className="w-4 h-4" />
              )}
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              title="Schließen"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className={`json-explorer-panel-body ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {children}
      </div>
    </div>
  );
};

// Predefined layouts for different screen sizes
// Format: x, y, w, h, minW, minH, maxW, maxH

// Large screens (lg)
const lgLayout = [
  { i: 'input', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'output', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'vast', x: 0, y: 11, w: 12, h: 10, minW: 4, minH: 8 },
];

// Medium screens (md)
const mdLayout = [
  { i: 'input', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
  { i: 'output', x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
  { i: 'vast', x: 0, y: 13, w: 12, h: 12, minW: 4, minH: 8 },
];

// Small screens (sm)
const smLayout = [
  { i: 'input', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'output', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'vast', x: 0, y: 11, w: 12, h: 10, minW: 4, minH: 8 },
];

// Extra small screens (xs)
const xsLayout = [
  { i: 'input', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 6 },
  { i: 'output', x: 0, y: 10, w: 6, h: 10, minW: 3, minH: 6 },
  { i: 'vast', x: 0, y: 20, w: 6, h: 10, minW: 3, minH: 6 },
];

// Extra extra small screens (xxs)
const xxsLayout = [
  { i: 'input', x: 0, y: 0, w: 4, h: 8, minW: 2, minH: 4 },
  { i: 'output', x: 0, y: 8, w: 4, h: 8, minW: 2, minH: 4 },
  { i: 'vast', x: 0, y: 16, w: 4, h: 8, minW: 2, minH: 4 },
];

// Layout presets
const layoutPresets: Record<string, {
  name: string;
  lg: Layout[];
  md: Layout[];
  sm: Layout[];
  xs: Layout[];
  xxs: Layout[];
  layouts?: Layouts;
}> = {
  'default': {
    name: 'Standard (Vertikal)',
    lg: [
      { i: 'input', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'output', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'vast', x: 0, y: 11, w: 12, h: 10, minW: 4, minH: 8 },
    ],
    md: mdLayout,
    sm: smLayout,
    xs: xsLayout,
    xxs: xxsLayout,
    layouts: {
      lg: [
        { i: 'input', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
        { i: 'output', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
        { i: 'vast', x: 0, y: 11, w: 12, h: 10, minW: 4, minH: 8 },
      ],
      md: mdLayout,
      sm: smLayout,
      xs: xsLayout,
      xxs: xxsLayout,
    }
  },
  'side-by-side': {
    name: 'Nebeneinander (2 Spalten)',
    lg: [
      { i: 'input', x: 0, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
      { i: 'output', x: 6, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
      { i: 'vast', x: 0, y: 16, w: 12, h: 12, minW: 4, minH: 8 },
    ],
    md: [
      { i: 'input', x: 0, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
      { i: 'output', x: 6, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
      { i: 'vast', x: 0, y: 16, w: 12, h: 12, minW: 4, minH: 8 },
    ],
    sm: smLayout,
    xs: xsLayout,
    xxs: xxsLayout,
  },
  'three-columns': {
    name: '3 Spalten (Breit)',
    lg: [
      { i: 'input', x: 0, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
      { i: 'output', x: 4, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
      { i: 'vast', x: 8, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
    ],
    md: [
      { i: 'input', x: 0, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
      { i: 'output', x: 4, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
      { i: 'vast', x: 8, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
    ],
    sm: smLayout,
    xs: xsLayout,
    xxs: xxsLayout,
  },
  'compact': {
    name: 'Kompakt',
    lg: [
      { i: 'input', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
      { i: 'output', x: 4, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
      { i: 'vast', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
    ],
    md: [
      { i: 'input', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
      { i: 'output', x: 4, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
      { i: 'vast', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
    ],
    sm: smLayout,
    xs: xsLayout,
    xxs: xxsLayout,
  },
};

interface FlexibleJsonLayoutProps {
  panels: PanelConfig[];
  isDarkMode: boolean;
  onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
}

const LOCAL_STORAGE_KEY = 'json-explorer-layout';

const FlexibleJsonLayout: React.FC<FlexibleJsonLayoutProps> = ({ 
  panels, 
  isDarkMode,
  onLayoutChange
}) => {
  // State für Layouts und sichtbare Panels
  const [layouts, setLayouts] = useState<Layouts>(() => {
    // Versuche, gespeicherte Layouts aus localStorage zu laden
    if (typeof window !== 'undefined') {
      const savedLayouts = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedLayouts ? JSON.parse(savedLayouts) : layoutPresets.default.layouts;
    }
    return layoutPresets.default.layouts;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const [visiblePanels, setVisiblePanels] = useState<string[]>(
    panels.filter(panel => panel.visible !== false).map(panel => panel.id)
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [collapsedPanels, setCollapsedPanels] = useState<string[]>([]);
  
  // Nicht mehr benötigt, da wir das Dropdown direkt mit Object.entries() befüllen
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activePreset, setActivePreset] = useState<string>('default');

  // Effekt zum Speichern von Layout-Änderungen im localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layouts));
    }
  }, [layouts]);
      
  // Layout-Preset anwenden
  const applyLayoutPreset = useCallback((presetKey: string) => {
    let newLayout;
    
    switch (presetKey) {
      case 'side-by-side':
        newLayout = {
          lg: [
            { i: 'input', x: 0, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
            { i: 'output', x: 6, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
            { i: 'vast', x: 0, y: 16, w: 12, h: 12, minW: 4, minH: 8 },
          ],
          md: [
            { i: 'input', x: 0, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
            { i: 'output', x: 6, y: 0, w: 6, h: 15, minW: 4, minH: 8 },
            { i: 'vast', x: 0, y: 16, w: 12, h: 12, minW: 4, minH: 8 },
          ],
          sm: smLayout,
          xs: xsLayout,
          xxs: xxsLayout,
        };
        break;
      case 'three-columns':
        newLayout = {
          lg: [
            { i: 'input', x: 0, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
            { i: 'output', x: 4, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
            { i: 'vast', x: 8, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
          ],
          md: [
            { i: 'input', x: 0, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
            { i: 'output', x: 4, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
            { i: 'vast', x: 8, y: 0, w: 4, h: 20, minW: 3, minH: 8 },
          ],
          sm: smLayout,
          xs: xsLayout,
          xxs: xxsLayout,
        };
        break;
      case 'compact':
        newLayout = {
          lg: [
            { i: 'input', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
            { i: 'output', x: 4, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
            { i: 'vast', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
          ],
          md: [
            { i: 'input', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
            { i: 'output', x: 4, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
            { i: 'vast', x: 8, y: 0, w: 4, h: 10, minW: 3, minH: 6 },
          ],
          sm: smLayout,
          xs: xsLayout,
          xxs: xxsLayout,
        };
        break;
      default: // default layout
        newLayout = layoutPresets.default.layouts;
        break;
    }
    
    if (newLayout) {
      setLayouts(newLayout);
    }
  }, []);
  
  // Set initial layouts based on active preset
  useEffect(() => {
    const preset = layoutPresets[activePreset];
    const initialLayouts: Layouts = {
      lg: preset?.lg || [],
      md: preset?.md || [],
      sm: preset?.sm || [],
      xs: preset?.xs || [],
      xxs: preset?.xxs || [],
      ...preset?.layouts
    };
    setLayouts(initialLayouts);
  }, [activePreset]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    setActivePreset(preset);
    const selectedPreset = layoutPresets[preset];
    
    const newLayouts: Layouts = {
      lg: selectedPreset?.lg || [],
      md: selectedPreset?.md || [],
      sm: selectedPreset?.sm || [],
      xs: selectedPreset?.xs || [],
      xxs: selectedPreset?.xxs || [],
      ...selectedPreset?.layouts
    };
    setLayouts(newLayouts);
  };
  
  return (
    <div className="w-full">
      {/* Layout Controls */}
      <div className={`mb-4 flex flex-wrap items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        <div className="flex items-center">
          <label className="mr-2 text-sm font-medium">Layout:</label>
          <select
            className={`px-3 py-1.5 rounded text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-700'
            } border`}
            onChange={handlePresetChange}
          >
            {Object.entries(layoutPresets).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Panel Toggle Buttons */}
          {Object.keys(visiblePanels).map((panelId) => {
            const isVisible = visiblePanels.includes(panelId);
            
            return (
              <button
                key={panelId}
                onClick={() => setVisiblePanels(prev =>
                  isVisible
                    ? prev.filter(id => id !== panelId)
                    : [...prev, panelId]
                )}
                className={`px-3 py-1.5 rounded text-sm flex items-center ${
                  isVisible
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-200 text-gray-700'
                }`}
              >
                {panelId === 'input' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Input
                  </>
                )}
                {panelId === 'output' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Output
                  </>
                )}
                {panelId === 'vast' && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    VAST
                  </>
                )}
              </button>
            );
          })}
          
          <button
            onClick={() => {
              setLayouts(layoutPresets.default.layouts || {
                lg: layoutPresets.default.lg,
                md: layoutPresets.default.md, 
                sm: layoutPresets.default.sm,
                xs: layoutPresets.default.xs,
                xxs: layoutPresets.default.xxs
              });
              setVisiblePanels(panels.filter(panel => panel.visible !== false).map(panel => panel.id));
            }}
            className={`px-3 py-1.5 rounded text-sm flex items-center ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Zurücksetzen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>
      
      {/* Grid Layout */}
      <div style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
          rowHeight={30}
          containerPadding={[0, 0]}
          margin={[12, 12]}
          onLayoutChange={onLayoutChange}
          onBreakpointChange={setCurrentBreakpoint}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".json-explorer-panel-header"
          useCSSTransforms
        >
          {/* Input Panel */}
          {visiblePanels.includes('input') && (
            <div key="input">
              <Panel 
                id="input"
                title="JSON Input" 
                isDarkMode={isDarkMode}
                onClose={() => setVisiblePanels(prev => prev.filter(id => id !== 'input'))}
                collapsible
              >
                {panels.find(panel => panel.id === 'input')?.content}
              </Panel>
            </div>
          )}
          
          {/* Output Panel */}
          {visiblePanels.includes('output') && (
            <div key="output">
              <Panel 
                id="output"
                title="Formatted JSON" 
                isDarkMode={isDarkMode}
                onClose={() => setVisiblePanels(prev => prev.filter(id => id !== 'output'))}
                collapsible
              >
                {panels.find(panel => panel.id === 'output')?.content}
              </Panel>
            </div>
          )}
          
          {/* VAST Panel (optional) */}
          {visiblePanels.includes('vast') && panels.find(panel => panel.id === 'vast') && (
            <div key="vast">
              <Panel 
                id="vast"
                title="VAST Explorer" 
                isDarkMode={isDarkMode}
                onClose={() => setVisiblePanels(prev => prev.filter(id => id !== 'vast'))}
                collapsible
              >
                {panels.find(panel => panel.id === 'vast')?.content}
              </Panel>
            </div>
          )}
        </ResponsiveGridLayout>
      </div>
      
      {/* Floating button to restore hidden panels */}
      {(!visiblePanels.includes('input') || !visiblePanels.includes('output') || (!visiblePanels.includes('vast') && panels.find(panel => panel.id === 'vast'))) && (
        <button 
          className={`layout-button shadow-md ${
            isDarkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
          onClick={() => setVisiblePanels(panels.filter(panel => panel.visible !== false).map(panel => panel.id))}
          title="Versteckte Bereiche anzeigen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default FlexibleJsonLayout; 