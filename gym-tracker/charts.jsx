/* charts.jsx – SVG-based chart components */

function LineChart({ data, labels, width = 500, height = 200, color = 'var(--accent)', showDots = true, showArea = true, yUnit = '', style }) {
  if (!data || data.length < 2) return null;
  const pad = { t: 20, r: 20, b: 32, l: 48 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad.l + (i / (data.length - 1)) * w,
    y: pad.t + h - ((v - min) / range) * h,
    v
  }));

  // smooth curve
  function bezierPath(points) {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const linePath = bezierPath(pts);
  const areaPath = linePath + ` L ${pts[pts.length-1].x} ${pad.t + h} L ${pts[0].x} ${pad.t + h} Z`;
  const gradId = React.useId();
  const yTicks = 4;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y grid + labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const yVal = min + (range / yTicks) * i;
        const yPos = pad.t + h - (i / yTicks) * h;
        return (
          <g key={i}>
            <line x1={pad.l} y1={yPos} x2={pad.l + w} y2={yPos} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.l - 8} y={yPos + 4} textAnchor="end" fill="var(--text-tertiary)" fontSize="11" fontFamily="var(--font-body)">
              {Math.round(yVal)}{yUnit}
            </text>
          </g>
        );
      })}
      {/* Area */}
      {showArea && <path d={areaPath} fill={`url(#${gradId})`} />}
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Dots */}
      {showDots && pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke={color} strokeWidth="2.5" />
        </g>
      ))}
      {/* X labels */}
      {labels && pts.map((p, i) => (
        <text key={i} x={p.x} y={height - 6} textAnchor="middle" fill="var(--text-tertiary)" fontSize="11" fontFamily="var(--font-body)">
          {labels[i] || ''}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data, labels, width = 500, height = 200, color = 'var(--accent)', style }) {
  if (!data || !data.length) return null;
  const pad = { t: 16, r: 16, b: 32, l: 48 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(...data) * 1.1 || 1;
  const barW = Math.min(32, (w / data.length) * 0.6);
  const gap = (w - barW * data.length) / (data.length);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={style}>
      <defs>
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = (v / max) * h;
        const x = pad.l + i * (barW + gap) + gap / 2;
        const y = pad.t + h - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={barW / 4} fill="url(#barGrad)" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontFamily="var(--font-body)" fontWeight="600">
              {v >= 1000 ? (v/1000).toFixed(1)+'k' : v}
            </text>
            {labels && (
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" fill="var(--text-tertiary)" fontSize="11" fontFamily="var(--font-body)">
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RadarChart({ data, labels, size = 240, color = 'var(--accent)', style }) {
  const categories = Object.keys(data);
  const values = Object.values(data);
  const max = 100;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 36;
  const angleStep = (2 * Math.PI) / categories.length;
  const startAngle = -Math.PI / 2;

  function getPoint(index, value) {
    const angle = startAngle + index * angleStep;
    const dist = (value / max) * r;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  }

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => getPoint(i, v));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const gradId = React.useId();

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={style}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* Grid rings */}
      {rings.map((s, i) => (
        <polygon key={i} points={categories.map((_, j) => {
          const p = getPoint(j, max * s);
          return `${p.x},${p.y}`;
        }).join(' ')} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {/* Axes */}
      {categories.map((_, i) => {
        const p = getPoint(i, max);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill={`url(#${gradId})`} stroke={color} strokeWidth="2" />
      {/* Dots and labels */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke={color} strokeWidth="2" />
          <text x={getPoint(i, max + 18).x} y={getPoint(i, max + 18).y + 4}
            textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontFamily="var(--font-body)" fontWeight="500">
            {categories[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function HeatmapChart({ data, style }) {
  const weeks = [];
  let currentWeek = [];
  data.forEach((d, i) => {
    currentWeek.push(d);
    if (d.dow === 6 || i === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  const colors = ['var(--bg-secondary)', 'rgba(139,92,246,0.2)', 'rgba(139,92,246,0.45)', 'rgba(139,92,246,0.8)'];
  const days = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const cellSize = 14;
  const gap = 3;

  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap, marginRight: 4, paddingTop: 0 }}>
          {days.map(d => (
            <div key={d} style={{ height: cellSize, fontSize: 9, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
              {Array.from({ length: 7 }, (_, di) => {
                const cell = week.find(c => c.dow === (di + 1) % 7);
                return (
                  <div key={di} title={cell ? `${cell.date}: ${['Rest','Leicht','Moderat','Intensiv'][cell.intensity]}` : ''}
                    style={{
                      width: cellSize, height: cellSize,
                      borderRadius: 3,
                      background: cell ? colors[cell.intensity] : 'transparent',
                      transition: 'var(--transition-fast)',
                    }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value, max = 100, size = 80, strokeWidth = 6, color = 'var(--accent)', label, showValue = true, style }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  const gradId = React.useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, ...style }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </svg>
      {showValue && (
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{Math.round(pct * 100)}%</span>
        </div>
      )}
      {label && <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</span>}
    </div>
  );
}

function MiniSparkline({ data, width = 80, height = 28, color = 'var(--accent)', style }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`);
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', ...style }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { LineChart, BarChart, RadarChart, HeatmapChart, ProgressRing, MiniSparkline });
