import { Award, Clock, User, MessageSquare, Mic } from 'lucide-react';
import { getCallMetrics } from '../utils/metrics';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ResultsCard({ result }) {
  if (!result || !result.metrics) {
    return (
      <div className="h-full bg-gray-950 border border-gray-900 rounded-xl flex flex-col items-center justify-center py-20">
        <div className="h-20 w-20 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
          <Mic className="h-10 w-10 text-gray-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-1">No Analysis Yet</h3>
        <p className="text-sm text-gray-700">Upload a call to see results</p>
      </div>
    );
  }

  const metrics = getCallMetrics(result);

  return (
    <div className="space-y-6">
      {/* Quality Score Banner */}
      <div className="bg-gradient-to-r from-red-950/30 via-gray-950 to-red-950/30 border border-red-900/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-red-400" />
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Quality Assessment</h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-white">
                {result.scores?.overallScore?.toFixed(1) || "N/A"}
              </span>
              <span className="text-lg text-gray-500">/ 100</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">{result.callId}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cx(
              "px-3 py-1.5 rounded-lg text-xs font-bold border",
              result.method === "ML" 
                ? "bg-purple-950/30 border-purple-800/50 text-purple-300" 
                : "bg-blue-950/30 border-blue-800/50 text-blue-300"
            )}>
              {result.method || "Energy"}
            </span>
            <span className="text-xs text-gray-500">{metrics.confidence}% Confidence</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-950 border border-gray-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 uppercase font-semibold">Duration</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.duration}s</p>
        </div>
        
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-500 uppercase font-semibold">Agent</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{metrics.agentPct}%</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.agentSeconds}s</p>
        </div>
        
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-500 uppercase font-semibold">Customer</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{metrics.customerPct}%</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.customerSeconds}s</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-950 border border-gray-900 rounded-xl p-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Agent ({metrics.agentPct}%)</span>
          <span>Customer ({metrics.customerPct}%)</span>
        </div>
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden flex">
          <div className="bg-red-600 transition-all" style={{ width: `${metrics.agentPct}%` }} />
          <div className="bg-blue-600 transition-all" style={{ width: `${metrics.customerPct}%` }} />
        </div>
      </div>

      {/* QA Scores Breakdown (Optional - if you want to show individual scores) */}
      {result.scores?.breakdown && (
        <div className="bg-gray-950 border border-gray-900 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Score Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(result.scores.breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-semibold text-white">{value}/20</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flags (if any) */}
      {result.scores?.flags && result.scores.flags.length > 0 && (
        <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Quality Flags
          </h4>
          <div className="space-y-2">
            {result.scores.flags.map((flag, idx) => (
              <div key={idx} className="text-xs text-yellow-300 flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
