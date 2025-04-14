import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JsonToolsApp from './components/JsonToolsApp';
import { Privacy, Imprint } from './pages';
import ConsentManager from './cmp';

const App: React.FC = () => {
  const basename = process.env.PUBLIC_URL || '';
  
  return (
    <Router basename={basename}>
      <ConsentManager />
      <Routes>
        <Route path="/legal/privacy" element={<Privacy isDarkMode={false} />} />
        <Route path="/legal/imprint" element={<Imprint isDarkMode={false} />} />
        <Route path="/" element={<JsonToolsApp />} />
      </Routes>
    </Router>
  );
};

export default App; 