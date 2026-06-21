import { safeNumber, scoreTone } from '../utils/visual';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function PageFrame({ children, className }) {
  return (
    <main className={cx('mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 page-enter', className)}>
      {children}
    </main>
  );
}

export function VisualPanel({ children, className, glow = false }) {
  return (
    <section className={cx('glass-panel', glow && 'glass-glow', className)}>
      {children}
    </section>
  );
}

export function StatTile({ icon: Icon, label, value, helper, tone = 'red', children }) {
  return (
    <div className={cx('stat-tile group', `tone-${tone}`)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
        </div>
        {Icon && (
          <span className="icon-chip">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      {helper && <p className="mt-3 text-xs text-slate-500">{helper}</p>}
      {children}
    </div>
  );
}

export function ScoreRing({ score = 0, size = 148, stroke = 12, label = 'score' }) {
  const value = Math.max(0, Math.min(100, safeNumber(score)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = scoreTone(value);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
          className="score-ring-path"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cx('text-4xl font-black', tone.text)}>{value ? value.toFixed(0) : 'N/A'}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      </div>
    </div>
  );
}

export function Sparkline({ values = [], color = '#f43f5e', className }) {
  const cleanValues = values.length ? values.map((value) => safeNumber(value)) : [18, 42, 35, 64, 58, 72, 67];
  const max = Math.max(...cleanValues, 1);
  const min = Math.min(...cleanValues, 0);
  const range = max - min || 1;
  const points = cleanValues
    .map((value, index) => {
      const x = cleanValues.length === 1 ? 100 : (index / (cleanValues.length - 1)) * 100;
      const y = 92 - ((value - min) / range) * 76;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cx('h-16 w-full overflow-visible', className)}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="spark-path" />
      <polyline points={`0,100 ${points} 100,100`} fill={color} opacity=".09" />
    </svg>
  );
}

export function Waveform({ bars = 44, active = 62, tone = 'red' }) {
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => {
        const height = 22 + Math.abs(Math.sin(index * 0.7) * 52) + Math.abs(Math.cos(index * 0.23) * 20);
        const isActive = index < Math.round((active / 100) * bars);
        return (
          <span
            key={index}
            className={cx(isActive ? `wave-${tone}` : 'wave-muted')}
            style={{ height: `${height}%`, animationDelay: `${index * 42}ms` }}
          />
        );
      })}
    </div>
  );
}

export function Donut({ segments = [], size = 180 }) {
  const total = segments.reduce((sum, segment) => sum + safeNumber(segment.value), 0) || 1;
  const gradient = segments
    .reduce(
      (acc, segment) => {
        const start = acc.offset;
        const end = start + (safeNumber(segment.value) / total) * 100;
        return {
          offset: end,
          parts: [...acc.parts, `${segment.color} ${start}% ${end}%`]
        };
      },
      { offset: 25, parts: [] }
    )
    .parts.join(', ');

  return (
    <div className="donut" style={{ width: size, height: size, background: `conic-gradient(${gradient})` }}>
      <div className="donut-core">
        <span className="text-3xl font-black text-white">{Math.round(total)}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">calls</span>
      </div>
    </div>
  );
}

export function Bars({ items = [], maxValue, compact = false }) {
  const max = maxValue || Math.max(...items.map((item) => safeNumber(item.value)), 1);

  return (
    <div className={cx('space-y-3', compact && 'space-y-2')}>
      {items.map((item) => {
        const width = Math.max(4, (safeNumber(item.value) / max) * 100);
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-300">{item.label}</span>
              <span className="font-bold text-white">{item.display ?? item.value}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${width}%`, background: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyVisual({ icon: Icon, title, hint }) {
  return (
    <div className="empty-visual">
      {Icon && (
        <span className="empty-orbit">
          <Icon className="h-8 w-8" />
        </span>
      )}
      <p className="text-base font-bold text-white">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
