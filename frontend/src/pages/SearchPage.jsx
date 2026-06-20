import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Loader2,
  Search,
  Sparkles
} from 'lucide-react';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function scoreColor(score) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getResultScores(result) {
  const similarity = Math.max(safeNumber(result.similarity), 0);
  const keywordScore = safeNumber(result.keywordScore);
  const relevance = safeNumber(
    result.relevance,
    Math.max(similarity, keywordScore)
  );

  return {
    keywordScore,
    relevance,
    similarity
  };
}

function relevanceLabel(value) {
  const percent = Math.round(safeNumber(value) * 100);
  if (percent >= 70) return `${percent}% strong match`;
  if (percent >= 40) return `${percent}% good match`;
  return `${percent}% possible match`;
}

export default function SearchPage({ onCallSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

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

  const examples = [
    'angry customer about billing',
    'low empathy and unresolved issue',
    'agent did not greet customer',
    'refund complaint with negative sentiment'
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="panel rounded-2xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 subtle-grid opacity-30" />
        <div className="relative">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 bg-red-600/15 border border-red-900/40 rounded-xl flex items-center justify-center red-glow">
            <Brain className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">Semantic Call Search</h2>
            <p className="text-sm text-gray-400 mt-1">
              Search by meaning, issue, sentiment, coaching need, or exact words.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: angry customer about refund, no empathy, unresolved billing issue..."
              className="focus-ring w-full pl-12 pr-4 py-3 bg-black/45 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-900/60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="focus-ring px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-4">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              className="focus-ring px-3 py-1.5 bg-black/35 hover:bg-red-950/25 border border-white/10 hover:border-red-900/40 rounded-full text-xs text-gray-400 hover:text-white transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Search failed</p>
            <p className="text-sm text-red-200/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      <section className="space-y-4">
        {searched && !loading && results.length === 0 && !error && (
          <div className="panel rounded-2xl py-16 text-center">
            <Search className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No matching calls found</p>
            <p className="text-sm text-gray-700 mt-1">Try a broader phrase or search for category, sentiment, or issue words.</p>
          </div>
        )}

        {results.map((result) => {
          const resultScores = getResultScores(result);

          return (
            <button
              key={result.callId}
              onClick={() => onCallSelect(result.callId)}
              className="w-full text-left panel hover:border-red-800/60 rounded-2xl p-5 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-mono text-sm text-red-400 font-semibold">{result.callId}</span>
                    <span className="text-xs text-gray-600">Agent {result.agentId}</span>
                    {result.createdAt && (
                      <span className="text-xs text-gray-600">{formatDate(result.createdAt)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.category && (
                      <span className="px-2 py-1 bg-red-950/25 border border-red-900/35 rounded-lg text-xs text-red-200">
                        {result.category}
                      </span>
                    )}
                    {result.sentiment && (
                      <span className={cx(
                        "px-2 py-1 border rounded text-xs",
                        result.sentiment.toLowerCase().includes('negative')
                          ? 'bg-red-950/30 border-red-900/30 text-red-300'
                          : 'bg-green-950/20 border-green-900/30 text-green-300'
                      )}>
                        {result.sentiment}
                      </span>
                    )}
                    {result.matchedTerms?.map((term) => (
                      <span key={term} className="px-2 py-1 bg-black/35 border border-white/10 rounded-lg text-xs text-gray-400">
                        {term}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed">
                    {result.snippet || result.summary || 'No summary available for this call.'}
                  </p>

                  {(result.criticalIssues?.length > 0 || result.weaknesses?.length > 0) && (
                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                      {result.criticalIssues?.length > 0 && (
                        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3">
                          <p className="text-xs uppercase font-semibold text-red-300 mb-2">Critical Issues</p>
                          <p className="text-xs text-gray-300">{result.criticalIssues.slice(0, 2).join(' | ')}</p>
                        </div>
                      )}
                      {result.weaknesses?.length > 0 && (
                        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-3">
                          <p className="text-xs uppercase font-semibold text-yellow-300 mb-2">Weaknesses</p>
                          <p className="text-xs text-gray-300">{result.weaknesses.slice(0, 2).join(' | ')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3">
                  <div className="text-right">
                    <p className={cx("text-2xl font-bold", scoreColor(result.score || 0))}>
                      {result.score?.toFixed ? result.score.toFixed(1) : result.score || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">QA score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{relevanceLabel(resultScores.relevance)}</p>
                    <div className="mt-2 w-36 space-y-1.5">
                      <MiniBar label="semantic" value={resultScores.similarity} />
                      <MiniBar label="keyword" value={resultScores.keywordScore} />
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-red-400 transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}

function MiniBar({ label, value }) {
  const percent = Math.round(safeNumber(value) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
