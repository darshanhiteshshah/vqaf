import { Activity, BarChart3, Clock, Headphones, Home, Search, UploadCloud } from 'lucide-react';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navItems = [
  { view: 'main', label: 'Studio', icon: <Home className="h-4 w-4" /> },
  { view: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { view: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
  { view: 'history', label: 'History', icon: <Clock className="h-4 w-4" /> }
];

export default function Header({ currentView, onNavigate }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07080b]/72 backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            onClick={() => onNavigate('main')}
            className="focus-ring flex min-w-0 items-center gap-3 rounded-2xl text-left"
            aria-label="Open studio"
          >
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-teal-500 shadow-xl shadow-rose-950/30">
              <Headphones className="h-6 w-6 text-white" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#07080b] bg-teal-300" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black tracking-tight text-white">VQAF</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Activity className="h-3 w-3 text-teal-300" />
                Live QA cockpit
              </span>
            </span>
          </button>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
            <nav className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-inner shadow-black/30">
              {navItems.map(({ view, label, icon }) => (
                <button
                  key={view}
                  onClick={() => onNavigate(view)}
                  className={cx(
                    'focus-ring flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all sm:px-4',
                    currentView === view
                      ? 'bg-white text-slate-950 shadow-lg shadow-black/30'
                      : 'text-slate-400 hover:bg-white/7 hover:text-white'
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => onNavigate('main')}
              className="focus-ring hidden items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/12 px-4 py-2 text-xs font-black text-rose-100 transition-all hover:bg-rose-500/18 sm:flex"
            >
              <UploadCloud className="h-4 w-4" />
              Analyze
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
