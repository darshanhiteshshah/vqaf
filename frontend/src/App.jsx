import { useState } from 'react';
import Header from './components/Header';
import MainPage from './pages/MainPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CallDetailPage from './pages/CallDetailPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'analytics', 'detail', 'history'
  const [selectedCallId, setSelectedCallId] = useState(null);

  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view !== 'detail') setSelectedCallId(null);
  };

  const handleCallSelect = (callId) => {
    setSelectedCallId(callId);
    setCurrentView('detail');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header currentView={currentView} onNavigate={handleNavigate} />
      
      {currentView === 'main' && <MainPage onCallSelect={handleCallSelect} />}
      {currentView === 'analytics' && <AnalyticsPage />}
      {currentView === 'detail' && <CallDetailPage callId={selectedCallId} />}
      {currentView === 'history' && <HistoryPage onCallSelect={handleCallSelect} />}
    </div>
  );
}
