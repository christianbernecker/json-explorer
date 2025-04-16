import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JsonToolsApp from './components/JsonToolsApp';
import NotFound from './components/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/json-explorer" element={<JsonToolsApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App; 