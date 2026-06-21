import { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Headphones,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useCalls } from '../hooks/useCalls';
import { getCallMetrics } from '../utils/metrics';
import { EmptyVisual, PageFrame, ScoreRing, Sparkline, StatTile, VisualPanel } from '../components/DashboardVisuals';
import { safeNumber, scoreTone } from '../utils/visual';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getScore(call) {
  return safeNumber(call.scores?.overallScore ?? call.scores?.overall_score);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function HistoryPage({ onCallSelect }) {
  const { calls, loading, refetch } = useCalls();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const processedCalls = useMemo(() => {
    const filtered = calls.filter((call) => {
      const haystack = `${call.callId} ${call.agentId}`.toLowerCase();
      return haystack.includes(searchTerm.toLowerCase()) && (statusFilter === 'all' || call.status === statusFilter);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'score') return getScore(b) - getScore(a);
      if (sortMode === 'agent') return a.agentId.localeCompare(b.agentId);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [calls, searchTerm, statusFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(processedCalls.length / pageSize));
  const pageCalls = processedCalls.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const scoredCalls = processedCalls.filter((call) => call.status === 'scored');
  const avgScore = scoredCalls.length ? scoredCalls.reduce((sum, call) => sum + getScore(call), 0) / scoredCalls.length : 0;

  const exportToCSV = () => {
    const headers = ['Call ID', 'Agent', 'Duration', 'Agent %', 'Score', 'Status', 'Created At'];
    const rows = processedCalls.map((call) => {
      const metrics = getCallMetrics(call);
      return [call.callId, call.agentId, metrics.duration, metrics.agentPct, getScore(call) || 'N/A', call.status, new Date(call.createdAt).toLocaleString()];
    });
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `call-history-${Date.now()}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <PageFrame className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatTile icon={Headphones} label="Library" value={processedCalls.length} helper="Visible calls" />
        <StatTile icon={SlidersHorizontal} label="Avg Score" value={avgScore ? avgScore.toFixed(0) : 'N/A'} helper="Filtered set" tone="teal">
          <Sparkline values={processedCalls.map(getScore).filter(Boolean).slice(0, 12).reverse()} color="#2dd4bf" className="mt-2" />
        </StatTile>
        <StatTile icon={Filter} label="Scored" value={scoredCalls.length} helper="Ready to inspect" tone="blue" />
        <StatTile icon={Calendar} label="Failed" value={processedCalls.filter((call) => call.status === 'failed').length} helper="Needs attention" tone="amber" />
      </section>

      <VisualPanel className="p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="stat-label">History</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Call board</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ID or agent"
                className="focus-ring w-64 rounded-xl border border-white/10 bg-black/28 py-2 pl-10 pr-9 text-sm text-white placeholder:text-slate-600"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} className="focus-ring rounded-xl border border-white/10 bg-black/28 px-3 py-2 text-sm font-bold text-white">
              <option value="all">All status</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="transcribed">Transcribed</option>
              <option value="scored">Scored</option>
              <option value="failed">Failed</option>
            </select>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="focus-ring rounded-xl border border-white/10 bg-black/28 px-3 py-2 text-sm font-bold text-white">
              <option value="newest">Newest</option>
              <option value="score">Best score</option>
              <option value="agent">Agent</option>
            </select>
            <button onClick={exportToCSV} disabled={!processedCalls.length} className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white disabled:opacity-40" aria-label="Export CSV">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={refetch} className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white" aria-label="Refresh history">
              <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {pageCalls.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageCalls.map((call) => (
              <CallCard key={call._id || call.callId} call={call} onClick={() => onCallSelect(call.callId)} />
            ))}
          </div>
        ) : (
          <EmptyVisual icon={Headphones} title="No calls found" hint="Try a different filter or upload a new recording." />
        )}

        {processedCalls.length > pageSize && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </VisualPanel>
    </PageFrame>
  );
}

function CallCard({ call, onClick }) {
  const metrics = getCallMetrics(call);
  const score = getScore(call);
  const tone = scoreTone(score);

  return (
    <button onClick={onClick} className="float-in rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition-all hover:-translate-y-1 hover:border-teal-300/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-black text-rose-300">{call.callId}</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">{call.agentId}</p>
        </div>
        <span className={cx('rounded-full px-2 py-1 text-[10px] font-black uppercase', call.status === 'scored' ? 'bg-emerald-400/12 text-emerald-200' : call.status === 'failed' ? 'bg-rose-400/12 text-rose-200' : 'bg-amber-400/12 text-amber-200')}>
          {call.status}
        </span>
      </div>

      <div className="grid grid-cols-[96px_1fr] items-center gap-4">
        <ScoreRing score={score} size={96} stroke={9} label="" />
        <div>
          <p className={cx('text-sm font-black', tone.text)}>{tone.label}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(call.createdAt)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-teal-300" style={{ width: `${Math.min(safeNumber(metrics.agentPct), 100)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-600">
            <span>{metrics.agentPct}% agent</span>
            <span>{metrics.duration}s</span>
          </div>
        </div>
      </div>
    </button>
  );
}
