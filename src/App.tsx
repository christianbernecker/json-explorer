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
import './App.css';

function App() {
  return (
    <Router>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/apps" element={<AppOverview />} />
        <Route path="/apps/json-explorer" element={<JsonToolsApp />} />
        <Route path="/apps/data-visualizer" element={<DataVisualizer />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/imprint" element={<ImprintPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App; 