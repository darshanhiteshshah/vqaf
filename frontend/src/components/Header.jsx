import { Headphones, BarChart3, Home, Clock, ArrowLeft } from 'lucide-react';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Header({ currentView, onNavigate }) {
  return (
    <header className="border-b border-red-900/20 bg-gray-950/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentView !== 'main' && (
            <button
              onClick={() => onNavigate('main')}
              className="p-2 hover:bg-red-900/20 rounded-lg transition-all mr-2 border border-red-900/30"
            >
              <ArrowLeft className="h-5 w-5 text-red-400" />
            </button>
          )}
          <div className="h-11 w-11 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Voice QA Framework</h1>
            <p className="text-xs text-gray-500">Speech-to-Text Analysis System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Buttons */}
          <button
            onClick={() => onNavigate('main')}
            className={cx(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all border',
              currentView === 'main'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-red-900/50'
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className={cx(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all border',
              currentView === 'analytics'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-red-900/50'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={cx(
              'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all border',
              currentView === 'history'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-red-900/50'
            )}
          >
            <Clock className="h-4 w-4" />
            History
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-medium">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
