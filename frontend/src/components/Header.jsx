import { Headphones, BarChart3, Home, Clock, ArrowLeft, Search } from 'lucide-react';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navItems = [
  { view: 'main', label: 'Home', icon: Home },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'history', label: 'History', icon: Clock }
];

export default function Header({ currentView, onNavigate }) {
  return (
    <header className="sticky top-0 z-50 border-b border-red-950/40 bg-black/55 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {currentView !== 'main' && (
              <button
                onClick={() => onNavigate('main')}
                className="focus-ring h-10 w-10 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-900/30 flex items-center justify-center transition-all"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-5 w-5 text-red-300" />
              </button>
            )}

            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-500 via-red-700 to-red-950 flex items-center justify-center red-glow shrink-0">
              <Headphones className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">
                Voice QA Framework
              </h1>
              <p className="text-xs text-red-200/60 truncate">
                Speech quality intelligence dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <nav className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-1">
              {navItems.map(({ view, label, icon: Icon }) => (
                <button
                  key={view}
                  onClick={() => onNavigate(view)}
                  className={cx(
                    'focus-ring px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap',
                    currentView === view
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-red-950/25 border border-red-900/35 rounded-xl text-xs">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/40" />
              <span className="text-red-200 font-semibold">Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
