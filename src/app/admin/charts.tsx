// Dependency-free server-rendered SVG charts.

export function AreaChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 480, H = 200, pad = 36;
  const max = Math.max(100, ...points.map((p) => p.value)) * 1.1;
  const x = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (W - pad - 4);
  const y = (v: number) => H - 20 - (v / max) * (H - 30);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((max / 1.1) * t));
  const step = Math.max(1, Math.floor(points.length / 4));
  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} className="h-auto w-full" role="img" aria-label="Revenue over time">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad} x2={W} y1={y(t)} y2={y(t)} className="stroke-line" strokeDasharray="4 4" />
          <text x={pad - 6} y={y(t) + 4} textAnchor="end" fontSize="10" className="fill-muted">{t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}</text>
        </g>
      ))}
      {points.length > 0 && <path d={`${line} L${x(points.length - 1)},${H - 20} L${x(0)},${H - 20} Z`} fill="#6730cc" fillOpacity="0.15" />}
      <path d={line} fill="none" stroke="#6730cc" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => i % step === 0 && <text key={i} x={x(i)} y={H + 6} textAnchor="middle" fontSize="10" className="fill-muted">{p.label}</text>)}
    </svg>
  );
}

const COLORS = ["#7c4ddb", "#c46fc9", "#0aa2b5", "#4cbf5a", "#f0a030", "#56566b"];

export function Donut({ slices }: { slices: { label: string; value: number }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 60, C = 2 * Math.PI * R;
  const lens = slices.map((s) => (s.value / total) * C);
  const offsets = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 160 160" className="size-40 -rotate-90" role="img" aria-label="Sales by category">
        <circle cx="80" cy="80" r={R} fill="none" className="stroke-surface" strokeWidth="24" />
        {slices.map((s, i) => (
          <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="24" strokeDasharray={`${lens[i]} ${C - lens[i]}`} strokeDashoffset={-offsets[i]} />
        ))}
      </svg>
      <ul className="grid w-full grid-cols-2 gap-3 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{s.label}</span>
            <span>{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
