import { useState } from 'react';
import './index.css';
import { ConfigPage } from './components/Configuration/ConfigPage';
import { PresentationPage } from './components/Presentation/PresentationPage';
import type { Predictions, ReviewData } from './models/types';

// Type definition for the view state
type AppView = 'config' | 'presentation';

function App() {
  const [view, setView] = useState<AppView>('config');

  const [data, setData] = useState<ReviewData | null>(null);
  const [predictions, setPredictions] = useState<Predictions | null>(null);

  const handleGenerate = (generatedData: ReviewData, generatedPredictions: Predictions) => {
    setData(generatedData);
    setPredictions(generatedPredictions);

    setView('presentation');
  };

  const handleExitReview = () => {
    setView('config');
    setData(null);
  };

  return (
    <div className="App full-screen bg-gradient-main">
      {view === 'config' ? (
        <ConfigPage onGenerate={handleGenerate} />
      ) : (
        data && predictions && <PresentationPage data={data} predictions={predictions} onExit={handleExitReview} />
      )}
    </div>
  );
}

export default App;
