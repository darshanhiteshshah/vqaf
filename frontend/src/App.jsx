import { useEffect, useState } from "react";
import axios from "axios";
import {
  Upload, Headphones, AlertCircle, RefreshCw, FileAudio, CloudUpload,
  Mic, Zap, ArrowLeft, User, Activity, BarChart3, Award, MessageSquare, Clock
} from "lucide-react";

const API_BASE = "http://localhost:3001";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [calls, setCalls] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [viewMode, setViewMode] = useState("main");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("audio/") || droppedFile.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
        setFile(droppedFile);
        setResult(null);
        setError(null);
      } else {
        setError("Please drop an audio file");
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const fetchCalls = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_BASE}/api/calls`);
      setCalls(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const uploadCall = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("audioFile", file);
      formData.append("agentId", "agent-001");
      formData.append("callId", `call_${Date.now()}`);

      const res = await axios.post(`${API_BASE}/api/uploads`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
      await fetchCalls();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const openCall = async (callId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/calls/${callId}`);
      setSelectedCall(res.data);
      setViewMode("detail");
    } catch (e) {
      console.error(e);
    }
  };

  const backToMain = () => {
    setViewMode("main");
    setSelectedCall(null);
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 15000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to calculate consistent metrics
  const getCallMetrics = (callData) => {
    const metrics = callData?.metrics || {};
    const duration = metrics.totalDuration || metrics.duration || 0;
    const agentSeconds = metrics.agentSeconds || 0;
    const customerSeconds = metrics.customerSeconds || 0;
    const confidence = metrics.confidence || 0;
    
    const agentPct = duration > 0 ? ((agentSeconds / duration) * 100).toFixed(1) : "0.0";
    const customerPct = duration > 0 ? ((customerSeconds / duration) * 100).toFixed(1) : "0.0";
    
    return {
      duration: duration.toFixed(1),
      agentSeconds: agentSeconds.toFixed(1),
      customerSeconds: customerSeconds.toFixed(1),
      agentPct,
      customerPct,
      confidence: (confidence * 100).toFixed(0)
    };
  };

  const latestMetrics = result ? getCallMetrics(result) : null;
  const latestScores = result?.scores;
  const detailMetrics = selectedCall ? getCallMetrics(selectedCall) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-red-900/20 bg-gray-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewMode === "detail" && (
              <button
                onClick={backToMain}
                className="p-2 hover:bg-red-900/20 rounded-lg transition-all mr-2 border border-red-900/30"
              >
                <ArrowLeft className="h-5 w-5 text-red-400" />
              </button>
            )}
            <div className="h-11 w-11 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Voice QA Framework</h1>
              <p className="text-xs text-gray-500">Speech-to-Text Analysis System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-medium">Live</span>
          </div>
        </div>
      </header>

      {/* Main View */}
      {viewMode === "main" && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          
          {/* Upload Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Upload Card - Left */}
            <div className="lg:col-span-1 bg-gray-950 border border-red-900/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 bg-red-600/10 border border-red-900/30 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upload Audio</h2>
                  <p className="text-xs text-gray-500">Analyze call recording</p>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cx(
                  "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer mb-4",
                  dragActive ? "border-red-500 bg-red-950/10" : "border-gray-800 hover:border-red-900/50"
                )}
              >
                <input
                  type="file"
                  accept="audio/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center text-center">
                  <div className={cx(
                    "h-16 w-16 rounded-lg flex items-center justify-center mb-3 transition-all border",
                    dragActive ? "bg-red-900/20 border-red-700" : "bg-gray-900 border-gray-800"
                  )}>
                    {dragActive ? <CloudUpload className="h-8 w-8 text-red-400" /> : <FileAudio className="h-8 w-8 text-gray-600" />}
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">
                    {dragActive ? "Drop file here" : "Drop or click to upload"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file ? file.name : "MP3, WAV, M4A"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={uploadCall}
                disabled={!file || loading}
                className={cx(
                  "w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
                  !file || loading
                    ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
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
                    Analyze
                  </>
                )}
              </button>

              <p className="mt-4 text-xs text-center text-gray-600">
                Local processing • No cloud storage
              </p>
            </div>

            {/* Results Card - Right (2 columns) */}
            <div className="lg:col-span-2">
              {latestMetrics ? (
                <div className="space-y-6">
                  
                  {/* Top: Quality Score Banner */}
                  <div className="bg-gradient-to-r from-red-950/30 via-gray-950 to-red-950/30 border border-red-900/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-red-400" />
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Quality Assessment</h3>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-bold text-white">{latestScores?.overallScore?.toFixed(1) || "85.0"}</span>
                          <span className="text-lg text-gray-500">/ 100</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{result?.callId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cx(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border",
                          result?.method === "ML" 
                            ? "bg-purple-950/30 border-purple-800/50 text-purple-300" 
                            : "bg-blue-950/30 border-blue-800/50 text-blue-300"
                        )}>
                          {result?.method || "Energy"}
                        </span>
                        <span className="text-xs text-gray-500">{latestMetrics.confidence}% Confidence</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Grid: Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-950 border border-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-500 uppercase font-semibold">Duration</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{latestMetrics.duration}s</p>
                    </div>
                    
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-gray-500 uppercase font-semibold">Agent</span>
                      </div>
                      <p className="text-2xl font-bold text-red-400">{latestMetrics.agentPct}%</p>
                      <p className="text-xs text-gray-500 mt-1">{latestMetrics.agentSeconds}s</p>
                    </div>
                    
                    <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-gray-500 uppercase font-semibold">Customer</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">{latestMetrics.customerPct}%</p>
                      <p className="text-xs text-gray-500 mt-1">{latestMetrics.customerSeconds}s</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-gray-950 border border-gray-900 rounded-xl p-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Agent ({latestMetrics.agentPct}%)</span>
                      <span>Customer ({latestMetrics.customerPct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden flex">
                      <div className="bg-red-600" style={{ width: `${latestMetrics.agentPct}%` }} />
                      <div className="bg-blue-600" style={{ width: `${latestMetrics.customerPct}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-gray-950 border border-gray-900 rounded-xl flex flex-col items-center justify-center py-20">
                  <div className="h-20 w-20 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
                    <Mic className="h-10 w-10 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">No Analysis Yet</h3>
                  <p className="text-sm text-gray-700">Upload a call to see results</p>
                </div>
              )}
            </div>
          </div>

          {/* Call History */}
          <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Call History</h2>
                <p className="text-xs text-gray-500 mt-1">{calls.length} recorded calls</p>
              </div>
              <button
                onClick={fetchCalls}
                disabled={refreshing}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-2 transition-all"
              >
                <RefreshCw className={cx("h-3.5 w-3.5", refreshing && "animate-spin")} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-900">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Call ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Agent</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Agent %</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Method</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-600">
                        <Headphones className="h-8 w-8 mx-auto mb-2 text-gray-800" />
                        No calls yet
                      </td>
                    </tr>
                  ) : (
                    calls.map((c) => {
                      const callMetrics = getCallMetrics(c);
                      return (
                        <tr 
                          key={c._id} 
                          className="bg-black/20 hover:bg-red-950/10 transition-all cursor-pointer"
                          onClick={() => openCall(c.callId)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-red-400 font-semibold hover:text-red-300">
                            {c.callId}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{c.agentId}</td>
                          <td className="px-4 py-3 text-xs text-white font-semibold">{callMetrics.duration}s</td>
                          <td className="px-4 py-3 text-xs text-red-400 font-semibold">{callMetrics.agentPct}%</td>
                          <td className="px-4 py-3 text-xs text-white font-semibold">{c.scores?.overallScore?.toFixed(1) || "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className={cx(
                              "px-2 py-1 rounded text-xs font-medium",
                              c.transcript?.method === "ML" 
                                ? "bg-purple-950/30 text-purple-300" 
                                : "bg-blue-950/30 text-blue-300"
                            )}>
                              {c.transcript?.method || "Energy"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cx(
                              "px-2 py-1 rounded text-xs font-medium border",
                              c.status === "scored" 
                                ? "bg-green-950/20 border-green-900/30 text-green-400" 
                                : "bg-yellow-950/20 border-yellow-900/30 text-yellow-400"
                            )}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* Detailed Call View */}
      {viewMode === "detail" && selectedCall && detailMetrics && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          
          {/* Header Section */}
          <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Call Analysis Report</h2>
                <p className="text-sm text-red-400 font-mono">{selectedCall.callId}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedCall.createdAt).toLocaleString()} • Agent: {selectedCall.agentId}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-red-400" />
                  <span className="text-xs text-gray-500 uppercase font-semibold">Quality Score</span>
                </div>
                <div className="text-4xl font-bold text-white">{selectedCall.scores?.overallScore?.toFixed(1) || "N/A"}</div>
                <div className="text-xs text-gray-500">out of 100</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-black/30 border border-gray-900 rounded-lg p-4 text-center">
                <Clock className="h-5 w-5 text-gray-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-white mb-1">{detailMetrics.duration}s</div>
                <div className="text-xs text-gray-500 uppercase">Total Duration</div>
              </div>
              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-center">
                <User className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-red-400 mb-1">{detailMetrics.agentSeconds}s</div>
                <div className="text-xs text-gray-500 uppercase">Agent ({detailMetrics.agentPct}%)</div>
              </div>
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 text-center">
                <MessageSquare className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-blue-400 mb-1">{detailMetrics.customerSeconds}s</div>
                <div className="text-xs text-gray-500 uppercase">Customer ({detailMetrics.customerPct}%)</div>
              </div>
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 text-center">
                <Activity className="h-5 w-5 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-green-400 mb-1">{detailMetrics.confidence}%</div>
                <div className="text-xs text-gray-500 uppercase">Confidence</div>
              </div>
            </div>
          </div>

          {/* Speaker Distribution */}
          <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-red-400" />
              Speaker Distribution
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 text-center">
                <div className="text-5xl font-bold text-red-400 mb-3">{detailMetrics.agentPct}%</div>
                <div className="text-sm text-gray-400 mb-2 uppercase font-semibold">Agent Speaking</div>
                <div className="text-sm text-red-300">{detailMetrics.agentSeconds} seconds</div>
              </div>
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-6 text-center">
                <div className="text-5xl font-bold text-blue-400 mb-3">{detailMetrics.customerPct}%</div>
                <div className="text-sm text-gray-400 mb-2 uppercase font-semibold">Customer Speaking</div>
                <div className="text-sm text-blue-300">{detailMetrics.customerSeconds} seconds</div>
              </div>
            </div>
            <div className="h-4 bg-black rounded-full overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-red-600 to-red-500" 
                style={{ width: `${detailMetrics.agentPct}%` }}
              />
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-500" 
                style={{ width: `${detailMetrics.customerPct}%` }}
              />
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-red-400" />
              Full Transcript
              <span className="text-sm text-gray-500 font-normal">
                ({(selectedCall.transcript?.transcript || []).length} segments)
              </span>
            </h3>
            {(selectedCall.transcript?.transcript || []).length > 0 ? (
              <div className="space-y-3">
                {(selectedCall.transcript?.transcript || []).map((seg, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      "p-4 rounded-lg border-l-4",
                      seg.speaker === "AGENT"
                        ? "bg-red-950/20 border-red-600"
                        : "bg-blue-950/20 border-blue-600"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={cx(
                          "px-3 py-1 rounded text-xs font-bold uppercase",
                          seg.speaker === "AGENT" 
                            ? "bg-red-600/20 text-red-300" 
                            : "bg-blue-600/20 text-blue-300"
                        )}>
                          {seg.speaker}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                          {seg.start?.toFixed(2)}s - {seg.end?.toFixed(2)}s
                        </span>
                      </div>
                      {seg.confidence && (
                        <span className="text-xs text-gray-500 font-medium">
                          {(seg.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white leading-relaxed">{seg.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-800" />
                No transcript available
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
