import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CloudUpload,
  FileAudio,
  Headphones,
  Loader2,
  Mic,
  Radio,
  RefreshCw,
  ShieldCheck,
  Upload,
  Users,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { api } from '../utils/api';
import { EmptyVisual, PageFrame, ScoreRing, Sparkline, StatTile, VisualPanel, Waveform } from '../components/DashboardVisuals';
import { safeNumber } from '../utils/visual';
import { useCalls } from '../hooks/useCalls';
import { getCallMetrics } from '../utils/metrics';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatDuration(seconds) {
  const value = safeNumber(seconds);
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power ? 1 : 0)} ${units[power]}`;
}

function getScore(call) {
  return safeNumber(call?.scores?.overallScore ?? call?.scores?.overall_score);
}

export default function MainPage({ onCallSelect }) {
  const { calls, refetch } = useCalls();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeCallId, setActiveCallId] = useState('');
  const [activeCall, setActiveCall] = useState(null);

  const recentCalls = calls.slice(0, 5);
  const scoredCalls = calls.filter((call) => call.status === 'scored');
  const avgScore = scoredCalls.length
    ? scoredCalls.reduce((sum, call) => sum + getScore(call), 0) / scoredCalls.length
    : 0;
  const sparkValues = recentCalls.map((call) => getScore(call) || 30).reverse();

  useEffect(() => {
    if (!activeCallId || activeCall?.status === 'scored' || activeCall?.status === 'failed') return undefined;

    const timer = setInterval(async () => {
      try {
        const res = await api.getCall(activeCallId);
        setActiveCall(res.data);
        if (res.data?.status === 'scored' || res.data?.status === 'failed') {
          refetch();
        }
      } catch {
        // The record may not be queryable for a beat after queueing.
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [activeCallId, activeCall?.status, refetch]);

  const validateFile = (selectedFile) => {
    const allowedExtensions = /\.(mp3|wav|m4a|ogg)$/i;
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('Max 100MB');
      return false;
    }
    if (!allowedExtensions.test(selectedFile.name) && !selectedFile.type.startsWith('audio/')) {
      setError('Use MP3, WAV, M4A, or OGG');
      return false;
    }
    return true;
  };

  const setSelectedFile = (selectedFile) => {
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError('');
      setActiveCall(null);
      setActiveCallId('');
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const callId = `call_${Date.now()}`;
    setLoading(true);
    setError('');
    setUploadProgress(0);
    setActiveCallId(callId);
    setActiveCall({ callId, status: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('agentId', 'agent-001');
      formData.append('callId', callId);

      await axios.post('http://localhost:5000/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          setUploadProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      setActiveCall({ callId, status: 'queued' });
      setFile(null);
      refetch();
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed');
      setActiveCall({ callId, status: 'failed' });
    } finally {
      setLoading(false);
    }
  };

  const activeMetrics = useMemo(() => activeCall ? getCallMetrics(activeCall) : null, [activeCall]);
  const activeScore = getScore(activeCall);
  const status = activeCall?.status || 'idle';
  const isDone = status === 'scored';
  const isFailed = status === 'failed';

  return (
    <PageFrame className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <VisualPanel className="p-6 sm:p-8" glow>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1 text-xs font-black text-teal-100">
                <Radio className="h-3.5 w-3.5" />
                Live pipeline
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">QA Studio</h1>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStage active={['uploading', 'queued', 'processing', 'transcribed', 'scored'].includes(status)} label="Ingest" icon={<Upload className="mx-auto mb-2 h-4 w-4" />} />
                <MiniStage active={['processing', 'transcribed', 'scored'].includes(status)} label="STT" icon={<Mic className="mx-auto mb-2 h-4 w-4" />} />
                <MiniStage active={status === 'scored'} label="Score" icon={<ShieldCheck className="mx-auto mb-2 h-4 w-4" />} />
              </div>
            </div>

            <div className="scan-line rounded-2xl border border-white/10 bg-black/24 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Signal preview</p>
                  <p className="mt-1 text-sm font-semibold text-white">{file?.name || activeCallId || 'Drop a call to begin'}</p>
                </div>
                <span className={cx(
                  'rounded-full px-3 py-1 text-xs font-black uppercase',
                  isDone ? 'bg-emerald-400/12 text-emerald-200' : isFailed ? 'bg-rose-400/12 text-rose-200' : 'bg-white/8 text-slate-300'
                )}>
                  {status}
                </span>
              </div>
              <Waveform active={isDone ? activeScore : loading ? uploadProgress : 62} tone={isDone ? 'teal' : 'red'} />
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-teal-300 transition-all duration-500"
                  style={{ width: `${isDone ? 100 : loading ? uploadProgress : status === 'queued' ? 42 : 12}%` }}
                />
              </div>
            </div>
          </div>
        </VisualPanel>

        <div className="grid grid-cols-2 gap-4">
          <StatTile icon={Headphones} label="Calls" value={calls.length} helper="Total records" />
          <StatTile icon={Zap} label="Avg QA" value={avgScore ? avgScore.toFixed(0) : 'N/A'} helper="Scored calls" tone="teal">
            <Sparkline values={sparkValues} color="#2dd4bf" className="mt-2" />
          </StatTile>
          <StatTile icon={Clock} label="Queued" value={calls.filter((call) => call.status === 'queued' || call.status === 'processing').length} helper="In progress" tone="amber" />
          <StatTile icon={Users} label="Agents" value={new Set(calls.map((call) => call.agentId)).size || 0} helper="Observed IDs" tone="blue" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <VisualPanel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="stat-label">Upload</p>
              <h2 className="text-xl font-black text-white">New call</h2>
            </div>
            <CloudUpload className="h-6 w-6 text-rose-300" />
          </div>

          <div
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              setSelectedFile(event.dataTransfer.files?.[0]);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            className={cx(
              'relative mb-4 rounded-2xl border border-dashed p-7 text-center transition-all',
              dragActive ? 'border-teal-300 bg-teal-300/10' : 'border-white/14 bg-white/[0.035] hover:border-rose-300/50'
            )}
          >
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => setSelectedFile(event.target.files?.[0])}
              disabled={loading}
            />
            <FileAudio className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm font-bold text-white">{file ? file.name : 'Drop audio'}</p>
            <p className="mt-1 text-xs text-slate-500">{file ? formatFileSize(file.size) : 'MP3 · WAV · M4A · OGG'}</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition-all hover:bg-teal-100 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? 'Queueing' : 'Analyze'}
          </button>
        </VisualPanel>

        <VisualPanel className="p-5">
          {activeCall ? (
            <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/24 p-5">
                {isDone ? <ScoreRing score={activeScore} size={154} /> : isFailed ? <AlertCircle className="h-16 w-16 text-rose-300" /> : <Loader2 className="h-16 w-16 animate-spin text-teal-300" />}
                <p className="mt-3 text-center text-sm font-black text-white">{isDone ? 'Scored' : isFailed ? 'Failed' : 'Processing'}</p>
              </div>
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-rose-300">{activeCallId}</p>
                    <p className="text-xs text-slate-500">Worker status: {status}</p>
                  </div>
                  {isDone && (
                    <button onClick={() => onCallSelect(activeCallId)} className="focus-ring rounded-xl bg-teal-300 px-4 py-2 text-xs font-black text-slate-950">
                      Open detail
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric label="Duration" value={formatDuration(activeMetrics?.durationRaw)} />
                  <MiniMetric label="Agent" value={`${activeMetrics?.agentPct || 0}%`} />
                  <MiniMetric label="Customer" value={`${activeMetrics?.customerPct || 0}%`} />
                  <MiniMetric label="Confidence" value={`${activeMetrics?.confidence || 0}%`} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyVisual icon={Mic} title="No active analysis" hint="Upload a recording and watch the processing state here." />
          )}
        </VisualPanel>
      </section>

      <VisualPanel className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="stat-label">Recent calls</p>
            <h2 className="text-xl font-black text-white">Latest activity</h2>
          </div>
          <button onClick={refetch} className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {recentCalls.length ? recentCalls.map((call) => (
            <button
              key={call._id || call.callId}
              onClick={() => onCallSelect(call.callId)}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition-all hover:-translate-y-1 hover:border-teal-300/40"
            >
              <p className="truncate font-mono text-xs font-bold text-rose-300">{call.callId}</p>
              <p className="mt-2 text-2xl font-black text-white">{getScore(call) || 'N/A'}</p>
              <p className="mt-1 text-xs text-slate-500">{call.status}</p>
            </button>
          )) : <div className="md:col-span-5"><EmptyVisual icon={Headphones} title="No calls yet" hint="Your uploaded calls will appear here." /></div>}
        </div>
      </VisualPanel>
    </PageFrame>
  );
}

function MiniStage({ active, label, icon }) {
  return (
    <div className={cx('rounded-2xl border p-3 text-center transition-all', active ? 'border-teal-300/30 bg-teal-300/10 text-teal-100' : 'border-white/10 bg-white/[0.035] text-slate-500')}>
      {icon}
      <p className="text-xs font-black">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
