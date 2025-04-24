import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JsonToolsApp from './components/JsonToolsApp';
import DataVisualizer from './components/DataVisualizer';
import Homepage from './components/Homepage';
import AppOverview from './components/AppOverview';
import PrivacyPage from './components/PrivacyPage';
import ImprintPage from './components/ImprintPage';
import NotFound from './components/NotFound';
import NavigationBar from './components/NavigationBar';
import { Footer } from './components/shared';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <NavigationBar />
        <main className="flex-grow pb-20">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/apps" element={<AppOverview />} />
            <Route path="/apps/json-explorer" element={<JsonToolsApp />} />
            <Route path="/apps/data-visualizer" element={<DataVisualizer />} />
            <Route path="/legal/privacy" element={<PrivacyPage />} />
            <Route path="/legal/imprint" element={<ImprintPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 