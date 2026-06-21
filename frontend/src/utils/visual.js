export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function scoreTone(score) {
  const value = safeNumber(score);
  if (value >= 80) return { label: 'Strong', text: 'text-emerald-300', stroke: '#34d399', bg: 'from-emerald-500/30' };
  if (value >= 60) return { label: 'Stable', text: 'text-amber-300', stroke: '#f59e0b', bg: 'from-amber-500/30' };
  return { label: 'Review', text: 'text-rose-300', stroke: '#fb7185', bg: 'from-rose-500/30' };
}
