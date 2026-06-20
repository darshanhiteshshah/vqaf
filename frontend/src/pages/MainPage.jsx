import { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle,
  Clock,
  CloudUpload,
  FileAudio,
  Mic,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  Waves,
  Zap
} from 'lucide-react';
import axios from 'axios';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getScoreValue(result) {
  return Number(result?.scores?.overallScore || result?.scores?.overall_score || 0);
}

function getScoreTone(score) {
  if (score >= 80) return { label: 'Excellent', text: 'text-green-400', stroke: '#22c55e' };
  if (score >= 60) return { label: 'Good', text: 'text-yellow-400', stroke: '#eab308' };
  return { label: 'Needs Review', text: 'text-red-400', stroke: '#ef4444' };
}

export default function MainPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');

  const validateFile = (selectedFile) => {
    const maxSize = 100 * 1024 * 1024;
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'audio/x-m4a'];
    const allowedExtensions = /\.(mp3|wav|m4a|ogg)$/i;

    if (selectedFile.size > maxSize) {
      setError('File size must be less than 100MB');
      return false;
    }

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.test(selectedFile.name)) {
      setError('Please upload a valid audio file (MP3, WAV, M4A, OGG)');
      return false;
    }

    return true;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);
    setProcessingStage('Uploading...');

    try {
      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('agentId', 'agent-001');
      formData.append('callId', `call_${Date.now()}`);

      const res = await axios.post('http://localhost:5000/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);

          if (progress === 100) {
            setProcessingStage('Transcribing audio...');
          }
        }
      });

      setProcessingStage('Analysis complete');
      setResult(res.data);
      setFile(null);
      setUploadProgress(100);
    } catch (err) {
      setError(err?.response?.data?.error || 'Upload failed. Please try again.');
      setProcessingStage('');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const score = getScoreValue(result);
  const tone = getScoreTone(score);
  const circumference = 2 * Math.PI * 54;
  const scoreOffset = circumference - (score / 100) * circumference;
  const agentTalkPct = Number(result?.metrics?.agentTalkPct || 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="panel rounded-2xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 subtle-grid opacity-35" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-900/40 text-xs font-semibold text-red-200 mb-4">
              <Waves className="h-3.5 w-3.5" />
              Voice intelligence pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Analyze call quality with clean, visual QA insights.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-xl">
              Upload a recording, transcribe speakers, score performance, detect issues, and search past calls by meaning.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-full sm:min-w-[420px] lg:min-w-[440px]">
            {[
              { label: 'STT', value: 'Whisper', icon: Mic },
              { label: 'QA', value: 'Gemini', icon: Award },
              { label: 'Search', value: 'Hybrid', icon: ShieldCheck }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="metric-card rounded-xl p-4">
                <Icon className="h-5 w-5 text-red-400 mb-3" />
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 panel rounded-2xl p-6 h-fit sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-red-600/15 border border-red-900/40 rounded-xl flex items-center justify-center">
              <Upload className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Audio</h2>
              <p className="text-xs text-gray-500">Analyze a call recording</p>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            className={cx(
              'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer mb-4',
              dragActive ? 'border-red-500 bg-red-950/20 red-glow' : 'border-white/10 bg-black/25 hover:border-red-900/60 hover:bg-red-950/10',
              loading && 'pointer-events-none opacity-50'
            )}
          >
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="flex flex-col items-center text-center">
              <div className={cx(
                'h-16 w-16 rounded-xl flex items-center justify-center mb-3 transition-all border',
                dragActive ? 'bg-red-900/20 border-red-700' : 'bg-black/40 border-white/10'
              )}>
                {dragActive ? (
                  <CloudUpload className="h-8 w-8 text-red-400" />
                ) : (
                  <FileAudio className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                {dragActive ? 'Drop file here' : 'Drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500 mb-2">MP3, WAV, M4A, OGG</p>
              {file && (
                <div className="mt-3 w-full bg-black/45 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FileAudio className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-xs text-white font-medium truncate">{file.name}</p>
                  </div>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-950/30 border border-red-900/50 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mb-4 bg-black/35 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">{processingStage}</p>
                <p className="text-xs text-red-400 font-medium">{uploadProgress}%</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-700 to-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={cx(
              'focus-ring w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
              !file || loading
                ? 'bg-gray-900 text-gray-600'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-700 text-white shadow-lg shadow-red-950/30'
            )}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Analyze Call
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-center text-gray-600">Secure local workflow | Max 100MB</p>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              <div className="panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-950/20 border border-green-900/30 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Complete</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-[220px_1fr] gap-5 mb-6">
                  <div className="panel-soft rounded-2xl p-5 flex flex-col items-center justify-center">
                    <div className="relative h-36 w-36">
                      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                        <circle cx="70" cy="70" r="54" fill="none" stroke="#1f2937" strokeWidth="12" />
                        <circle
                          cx="70"
                          cy="70"
                          r="54"
                          fill="none"
                          stroke={tone.stroke}
                          strokeLinecap="round"
                          strokeWidth="12"
                          strokeDasharray={circumference}
                          strokeDashoffset={scoreOffset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cx('text-3xl font-black', tone.text)}>{score || 'N/A'}</span>
                        <span className="text-xs text-gray-500">out of 100</span>
                      </div>
                    </div>
                    <div className={cx('mt-3 text-sm font-bold', tone.text)}>{tone.label}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Metric icon={Award} label="Overall Score" value={score ? `${score}/100` : 'N/A'} color="text-red-400" />
                    <Metric icon={Clock} label="Duration" value={formatDuration(result.metrics?.totalDuration || result.metrics?.duration)} color="text-sky-400" />
                    <Metric icon={Users} label="Agent Talk" value={`${agentTalkPct || 0}%`} color="text-red-300" />
                    <Metric
                      icon={TrendingUp}
                      label="Confidence"
                      value={result.metrics?.confidence ? `${(result.metrics.confidence * 100).toFixed(0)}%` : 'N/A'}
                      color="text-green-400"
                    />
                  </div>
                </div>

                <div className="panel-soft rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Agent talk</span>
                    <span>Customer talk</span>
                  </div>
                  <div className="h-4 rounded-full bg-black/50 overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-red-700 to-red-500"
                      style={{ width: `${Math.min(agentTalkPct, 100)}%` }}
                    />
                    <div className="bg-gradient-to-r from-sky-700 to-sky-500 flex-1" />
                  </div>
                </div>

                <div className="panel-soft rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Call Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <Info label="Call ID" value={result.callId} mono />
                    <Info label="Method" value={result.method || 'Energy-based'} />
                    <Info label="Agent Time" value={formatDuration(result.metrics?.agentSeconds)} />
                    <Info label="Customer Time" value={formatDuration(result.metrics?.customerSeconds)} />
                  </div>
                </div>
              </div>

              <details className="panel rounded-2xl overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors text-sm font-semibold text-gray-400">
                  View Raw JSON Data
                </summary>
                <div className="px-6 pb-6">
                  <pre className="text-xs text-gray-400 overflow-auto bg-black/40 p-4 rounded-xl border border-white/10">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            <div className="h-full min-h-[520px] panel rounded-2xl flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-24 w-24 bg-red-950/20 rounded-2xl flex items-center justify-center mb-5 border border-red-900/30 red-glow">
                <Mic className="h-11 w-11 text-red-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ready for analysis</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Upload a call recording to generate QA scores, speaker analytics, flags, and search-ready insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="metric-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cx('h-4 w-4', color)} />
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Info({ label, value, mono }) {
  return (
    <div>
      <p className="text-gray-500 mb-1">{label}</p>
      <p className={cx('text-gray-300', mono && 'font-mono')}>{value}</p>
    </div>
  );
}
