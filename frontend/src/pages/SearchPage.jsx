import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Brain, Loader2, Radar, Search, Sparkles, Target } from 'lucide-react';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';
import { EmptyVisual, PageFrame, ScoreRing, Sparkline, VisualPanel } from '../components/DashboardVisuals';
import { safeNumber, scoreTone } from '../utils/visual';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getScores(result) {
  const similarity = Math.max(safeNumber(result.similarity), 0);
  const keywordScore = safeNumber(result.keywordScore);
  const relevance = safeNumber(result.relevance, Math.max(similarity, keywordScore));
  return { similarity, keywordScore, relevance };
}

export default function SearchPage({ onCallSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const examples = ['refund anger', 'no empathy', 'billing escalation', 'unresolved issue', 'strong greeting'];
  const topRelevance = useMemo(() => Math.max(...results.map((result) => getScores(result).relevance), 0), [results]);

  const handleSearch = async (event) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await api.searchCalls(cleanQuery, 15);
      setResults(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame className="space-y-6">
      <VisualPanel className="p-6 sm:p-8" glow>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1 text-xs font-black text-teal-100">
              <Brain className="h-3.5 w-3.5" />
              Semantic retrieval
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Find moments, not filenames</h1>
            <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by issue, behavior, sentiment..."
                  className="focus-ring w-full rounded-2xl border border-white/10 bg-black/28 py-4 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="focus-ring flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition-all hover:bg-teal-100 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="focus-ring rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-400 transition-all hover:border-teal-300/30 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="stat-label">Match field</p>
                <p className="text-xl font-black text-white">{results.length || 0} hits</p>
              </div>
              <Radar className="h-7 w-7 text-teal-300" />
            </div>
            <Sparkline values={results.map((result) => getScores(result).relevance * 100)} color="#2dd4bf" className="h-24" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Peak relevance {Math.round(topRelevance * 100)}%</p>
          </div>
        </div>
      </VisualPanel>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <section className="grid gap-4">
        {loading && (
          <VisualPanel className="p-8">
            <EmptyVisual icon={Loader2} title="Searching" hint="Ranking calls by semantic and keyword relevance." />
          </VisualPanel>
        )}

        {searched && !loading && !results.length && !error && (
          <VisualPanel>
            <EmptyVisual icon={Search} title="No matches" hint="Try a broader phrase or search by customer issue." />
          </VisualPanel>
        )}

        {!loading && results.map((result, index) => (
          <ResultCard key={result.callId} result={result} rank={index + 1} onOpen={() => onCallSelect(result.callId)} />
        ))}
      </section>
    </PageFrame>
  );
}

function ResultCard({ result, rank, onOpen }) {
  const scores = getScores(result);
  const qaScore = safeNumber(result.score);
  const tone = scoreTone(qaScore);

  return (
    <button onClick={onOpen} className="float-in w-full rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-left transition-all hover:-translate-y-1 hover:border-teal-300/40 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[92px_1fr_220px] lg:items-center">
        <div className="flex items-center gap-3 lg:flex-col lg:items-start">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-base font-black text-slate-950">{rank}</span>
          <ScoreRing score={qaScore} size={86} stroke={8} label="" />
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-black text-rose-300">{result.callId}</span>
            <span className="rounded-full bg-white/[0.06] px-2 py-1 text-xs font-bold text-slate-400">{result.agentId}</span>
            {result.createdAt && <span className="text-xs font-semibold text-slate-600">{formatDate(result.createdAt)}</span>}
          </div>
          <p className={cx('mb-2 text-sm font-black', tone.text)}>{tone.label} QA</p>
          <p className="line-clamp-2 text-sm leading-6 text-slate-300">{result.snippet || result.summary || 'No summary available.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[result.category, result.sentiment, ...(result.matchedTerms || []).slice(0, 3)].filter(Boolean).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-xs font-bold text-slate-400">{tag}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="stat-label">Relevance</p>
              <p className="text-2xl font-black text-white">{Math.round(scores.relevance * 100)}%</p>
            </div>
            <Target className="h-6 w-6 text-teal-300" />
          </div>
          <MiniBar label="semantic" value={scores.similarity} />
          <MiniBar label="keyword" value={scores.keywordScore} />
          <div className="mt-4 flex justify-end">
            <ArrowRight className="h-5 w-5 text-slate-500" />
          </div>
        </div>
      </div>
    </button>
  );
}

function MiniBar({ label, value }) {
  const percent = Math.round(safeNumber(value) * 100);

  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900">
        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-teal-300" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
