import { useState } from 'react';
import { Search, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function SearchPage({ onCallSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await api.searchCalls(query.trim());
      setResults(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-gray-950 border border-red-900/20 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Search Calls</h2>
            <p className="text-sm text-gray-500 mt-1">Find the highest-relevance calls with hybrid semantic + keyword ranking.</p>
          </div>

          <div className="w-full md:w-auto flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for issues, orders, addresses..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-red-700"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className={cx(
                'rounded-2xl px-5 py-3 text-sm font-semibold transition-all',
                !query.trim() || loading
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-900/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {results.length === 0 && !loading ? (
            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
              Enter a query to see top matching calls.
            </div>
          ) : null}

          {results.map((call, index) => (
            <div key={call.callId} className="rounded-3xl border border-gray-800 bg-black/50 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-red-500">Result #{index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{call.callId}</h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="rounded-full bg-gray-900 px-3 py-1">Similarity: {(call.similarity * 100).toFixed(0)}%</span>
                  <span className="rounded-full bg-gray-900 px-3 py-1">Score: {call.score?.toFixed(1) ?? 'N/A'}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Category</p>
                  <p className="mt-2 text-sm text-white">{call.category || 'Unknown'}</p>
                </div>
                <div className="rounded-2xl bg-gray-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Sentiment</p>
                  <p className="mt-2 text-sm text-white">{call.sentiment || 'Neutral'}</p>
                </div>
                <div className="rounded-2xl bg-gray-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Summary</p>
                  <p className="mt-2 text-sm text-white line-clamp-3">{call.summary || 'No summary available.'}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-400">
                  <p className="font-medium text-white">Agent:</p>
                  <p>{call.agentId}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => onCallSelect(call.callId)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Open Call
                  </button>
                  <button
                    onClick={() => window.open(`http://localhost:5000/api/calls/${call.callId}`, '_blank')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Raw JSON
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
