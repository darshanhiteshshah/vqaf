import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  User,
  Volume2
} from 'lucide-react';
import { api } from '../utils/api';
import { getCallMetrics } from '../utils/metrics';
import { formatDate } from '../utils/formatters';
import { Bars, EmptyVisual, PageFrame, ScoreRing, StatTile, VisualPanel, Waveform } from '../components/DashboardVisuals';
import { safeNumber, scoreTone } from '../utils/visual';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getOverallScore(scores) {
  return safeNumber(scores?.overallScore ?? scores?.overall_score);
}

export default function CallDetailPage({ callId }) {
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speakerFilter, setSpeakerFilter] = useState('all');

  useEffect(() => {
    const fetchCall = async () => {
      try {
        setLoading(true);
        const res = await api.getCall(callId);
        setCall(res.data);
      } catch (error) {
        console.error('Error fetching call:', error);
        setCall(null);
      } finally {
        setLoading(false);
      }
    };

    if (callId) fetchCall();
  }, [callId]);

  if (loading) {
    return (
      <PageFrame>
        <VisualPanel className="p-10">
          <EmptyVisual icon={RefreshCw} title="Loading call" hint="Preparing the detail view." />
        </VisualPanel>
      </PageFrame>
    );
  }

  if (!call) {
    return (
      <PageFrame>
        <VisualPanel className="p-10">
          <EmptyVisual icon={AlertTriangle} title="Call not found" hint="The selected call is unavailable." />
        </VisualPanel>
      </PageFrame>
    );
  }

  const metrics = getCallMetrics(call);
  const transcript = call.transcript?.transcript || [];
  const scores = call.scores || {};
  const flags = scores.flags || [];
  const overallScore = getOverallScore(scores);
  const tone = scoreTone(overallScore);
  const filteredTranscript = speakerFilter === 'all'
    ? transcript
    : transcript.filter((segment) => segment.speaker === speakerFilter.toUpperCase());
  const agentSegments = transcript.filter((segment) => segment.speaker === 'AGENT').length;
  const customerSegments = transcript.filter((segment) => segment.speaker === 'CUSTOMER').length;

  const breakdown = [
    { key: 'greeting', label: 'Greeting', color: '#2dd4bf' },
    { key: 'clarity', label: 'Clarity', color: '#60a5fa' },
    { key: 'resolution', label: 'Resolution', color: '#f59e0b' },
    { key: 'professionalism', label: 'Professional', color: '#fb7185' }
  ].filter((item) => scores[item.key] !== undefined);

  const insightCards = [
    { title: 'Summary', items: scores.summary ? [scores.summary] : [], icon: <FileText className="h-5 w-5 text-blue-300" /> },
    { title: 'Strengths', items: scores.strengths || [], icon: <CheckCircle2 className="h-5 w-5 text-teal-300" /> },
    { title: 'Coaching', items: scores.coaching || scores.actionItems || [], icon: <Lightbulb className="h-5 w-5 text-amber-300" /> },
    { title: 'Issues', items: scores.criticalIssues || scores.weaknesses || [], icon: <AlertTriangle className="h-5 w-5 text-rose-300" /> }
  ].filter((card) => card.items.length);

  const exportTranscript = () => {
    const text = transcript
      .map((segment) => `[${safeNumber(segment.start).toFixed(2)}s - ${safeNumber(segment.end).toFixed(2)}s] ${segment.speaker}: ${segment.text}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `transcript-${callId}.txt`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <PageFrame className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
        <VisualPanel className="p-6" glow>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="stat-label">Call detail</p>
              <h1 className="mt-2 truncate font-mono text-2xl font-black text-white">{call.callId}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">{call.agentId} · {formatDate(call.createdAt)}</p>
            </div>
            <span className={cx('rounded-full px-3 py-1 text-xs font-black uppercase', call.status === 'scored' ? 'bg-emerald-400/12 text-emerald-200' : call.status === 'failed' ? 'bg-rose-400/12 text-rose-200' : 'bg-amber-400/12 text-amber-200')}>
              {call.status}
            </span>
          </div>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <ScoreRing score={overallScore} size={176} />
            <div className="min-w-0 flex-1">
              <p className={cx('text-xl font-black', tone.text)}>{tone.label}</p>
              <p className="mt-2 text-sm text-slate-500">{scores.category || call.transcript?.method || 'Energy-based'} · {scores.sentiment || 'sentiment pending'}</p>
              <Waveform active={overallScore || 58} tone={overallScore >= 70 ? 'teal' : 'red'} />
            </div>
          </div>
        </VisualPanel>

        <div className="grid grid-cols-2 gap-4">
          <StatTile icon={Clock} label="Duration" value={`${metrics.duration}s`} helper="Total time" />
          <StatTile icon={User} label="Agent Talk" value={`${metrics.agentPct}%`} helper={`${agentSegments} turns`} tone="teal" />
          <StatTile icon={MessageSquare} label="Customer" value={`${metrics.customerPct}%`} helper={`${customerSegments} turns`} tone="blue" />
          <StatTile icon={Volume2} label="Confidence" value={`${metrics.confidence}%`} helper="Transcript" tone="amber" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <VisualPanel className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="stat-label">Talk balance</p>
              <h2 className="text-2xl font-black text-white">Speaker mix</h2>
            </div>
            <Award className="h-6 w-6 text-rose-300" />
          </div>
          <div className="mb-6 h-6 overflow-hidden rounded-full bg-slate-900">
            <div className="inline-flex h-full items-center justify-center bg-gradient-to-r from-rose-500 to-red-400 text-xs font-black text-white" style={{ width: `${Math.min(safeNumber(metrics.agentPct), 100)}%` }}>
              {safeNumber(metrics.agentPct) > 16 ? `${metrics.agentPct}%` : ''}
            </div>
            <div className="inline-flex h-full items-center justify-center bg-gradient-to-r from-blue-500 to-teal-300 text-xs font-black text-white" style={{ width: `${Math.min(safeNumber(metrics.customerPct), 100)}%` }}>
              {safeNumber(metrics.customerPct) > 16 ? `${metrics.customerPct}%` : ''}
            </div>
          </div>
          {breakdown.length ? (
            <Bars items={breakdown.map((item) => ({ label: item.label, value: safeNumber(scores[item.key]), display: safeNumber(scores[item.key]).toFixed(0), color: item.color }))} maxValue={100} />
          ) : (
            <EmptyVisual icon={Award} title="No score breakdown" hint="Detailed scoring fields are not available for this call." />
          )}
        </VisualPanel>

        <VisualPanel className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="stat-label">Alerts</p>
              <h2 className="text-2xl font-black text-white">{flags.length || 0} flags</h2>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          {flags.length ? (
            <div className="grid gap-3">
              {flags.slice(0, 5).map((flag, index) => (
                <div key={`${flag.title || flag.type}-${index}`} className="rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black text-amber-100">{flag.title || flag.type || 'Quality flag'}</p>
                    {flag.severity && <span className="rounded-full bg-black/24 px-2 py-1 text-[10px] font-black uppercase text-amber-200">{flag.severity}</span>}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{flag.description || flag.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyVisual icon={CheckCircle2} title="No active flags" hint="This call has no quality alerts." />
          )}
        </VisualPanel>
      </section>

      {insightCards.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insightCards.map(({ title, items, icon }) => (
            <VisualPanel key={title} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-black text-white">{title}</p>
                {icon}
              </div>
              <div className="space-y-3">
                {items.slice(0, 3).map((item, index) => (
                  <p key={`${title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-slate-300">{item}</p>
                ))}
              </div>
            </VisualPanel>
          ))}
        </section>
      )}

      <VisualPanel className="p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="stat-label">Transcript</p>
            <h2 className="text-2xl font-black text-white">{filteredTranscript.length} segments</h2>
          </div>
          <div className="flex items-center gap-2">
            {['all', 'agent', 'customer'].map((speaker) => (
              <button
                key={speaker}
                onClick={() => setSpeakerFilter(speaker)}
                className={cx('focus-ring rounded-xl px-3 py-2 text-xs font-black capitalize transition-all', speakerFilter === speaker ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/[0.04] text-slate-400')}
              >
                {speaker}
              </button>
            ))}
            <button onClick={exportTranscript} disabled={!transcript.length} className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white disabled:opacity-40" aria-label="Export transcript">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filteredTranscript.length ? (
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
            {filteredTranscript.map((segment, index) => (
              <TranscriptSegment key={`${segment.start}-${index}`} segment={segment} />
            ))}
          </div>
        ) : (
          <EmptyVisual icon={MessageSquare} title="No transcript segments" hint="Try another speaker filter." />
        )}
      </VisualPanel>
    </PageFrame>
  );
}

function TranscriptSegment({ segment }) {
  const isAgent = segment.speaker === 'AGENT';

  return (
    <div className={cx('grid gap-3 rounded-2xl border p-4 md:grid-cols-[120px_1fr]', isAgent ? 'border-rose-300/18 bg-rose-500/7' : 'border-teal-300/18 bg-teal-500/7')}>
      <div>
        <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black', isAgent ? 'bg-rose-400/12 text-rose-200' : 'bg-teal-400/12 text-teal-100')}>
          {isAgent ? <User className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          {segment.speaker}
        </span>
        <p className="mt-2 font-mono text-xs font-bold text-slate-600">
          {safeNumber(segment.start).toFixed(1)}s - {safeNumber(segment.end).toFixed(1)}s
        </p>
      </div>
      <div>
        <p className="text-sm leading-7 text-slate-200">{segment.text}</p>
        {segment.confidence && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-teal-300" style={{ width: `${Math.min(safeNumber(segment.confidence) * 100, 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
