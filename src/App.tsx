import { useState } from 'react';
import './index.css';
import { ConfigPage } from './components/Configuration/ConfigPage';
import { PresentationPage } from './components/Presentation/PresentationPage';
import type { ReviewData } from './models/types';

// Type definition for the view state
type AppView = 'config' | 'presentation';

function App() {
  const [view, setView] = useState<AppView>('config');

  const [data, setData] = useState<ReviewData | null>(null);

  const handleGenerate = (generatedData: ReviewData) => {
    setData(generatedData);
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
        data && <PresentationPage data={data} onExit={handleExitReview} />
      )}
    </div>
  );
}

export default App;
