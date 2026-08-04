import React, { useState, useEffect, useRef } from 'react';

const ANIM_DURATION = 800;

function animateValue(start, end, duration, callback) {
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    callback(start + (end - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ==================== Area Chart ==================== */
export function AreaChart({ data, width = 600, height = 280, color = '#6366f1', gradientId = 'areaGrad', formatY = (v) => v, labels = [] }) {
  const [animProgress, setAnimProgress] = useState(0);
  const triggered = useRef(false);

  useEffect(() => {
    if (!triggered.current) { triggered.current = true; setAnimProgress(1); }
  }, []);

  if (!data || data.length === 0) return <EmptyChartPlaceholder />;

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data, 1);
  const getX = (i) => padding.left + (i / Math.max(data.length - 1, 1)) * w;
  const getY = (v) => padding.top + h - (v / maxVal) * h * animProgress;

  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const areaPath = `${points} L${getX(data.length - 1)},${padding.top + h} L${getX(0)},${padding.top + h} Z`;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const y = padding.top + (h / yTicks) * i;
    const val = maxVal - (maxVal / yTicks) * i;
    return { y, val };
  });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map(({ y, val }) => (
          <g key={y}>
            <line x1={padding.left} y1={y} x2={padding.left + w} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-sans)">{formatY(val)}</text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          const cx = getX(i), cy = getY(v);
          return <circle key={i} cx={cx} cy={cy} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />;
        })}
        {labels.length > 0 && (
          labels.map((label, i) => (
            <text key={`l-${i}`} x={getX(i)} y={height - 8} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-sans)">{label}</text>
          ))
        )}
      </svg>
    </div>
  );
}

/* ==================== Bar Chart ==================== */
export function BarChart({ data = [], width = 500, height = 260, color = '#6366f1', formatX = (v) => v, formatY = (v) => v }) {
  const [animProgress, setAnimProgress] = useState(0);
  const triggered = useRef(false);

  useEffect(() => {
    if (!triggered.current) { triggered.current = true; setAnimProgress(1); }
  }, []);

  if (!data || data.length === 0) return <EmptyChartPlaceholder />;

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const padding = { top: 16, right: 16, bottom: 30, left: 44 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const barGap = Math.min(12, Math.max(4, w / data.length * 0.25));
  const barWidth = (w - barGap * (data.length - 1)) / data.length;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const y = padding.top + (h / yTicks) * i;
    const val = maxVal - (maxVal / yTicks) * i;
    return { y, val };
  });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {gridLines.map(({ y, val }) => (
          <g key={y}>
            <line x1={padding.left} y1={y} x2={padding.left + w} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-sans)">{formatY(val)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padding.left + i * (barWidth + barGap);
          const barH = (d.value / maxVal) * h * animProgress;
          const y = padding.top + h - barH;
          const rad = Math.min(6, barWidth / 2);
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={Math.max(barH, 3)} rx={rad} ry={rad} fill="url(#barGrad)" opacity="0.85" />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">
                {d.value > 0 ? formatY(d.value) : ''}
              </text>
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-sans)">
                {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ==================== Donut Chart ==================== */
export function DonutChart({ data = [], size = 200, thickness = 40, colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'] }) {
  const [animProgress, setAnimProgress] = useState(0);
  const triggered = useRef(false);

  useEffect(() => {
    if (!triggered.current) { triggered.current = true; setAnimProgress(1); }
  }, []);

  if (!data || data.length === 0) return <EmptyChartPlaceholder />;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  const innerR = r - thickness;

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360;
    const endAngle = ((cumulative + d.value) / total) * 360;
    cumulative += d.value;
    return { ...d, index: i, startAngle: startAngle * animProgress, endAngle: endAngle * animProgress, color: colors[i % colors.length] };
  });

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.map((seg) => {
          const outerArc = describeArc(cx, cy, r, seg.startAngle, seg.endAngle);
          const innerArc = describeArc(cx, cy, innerR, seg.startAngle, seg.endAngle);
          return (
            <path key={seg.index} d={`${outerArc} L ${innerArc.split(' ').slice(-2).join(' ')} ${innerArc.split(' ').slice(0, 2).join(' ')} Z`}
              fill={seg.color} opacity="0.88" stroke="var(--surface)" strokeWidth="2" />
          );
        })}
        <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--surface)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="800" fontFamily="var(--font-sans)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', flex: 1, minWidth: '140px' }}>
        {segments.map((seg) => (
          <div key={seg.index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{seg.label}</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== Sparkline (Mini Chart) ==================== */
export function Sparkline({ data = [], width = 80, height = 28, color = '#10b981' }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;

  const maxV = Math.max(...data, 1);
  const minV = Math.min(...data, 0);
  const range = maxV - minV || 1;
  const getX = (i) => (i / Math.max(data.length - 1, 1)) * width;
  const getY = (v) => height - ((v - minV) / range) * (height - 4) - 2;

  const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={getX(data.length - 1)} cy={getY(data[data.length - 1])} r="2" fill={color} />
    </svg>
  );
}

/* ==================== Empty Placeholder ==================== */
function EmptyChartPlaceholder() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', gap: '8px', minHeight: '180px'
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>No data yet</span>
    </div>
  );
}
