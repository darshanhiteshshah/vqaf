import { useState } from 'react';
import { 
  TrendingUp, Mic, Award, AlertCircle, Clock, Users, PieChart,
  BarChart3, Activity, Target, RefreshCw, Download, Filter,
  ArrowUp, ArrowDown, Minus, TrendingDown
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(7);
  const { analytics, loading, refetch } = useAnalytics(trendDays);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading || !analytics.overview) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  // Calculate trend indicators
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { direction: 'neutral', value: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: Math.abs(change).toFixed(1)
    };
  };

  const scoreTrend = calculateTrend(
    analytics.overview.avgScore,
    analytics.trends[0]?.avgScore || 0
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="h-10 w-10 bg-red-600/10 border border-red-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-red-400" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Performance insights and quality metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cx("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          
          <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-xs font-medium text-white flex items-center gap-2 transition-all">
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls Card */}
        <div className="bg-gray-950 border border-gray-900 rounded-xl p-6 hover:border-red-900/30 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Mic className="h-5 w-5 text-gray-400" />
            </div>
            <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-500 font-medium">
              {trendDays}D
            </span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics.overview.totalCalls}
          </div>
          <div className="text-sm text-gray-500 mb-3">Total Calls</div>
          <div className="text-xs text-gray-600">
            {analytics.overview.scoredCalls} scored • {analytics.overview.totalCalls - analytics.overview.scoredCalls} pending
          </div>
        </div>

        {/* Avg Score Card */}
        <div className="bg-gray-950 border border-green-900/20 rounded-xl p-6 hover:border-green-900/40 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 bg-green-950/20 rounded-lg flex items-center justify-center border border-green-900/30">
              <Award className="h-5 w-5 text-green-400" />
            </div>
            <div className={cx(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
              scoreTrend.direction === 'up' ? "bg-green-950/20 text-green-400" :
              scoreTrend.direction === 'down' ? "bg-red-950/20 text-red-400" :
              "bg-gray-900 text-gray-500"
            )}>
              {scoreTrend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> :
               scoreTrend.direction === 'down' ? <ArrowDown className="h-3 w-3" /> :
               <Minus className="h-3 w-3" />}
              {scoreTrend.value}%
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            {analytics.overview.avgScore}
          </div>
          <div className="text-sm text-gray-500 mb-3">Average Quality Score</div>
          <div className="w-full bg-gray-900 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full"
              style={{ width: `${analytics.overview.avgScore}%` }}
            />
          </div>
        </div>

        {/* Flagged Calls Card */}
        <div className="bg-gray-950 border border-yellow-900/20 rounded-xl p-6 hover:border-yellow-900/40 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 bg-yellow-950/20 rounded-lg flex items-center justify-center border border-yellow-900/30">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <Target className="h-4 w-4 text-gray-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {analytics.overview.flaggedPct}%
          </div>
          <div className="text-sm text-gray-500 mb-3">Calls with Issues</div>
          <div className="text-xs text-gray-600">
            {analytics.overview.flaggedCalls} of {analytics.overview.totalCalls} calls flagged
          </div>
        </div>

        {/* Avg Duration Card */}
        <div className="bg-gray-950 border border-blue-900/20 rounded-xl p-6 hover:border-blue-900/40 transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="h-10 w-10 bg-blue-950/20 rounded-lg flex items-center justify-center border border-blue-900/30">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <Activity className="h-4 w-4 text-gray-600" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {analytics.overview.avgDuration}s
          </div>
          <div className="text-sm text-gray-500 mb-3">Average Call Duration</div>
          <div className="text-xs text-gray-600">
            {analytics.overview.avgAgentTalkPct}% agent talk time
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Quality Score Trends</h3>
              <p className="text-xs text-gray-500">Daily average performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setTrendDays(days)}
                className={cx(
                  "px-4 py-2 rounded-lg text-xs font-semibold transition-all border",
                  trendDays === days
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700"
                )}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {analytics.trends && analytics.trends.length > 0 ? (
          <div>
            <div className="h-64 flex items-end gap-1 mb-4">
              {analytics.trends.map((day, idx) => {
                const height = (parseFloat(day.avgScore) / 100) * 100;
                const isToday = idx === analytics.trends.length - 1;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full">
                      <div
                        className={cx(
                          "w-full rounded-t transition-all hover:opacity-80 cursor-pointer",
                          isToday 
                            ? "bg-gradient-to-t from-red-600 to-red-400" 
                            : "bg-gradient-to-t from-red-900/50 to-red-800/50"
                        )}
                        style={{ height: `${height * 2.4}px`, minHeight: '4px' }}
                        title={`${day.date}: ${day.avgScore}/100 (${day.callCount} calls)`}
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-red-900/50 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-10">
                        <div className="font-bold text-red-400 mb-1">{day.avgScore}/100</div>
                        <div className="text-gray-400">{day.callCount} calls</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <span className={cx(
                      "text-xs transition-all",
                      isToday ? "text-red-400 font-bold" : "text-gray-600"
                    )}>
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-900">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {Math.max(...analytics.trends.map(d => parseFloat(d.avgScore) || 0)).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Peak Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {Math.min(...analytics.trends.map(d => parseFloat(d.avgScore) || 0)).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Lowest Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.trends.reduce((sum, d) => sum + (d.callCount || 0), 0)}
                </div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Total Calls</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-800" />
            <p className="font-medium">No trend data available</p>
            <p className="text-xs text-gray-700 mt-1">Complete more calls to see trends</p>
          </div>
        )}
      </div>

      {/* Leaderboard & Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Agent Leaderboard */}
        <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-red-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Agent Leaderboard</h3>
                <p className="text-xs text-gray-500">Top performers by quality score</p>
              </div>
            </div>
          </div>

          {analytics.leaderboard && analytics.leaderboard.length > 0 ? (
            <div className="space-y-3">
              {analytics.leaderboard.slice(0, 10).map((agent, idx) => {
                const scoreCategory = agent.avgScore >= 80 ? 'excellent' : 
                                     agent.avgScore >= 60 ? 'good' : 'fair';
                
                return (
                  <div 
                    key={agent.agentId} 
                    className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-gray-900 hover:border-red-900/30 hover:bg-black/40 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cx(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2",
                        idx === 0 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" :
                        idx === 1 ? "bg-gray-400/20 text-gray-300 border-gray-400/50" :
                        idx === 2 ? "bg-orange-500/20 text-orange-400 border-orange-500/50" :
                        "bg-gray-800 text-gray-500 border-gray-800"
                      )}>
                        #{idx + 1}
                      </div>
                      
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                          {agent.agentId}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{agent.totalCalls} calls</span>
                          <span className="text-gray-700">•</span>
                          <span className="text-xs text-yellow-500">{agent.flaggedPct}% flagged</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={cx(
                        "text-xl font-bold mb-1",
                        scoreCategory === 'excellent' ? 'text-green-400' :
                        scoreCategory === 'good' ? 'text-blue-400' :
                        'text-yellow-400'
                      )}>
                        {agent.avgScore}
                      </div>
                      <div className="text-xs text-gray-600">avg score</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-600">
              <Users className="h-10 w-10 mx-auto mb-3 text-gray-800" />
              <p className="font-medium">No agent data available</p>
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-gray-950 border border-red-900/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-red-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Score Distribution</h3>
                <p className="text-xs text-gray-500">Quality performance breakdown</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Excellent', range: '80-100', count: analytics.distribution?.excellent || 0, bgClass: 'bg-green-600' },
              { label: 'Good', range: '60-79', count: analytics.distribution?.good || 0, bgClass: 'bg-blue-600' },
              { label: 'Average', range: '40-59', count: analytics.distribution?.average || 0, bgClass: 'bg-yellow-600' },
              { label: 'Poor', range: '0-39', count: analytics.distribution?.poor || 0, bgClass: 'bg-red-600' }
            ].map(category => {
              const total = Object.values(analytics.distribution || {}).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((category.count / total) * 100).toFixed(1) : 0;
              
              return (
                <div key={category.label} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{category.label}</span>
                      <span className="text-xs text-gray-600">({category.range})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">{category.count}</span>
                      <span className="text-xs text-gray-500 ml-2">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-4 bg-black rounded-full overflow-hidden">
                    <div
                      className={cx("h-full transition-all duration-500 group-hover:opacity-80", category.bgClass)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Distribution Summary */}
          <div className="mt-6 pt-6 border-t border-gray-900 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {(analytics.distribution?.excellent || 0) + (analytics.distribution?.good || 0)}
              </div>
              <div className="text-xs text-gray-500 uppercase font-semibold">Above Target</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {analytics.distribution?.poor || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase font-semibold">Needs Improvement</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
