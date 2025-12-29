import { useState, useMemo } from 'react';
import { 
  Headphones, RefreshCw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Download, Calendar, Filter, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCalls } from '../hooks/useCalls';
import { getCallMetrics } from '../utils/metrics';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function HistoryPage({ onCallSelect }) {
  const { calls, loading, refetch } = useCalls();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Sort handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-600" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-red-400" />
      : <ArrowDown className="h-3.5 w-3.5 text-red-400" />;
  };

  // Filter and sort calls
  const processedCalls = useMemo(() => {
    let filtered = calls.filter(call => {
      const matchesSearch = 
        call.callId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.agentId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'callId':
          aValue = a.callId;
          bValue = b.callId;
          break;
        case 'agentId':
          aValue = a.agentId;
          bValue = b.agentId;
          break;
        case 'duration':
          aValue = getCallMetrics(a).durationRaw || 0;
          bValue = getCallMetrics(b).durationRaw || 0;
          break;
        case 'agentPct':
          aValue = parseFloat(getCallMetrics(a).agentPct) || 0;
          bValue = parseFloat(getCallMetrics(b).agentPct) || 0;
          break;
        case 'score':
          aValue = a.scores?.overallScore || 0;
          bValue = b.scores?.overallScore || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [calls, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedCalls.length / itemsPerPage);
  const paginatedCalls = processedCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Call ID', 'Agent', 'Duration (s)', 'Agent %', 'Score', 'Method', 'Status', 'Created At'];
    const rows = processedCalls.map(call => {
      const metrics = getCallMetrics(call);
      return [
        call.callId,
        call.agentId,
        metrics.duration,
        metrics.agentPct,
        call.scores?.overallScore?.toFixed(1) || 'N/A',
        call.transcript?.method || 'Energy',
        call.status,
        new Date(call.createdAt).toLocaleString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="h-5 w-5 text-red-400" />
              Call History
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {processedCalls.length} {processedCalls.length === 1 ? 'call' : 'calls'}
              {searchTerm || statusFilter !== 'all' ? ' (filtered)' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-900/50 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="uploaded">Uploaded</option>
                <option value="transcribed">Transcribed</option>
                <option value="scored">Scored</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-10 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-900/50 w-64"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={processedCalls.length === 0}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cx("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-900">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900/50">
              <tr>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('callId')}
                >
                  <div className="flex items-center gap-2">
                    Call ID
                    {getSortIcon('callId')}
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('agentId')}
                >
                  <div className="flex items-center gap-2">
                    Agent
                    {getSortIcon('agentId')}
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center gap-2">
                    Duration
                    {getSortIcon('duration')}
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('agentPct')}
                >
                  <div className="flex items-center gap-2">
                    Agent %
                    {getSortIcon('agentPct')}
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center gap-2">
                    Score
                    {getSortIcon('score')}
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase">
                  Method
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="text-left px-4 py-3 font-semibold text-xs text-gray-400 uppercase cursor-pointer hover:bg-gray-900/70 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Created
                    {getSortIcon('createdAt')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-600">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-red-400" />
                    Loading calls...
                  </td>
                </tr>
              ) : paginatedCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-600">
                    <Headphones className="h-8 w-8 mx-auto mb-2 text-gray-800" />
                    <p className="font-medium">
                      {searchTerm || statusFilter !== 'all' ? 'No matching calls found' : 'No calls yet'}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Upload your first call to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCalls.map((call) => {
                  const callMetrics = getCallMetrics(call);
                  return (
                    <tr 
                      key={call._id} 
                      className="bg-black/20 hover:bg-red-950/10 transition-all cursor-pointer group"
                      onClick={() => onCallSelect(call.callId)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-red-400 font-semibold group-hover:text-red-300">
                        {call.callId}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-medium">{call.agentId}</td>
                      <td className="px-4 py-3 text-xs text-white font-semibold">{callMetrics.duration}s</td>
                      <td className="px-4 py-3 text-xs text-red-400 font-semibold">{callMetrics.agentPct}%</td>
                      <td className="px-4 py-3">
                        <span className={cx(
                          "text-xs font-bold",
                          call.scores?.overallScore >= 80 ? "text-green-400" :
                          call.scores?.overallScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )}>
                          {call.scores?.overallScore?.toFixed(1) || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cx(
                          "px-2 py-1 rounded text-xs font-medium",
                          call.transcript?.method === "ML" 
                            ? "bg-purple-950/30 text-purple-300 border border-purple-900/30" 
                            : "bg-blue-950/30 text-blue-300 border border-blue-900/30"
                        )}>
                          {call.transcript?.method || "Energy"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cx(
                          "px-2 py-1 rounded text-xs font-medium border",
                          call.status === "scored" 
                            ? "bg-green-950/20 border-green-900/30 text-green-400" 
                            : call.status === "failed"
                            ? "bg-red-950/20 border-red-900/30 text-red-400"
                            : "bg-yellow-950/20 border-yellow-900/30 text-yellow-400"
                        )}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                        {formatDate(call.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedCalls.length)} of {processedCalls.length} results
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cx(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          currentPage === page
                            ? "bg-red-600 text-white"
                            : "bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400"
                        )}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-gray-600 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
