import React, { useState } from 'react';
import ButterflyFlow from './components/ButterflyFlow';
import IntroScreen from './components/IntroScreen';
import './index.css';

function App() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="App min-h-screen bg-black text-white">
      {hasStarted ? (
        <ButterflyFlow />
      ) : (
        <IntroScreen onStart={() => setHasStarted(true)} />
      )}
    </div>
  );
}

export default App;