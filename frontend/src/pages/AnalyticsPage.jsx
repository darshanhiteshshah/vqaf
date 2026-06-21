import { useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  Clock,
  Download,
  Headphones,
  RefreshCw,
  Trophy,
  Users
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { Bars, Donut, EmptyVisual, PageFrame, ScoreRing, Sparkline, StatTile, VisualPanel } from '../components/DashboardVisuals';
import { safeNumber } from '../utils/visual';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(14);
  const { analytics, loading, refetch } = useAnalytics(trendDays);
  const [refreshing, setRefreshing] = useState(false);

  const overview = analytics.overview || {};
  const trends = analytics.trends || [];
  const distribution = analytics.distribution || {};
  const totalDistribution = Object.values(distribution).reduce((sum, value) => sum + safeNumber(value), 0);
  const trendScores = trends.map((day) => safeNumber(day.avgScore));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !analytics.overview) {
    return (
      <PageFrame>
        <VisualPanel className="p-10">
          <EmptyVisual icon={RefreshCw} title="Loading analytics" hint="Building the performance view." />
        </VisualPanel>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="stat-label">Analytics</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Quality command center</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTrendDays(days)}
              className={cx(
                'focus-ring rounded-xl px-4 py-2 text-xs font-black transition-all',
                trendDays === days ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'
              )}
            >
              {days}D
            </button>
          ))}
          <button
            onClick={handleRefresh}
            className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white"
            aria-label="Refresh analytics"
          >
            <RefreshCw className={cx('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
          <button className="focus-ring rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white" aria-label="Export report">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Headphones} label="Calls" value={overview.totalCalls || 0} helper={`${overview.scoredCalls || 0} scored`} />
        <StatTile icon={Award} label="Avg Score" value={overview.avgScore ?? 'N/A'} helper="Quality mean" tone="teal" />
        <StatTile icon={AlertCircle} label="Flagged" value={`${overview.flaggedPct || 0}%`} helper={`${overview.flaggedCalls || 0} calls`} tone="amber" />
        <StatTile icon={Clock} label="Duration" value={`${overview.avgDuration || 0}s`} helper={`${overview.avgAgentTalkPct || 0}% agent talk`} tone="blue" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[.86fr_1.14fr]">
        <VisualPanel className="p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <ScoreRing score={overview.avgScore || 0} size={180} />
            <div className="min-w-0 flex-1">
              <p className="stat-label">Trendline</p>
              <h2 className="mt-2 text-2xl font-black text-white">Score movement</h2>
              <Sparkline values={trendScores} color="#2dd4bf" className="mt-4 h-24" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="Peak" value={trendScores.length ? Math.max(...trendScores).toFixed(0) : 'N/A'} />
                <MiniStat label="Low" value={trendScores.length ? Math.min(...trendScores).toFixed(0) : 'N/A'} />
                <MiniStat label="Calls" value={trends.reduce((sum, day) => sum + safeNumber(day.callCount), 0)} />
              </div>
            </div>
          </div>
        </VisualPanel>

        <VisualPanel className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="stat-label">Daily score</p>
              <h2 className="text-2xl font-black text-white">Last {trendDays} days</h2>
            </div>
            <BarChart3 className="h-6 w-6 text-rose-300" />
          </div>
          {trends.length ? (
            <div className="flex h-64 items-end gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              {trends.map((day, index) => {
                const height = Math.max(6, safeNumber(day.avgScore));
                return (
                  <div key={`${day.date}-${index}`} className="group flex h-full flex-1 flex-col justify-end gap-2">
                    <div className="relative flex flex-1 items-end">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-rose-600 via-red-400 to-teal-300 transition-all duration-500 group-hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />
                      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                        <p className="font-black text-white">{safeNumber(day.avgScore).toFixed(1)}</p>
                        <p className="text-slate-500">{day.callCount} calls</p>
                      </div>
                    </div>
                    <span className="text-center text-[10px] font-bold text-slate-600">{new Date(day.date).getDate()}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyVisual icon={BarChart3} title="No trend data" hint="Scored calls will draw this chart." />
          )}
        </VisualPanel>
      </section>

      <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <VisualPanel className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="stat-label">Distribution</p>
              <h2 className="text-2xl font-black text-white">Quality mix</h2>
            </div>
            <Donut
              size={138}
              segments={[
                { value: distribution.excellent || 0, color: '#34d399' },
                { value: distribution.good || 0, color: '#60a5fa' },
                { value: distribution.average || 0, color: '#f59e0b' },
                { value: distribution.poor || 0, color: '#fb7185' }
              ]}
            />
          </div>
          <Bars
            items={[
              { label: 'Excellent', value: distribution.excellent || 0, display: `${distribution.excellent || 0}`, color: '#34d399' },
              { label: 'Good', value: distribution.good || 0, display: `${distribution.good || 0}`, color: '#60a5fa' },
              { label: 'Average', value: distribution.average || 0, display: `${distribution.average || 0}`, color: '#f59e0b' },
              { label: 'Poor', value: distribution.poor || 0, display: `${distribution.poor || 0}`, color: '#fb7185' }
            ]}
            maxValue={Math.max(totalDistribution, 1)}
          />
        </VisualPanel>

        <VisualPanel className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="stat-label">Leaderboard</p>
              <h2 className="text-2xl font-black text-white">Agent performance</h2>
            </div>
            <Trophy className="h-6 w-6 text-amber-300" />
          </div>
          {analytics.leaderboard?.length ? (
            <div className="space-y-3">
              {analytics.leaderboard.slice(0, 8).map((agent, index) => (
                <div key={agent.agentId} className="grid grid-cols-[44px_1fr_70px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition-all hover:border-teal-300/30">
                  <div className={cx('grid h-10 w-10 place-items-center rounded-xl text-sm font-black', index < 3 ? 'bg-amber-300 text-slate-950' : 'bg-white/8 text-slate-400')}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{agent.agentId}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-teal-300" style={{ width: `${Math.min(safeNumber(agent.avgScore), 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{agent.avgScore}</p>
                    <p className="text-[10px] font-bold text-slate-500">{agent.totalCalls} calls</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyVisual icon={Users} title="No agents yet" hint="Leaderboard appears after scoring calls." />
          )}
        </VisualPanel>
      </section>
    </PageFrame>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
