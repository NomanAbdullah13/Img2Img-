import React, { useState } from 'react';
import APIKeyInput from './components/APIKeyInput';
import ImageGenerator from './components/ImageGenerator';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleAPIKeyValidated = (key: string) => {
    setApiKey(key);
  };

  const handleLogout = () => {
    setApiKey(null);
  };

  return (
    <div className="App">
      {!apiKey ? (
        <APIKeyInput onAPIKeyValidated={handleAPIKeyValidated} />
      ) : (
        <ImageGenerator apiKey={apiKey} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;