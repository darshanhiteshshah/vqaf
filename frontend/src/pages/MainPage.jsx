import { useState } from 'react';
import { 
  Upload, FileAudio, CloudUpload, Zap, RefreshCw, AlertCircle, 
  Mic, CheckCircle, XCircle, Clock, TrendingUp, Users, Award 
} from 'lucide-react';
import axios from 'axios';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function MainPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');

  // Validate file size and type
  const validateFile = (selectedFile) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      console.log('File selected:', selectedFile.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
        console.log('File dropped:', droppedFile.name);
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

      console.log('Uploading file:', file.name);

      const res = await axios.post('http://localhost:3001/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          
          if (progress === 100) {
            setProcessingStage('Transcribing audio...');
          }
        }
      });

      console.log('Upload successful:', res.data);
      setProcessingStage('Analysis complete!');
      setResult(res.data);
      setFile(null);
      setUploadProgress(100);
    } catch (err) {
      console.error('Upload error:', err);
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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Upload Card */}
        <div className="lg:col-span-1 bg-gray-950 border border-red-900/20 rounded-xl p-6 h-fit sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 bg-red-600/10 border border-red-900/30 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Audio</h2>
              <p className="text-xs text-gray-500">Analyze call recording</p>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            className={cx(
              "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer mb-4",
              dragActive ? "border-red-500 bg-red-950/10" : "border-gray-800 hover:border-red-900/50",
              loading && "pointer-events-none opacity-50"
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
                "h-16 w-16 rounded-lg flex items-center justify-center mb-3 transition-all border",
                dragActive ? "bg-red-900/20 border-red-700" : "bg-gray-900 border-gray-800"
              )}>
                {dragActive ? (
                  <CloudUpload className="h-8 w-8 text-red-400" />
                ) : (
                  <FileAudio className="h-8 w-8 text-gray-600" />
                )}
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                {dragActive ? "Drop file here" : "Drop or click to upload"}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                MP3, WAV, M4A, OGG
              </p>
              {file && (
                <div className="mt-3 w-full bg-gray-900 rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <FileAudio className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-white font-medium truncate">{file.name}</p>
                  </div>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {loading && (
            <div className="mb-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">{processingStage}</p>
                <p className="text-xs text-red-400 font-medium">{uploadProgress}%</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-600 to-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={cx(
              "w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
              !file || loading
                ? "bg-gray-900 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-900/20"
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

          <p className="mt-4 text-xs text-center text-gray-600">
            🔒 Local processing • No cloud storage • Max 100MB
          </p>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-950/20 border border-green-900/30 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Complete</span>
                  </div>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-gray-500">Overall Score</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {result.scores?.overallScore || result.scores?.overall_score || 'N/A'}
                      <span className="text-sm text-gray-500">/100</span>
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <p className="text-xs text-gray-500">Duration</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatDuration(result.metrics?.totalDuration || result.metrics?.duration)}
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <p className="text-xs text-gray-500">Agent Talk</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {result.metrics?.agentTalkPct || '0'}
                      <span className="text-sm text-gray-500">%</span>
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <p className="text-xs text-gray-500">Confidence</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {result.metrics?.confidence ? (result.metrics.confidence * 100).toFixed(0) : 'N/A'}
                      {result.metrics?.confidence && <span className="text-sm text-gray-500">%</span>}
                    </p>
                  </div>
                </div>

                {/* Call Details */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Call Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">Call ID</p>
                      <p className="text-gray-300 font-mono">{result.callId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Method</p>
                      <p className="text-gray-300">{result.method || 'Energy-based'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Agent Time</p>
                      <p className="text-gray-300">{formatDuration(result.metrics?.agentSeconds)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Customer Time</p>
                      <p className="text-gray-300">{formatDuration(result.metrics?.customerSeconds)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Data (Collapsible) */}
              <details className="bg-gray-950 border border-gray-900 rounded-xl overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer hover:bg-gray-900/50 transition-colors text-sm font-semibold text-gray-400">
                  View Raw JSON Data
                </summary>
                <div className="px-6 pb-6">
                  <pre className="text-xs text-gray-400 overflow-auto bg-gray-900 p-4 rounded-lg border border-gray-800">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-gray-950 border border-gray-900 rounded-xl flex flex-col items-center justify-center py-20">
              <div className="h-20 w-20 bg-gray-900 rounded-xl flex items-center justify-center mb-4 border border-gray-800">
                <Mic className="h-10 w-10 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No Analysis Yet</h3>
              <p className="text-sm text-gray-700">Upload a call recording to see results</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
