function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function MetricsCard({ icon: Icon, label, value, subtitle, color = 'gray' }) {
  return (
    <div className={`bg-gray-950 border border-${color}-900/20 rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 text-${color}-500`} />
        <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
      </div>
      <div className={`text-3xl font-bold text-${color === 'gray' ? 'white' : color + '-400'}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
