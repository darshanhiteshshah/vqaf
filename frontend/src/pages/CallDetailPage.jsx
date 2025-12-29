import { useEffect, useState } from 'react';
import { 
  Award, Clock, User, MessageSquare, Activity, BarChart3, 
  AlertTriangle, CheckCircle, TrendingUp, Download, Play,
  ChevronDown, ChevronUp, Filter, Volume2, FileText
} from 'lucide-react';
import { api } from '../utils/api';
import { getCallMetrics } from '../utils/metrics';
import { formatDate } from '../utils/formatters';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CallDetailPage({ callId }) {
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speakerFilter, setSpeakerFilter] = useState('all'); // all, agent, customer
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(true);
  const [showFlags, setShowFlags] = useState(true);

  useEffect(() => {
    const fetchCall = async () => {
      try {
        const res = await api.getCall(callId);
        setCall(res.data);
      } catch (error) {
        console.error('Error fetching call:', error);
      } finally {
        setLoading(false);
      }
    };

    if (callId) fetchCall();
  }, [callId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
        <div className="text-gray-500">Loading call details...</div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-400" />
        <div className="text-red-400 text-lg font-semibold">Call not found</div>
        <p className="text-gray-500 text-sm mt-2">The requested call ID does not exist</p>
      </div>
    );
  }

  const metrics = getCallMetrics(call);
  const transcript = call.transcript?.transcript || [];
  const scores = call.scores || {};
  const flags = scores.flags || [];

  // Filter transcript by speaker
  const filteredTranscript = speakerFilter === 'all' 
    ? transcript 
    : transcript.filter(seg => seg.speaker === speakerFilter.toUpperCase());

  // Calculate score category
  const getScoreCategory = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'green', bg: 'bg-green-950/20', border: 'border-green-900/30', text: 'text-green-400' };
    if (score >= 60) return { label: 'Good', color: 'yellow', bg: 'bg-yellow-950/20', border: 'border-yellow-900/30', text: 'text-yellow-400' };
    if (score >= 40) return { label: 'Fair', color: 'orange', bg: 'bg-orange-950/20', border: 'border-orange-900/30', text: 'text-orange-400' };
    return { label: 'Poor', color: 'red', bg: 'bg-red-950/20', border: 'border-red-900/30', text: 'text-red-400' };
  };

  const overallScore = scores.overallScore || scores.overall_score || 0;
  const scoreCategory = getScoreCategory(overallScore);

  // Export transcript
  const exportTranscript = () => {
    const text = transcript
      .map(seg => `[${seg.start?.toFixed(2)}s - ${seg.end?.toFixed(2)}s] ${seg.speaker}: ${seg.text}`)
      .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${callId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const totalSegments = transcript.length;
  const agentSegments = transcript.filter(s => s.speaker === 'AGENT').length;
  const customerSegments = transcript.filter(s => s.speaker === 'CUSTOMER').length;
  const avgSegmentDuration = metrics.durationRaw / totalSegments || 0;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header Section */}
      <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-red-600/10 border border-red-900/30 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Call Analysis Report</h2>
                <p className="text-sm text-gray-500">Detailed quality assessment</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-semibold">Call ID:</span>
                <span className="text-sm text-red-400 font-mono font-semibold">{call.callId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-semibold">Agent:</span>
                <span className="text-sm text-white">{call.agentId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-semibold">Date:</span>
                <span className="text-sm text-white">{formatDate(call.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-semibold">Method:</span>
                <span className={cx(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  call.transcript?.method === "ML" 
                    ? "bg-purple-950/30 text-purple-300" 
                    : "bg-blue-950/30 text-blue-300"
                )}>
                  {call.transcript?.method || "Energy-based"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Score Display */}
          <div className={cx(
            "border rounded-xl p-6 text-center min-w-[200px]",
            scoreCategory.bg, scoreCategory.border
          )}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Award className={cx("h-6 w-6", scoreCategory.text)} />
              <span className="text-xs uppercase font-semibold text-gray-400">Quality Score</span>
            </div>
            <div className={cx("text-5xl font-bold mb-2", scoreCategory.text)}>
              {overallScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mb-3">out of 100</div>
            <div className={cx(
              "px-3 py-1.5 rounded-lg text-sm font-bold uppercase border",
              scoreCategory.bg, scoreCategory.border, scoreCategory.text
            )}>
              {scoreCategory.label}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase font-semibold">Duration</span>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.duration}s</div>
            <div className="text-xs text-gray-600 mt-1">Total call time</div>
          </div>
          
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-red-400" />
              <span className="text-xs text-gray-500 uppercase font-semibold">Agent</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{metrics.agentPct}%</div>
            <div className="text-xs text-red-300 mt-1">{metrics.agentSeconds}s spoken</div>
          </div>
          
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-500 uppercase font-semibold">Customer</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{metrics.customerPct}%</div>
            <div className="text-xs text-blue-300 mt-1">{metrics.customerSeconds}s spoken</div>
          </div>
          
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-500 uppercase font-semibold">Confidence</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{metrics.confidence}%</div>
            <div className="text-xs text-green-300 mt-1">Transcription accuracy</div>
          </div>
        </div>
      </div>

      {/* Quality Flags */}
      {flags.length > 0 && (
        <div className="bg-gray-950 border border-red-900/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowFlags(!showFlags)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Quality Alerts</h3>
              <span className="px-2 py-1 bg-yellow-950/30 border border-yellow-900/30 rounded text-xs font-bold text-yellow-400">
                {flags.length}
              </span>
            </div>
            {showFlags ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          
          {showFlags && (
            <div className="px-6 pb-6 space-y-3">
              {flags.map((flag, idx) => (
                <div key={idx} className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-300 mb-1">{flag.title || flag.type}</p>
                    <p className="text-sm text-gray-400">{flag.description || flag.message}</p>
                    {flag.severity && (
                      <span className={cx(
                        "inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold uppercase",
                        flag.severity === 'high' ? "bg-red-950/30 text-red-400" :
                        flag.severity === 'medium' ? "bg-yellow-950/30 text-yellow-400" :
                        "bg-gray-900 text-gray-400"
                      )}>
                        {flag.severity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score Breakdown */}
      {(scores.greetingScore !== undefined || scores.clarityScore !== undefined) && (
        <div className="bg-gray-950 border border-red-900/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">Score Breakdown</h3>
            </div>
            {showScoreBreakdown ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
          </button>
          
          {showScoreBreakdown && (
            <div className="px-6 pb-6 space-y-4">
              {[
                { key: 'greetingScore', label: 'Greeting & Opening', icon: MessageSquare },
                { key: 'clarityScore', label: 'Clarity & Communication', icon: Volume2 },
                { key: 'resolutionScore', label: 'Problem Resolution', icon: CheckCircle },
                { key: 'professionalismScore', label: 'Professionalism', icon: Award },
              ].map(({ key, label, icon: Icon }) => {
                const score = scores[key];
                if (score === undefined) return null;
                
                const percentage = (score / 100) * 100;
                const category = getScoreCategory(score);
                
                return (
                  <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-white">{label}</span>
                      </div>
                      <span className={cx("text-lg font-bold", category.text)}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className={cx(
                          "h-2 rounded-full transition-all",
                          category.color === 'green' ? 'bg-green-500' :
                          category.color === 'yellow' ? 'bg-yellow-500' :
                          category.color === 'orange' ? 'bg-orange-500' :
                          'bg-red-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Speaker Distribution */}
      <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-400" />
            Speaker Analytics
          </h3>
          <div className="text-xs text-gray-500">
            {totalSegments} segments • {avgSegmentDuration.toFixed(1)}s avg
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 text-center">
            <User className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <div className="text-4xl font-bold text-red-400 mb-2">{metrics.agentPct}%</div>
            <div className="text-sm text-gray-400 mb-1 uppercase font-semibold">Agent Speaking</div>
            <div className="text-sm text-red-300">{metrics.agentSeconds}s • {agentSegments} segments</div>
          </div>
          
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-6 text-center">
            <MessageSquare className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-4xl font-bold text-blue-400 mb-2">{metrics.customerPct}%</div>
            <div className="text-sm text-gray-400 mb-1 uppercase font-semibold">Customer Speaking</div>
            <div className="text-sm text-blue-300">{metrics.customerSeconds}s • {customerSegments} segments</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <div className="text-4xl font-bold text-white mb-2">{(agentSegments / customerSegments || 0).toFixed(1)}</div>
            <div className="text-sm text-gray-400 mb-1 uppercase font-semibold">Turn Ratio</div>
            <div className="text-sm text-gray-500">Agent : Customer</div>
          </div>
        </div>

        {/* Visual Distribution Bar */}
        <div className="relative">
          <div className="h-6 bg-black rounded-full overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center" 
              style={{ width: `${metrics.agentPct}%` }}
            >
              {metrics.agentPct > 15 && (
                <span className="text-xs font-bold text-white">{metrics.agentPct}%</span>
              )}
            </div>
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center" 
              style={{ width: `${metrics.customerPct}%` }}
            >
              {metrics.customerPct > 15 && (
                <span className="text-xs font-bold text-white">{metrics.customerPct}%</span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Agent</span>
            <span>Customer</span>
          </div>
        </div>
      </div>

      {/* Full Transcript */}
      <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Full Transcript</h3>
            <span className="text-sm text-gray-500 font-normal">
              ({filteredTranscript.length} {filteredTranscript.length === 1 ? 'segment' : 'segments'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Speaker Filter */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setSpeakerFilter('all')}
                className={cx(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  speakerFilter === 'all' 
                    ? "bg-red-600 text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                All
              </button>
              <button
                onClick={() => setSpeakerFilter('agent')}
                className={cx(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  speakerFilter === 'agent' 
                    ? "bg-red-600 text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                Agent
              </button>
              <button
                onClick={() => setSpeakerFilter('customer')}
                className={cx(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  speakerFilter === 'customer' 
                    ? "bg-red-600 text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                Customer
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={exportTranscript}
              disabled={transcript.length === 0}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {filteredTranscript.length > 0 ? (
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredTranscript.map((seg, idx) => (
              <div
                key={idx}
                className={cx(
                  "p-4 rounded-lg border-l-4 transition-all hover:shadow-lg",
                  seg.speaker === "AGENT"
                    ? "bg-red-950/20 border-red-600 hover:bg-red-950/30"
                    : "bg-blue-950/20 border-blue-600 hover:bg-blue-950/30"
                )}
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className={cx(
                      "px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5",
                      seg.speaker === "AGENT" 
                        ? "bg-red-600/20 text-red-300" 
                        : "bg-blue-600/20 text-blue-300"
                    )}>
                      {seg.speaker === "AGENT" ? <User className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {seg.speaker}
                    </span>
                    <span className="text-xs text-gray-600 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {seg.start?.toFixed(2)}s - {seg.end?.toFixed(2)}s
                    </span>
                  </div>
                  {seg.confidence && (
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-gray-500" />
                      <span className={cx(
                        "text-xs font-bold",
                        seg.confidence >= 0.9 ? "text-green-400" :
                        seg.confidence >= 0.7 ? "text-yellow-400" :
                        "text-red-400"
                      )}>
                        {(seg.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-white leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-600">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-800" />
            <p className="font-medium">
              {speakerFilter === 'all' 
                ? 'No transcript available' 
                : `No ${speakerFilter} segments found`}
            </p>
            {speakerFilter !== 'all' && (
              <button
                onClick={() => setSpeakerFilter('all')}
                className="mt-3 text-xs text-red-400 hover:text-red-300"
              >
                Show all speakers
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </main>
  );
}
