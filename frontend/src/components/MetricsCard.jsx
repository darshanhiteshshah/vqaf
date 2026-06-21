const colorClasses = {
  gray: {
    border: 'border-slate-800',
    value: 'text-white'
  },
  red: {
    border: 'border-rose-400/20',
    value: 'text-rose-200'
  },
  green: {
    border: 'border-emerald-400/20',
    value: 'text-emerald-200'
  },
  blue: {
    border: 'border-blue-400/20',
    value: 'text-blue-200'
  },
  yellow: {
    border: 'border-amber-400/20',
    value: 'text-amber-200'
  }
};

export default function MetricsCard({ icon, label, value, subtitle, color = 'gray' }) {
  const tone = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`rounded-xl border bg-white/[0.035] p-5 ${tone.border}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${tone.value}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
