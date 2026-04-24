/**
 * ChartComponents.js
 * Custom SVG-based charts built on react-native-svg (already installed).
 * No additional dependencies required.
 *
 * Exports: BarChart, DonutChart, LineChart
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Rect, Path, G, Line, Circle,
  Text as SvgText,
} from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
  return String(Math.round(v));
};

const trunc = (s, n = 7) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');

// ─── Bar Chart ────────────────────────────────────────────────────────────────
/**
 * data        [{ label: string, value: number, color?: string }]
 * width       SVG width (defaults to screen width minus typical card padding)
 * height      SVG height (default 200)
 * defaultColor  fallback bar colour
 * gridColor   horizontal grid line colour
 * labelColor  axis text colour
 * showValues  show value labels above bars (default true)
 */
export function BarChart({
  data = [],
  width = SCREEN_W - 64,
  height = 200,
  defaultColor = '#0F766E',
  gridColor = '#E5E7EB',
  labelColor = '#9CA3AF',
  showValues = true,
}) {
  if (!data.length) return null;

  const PAD = { L: 34, R: 8, T: 28, B: 38 };
  const cW  = width  - PAD.L - PAD.R;
  const cH  = height - PAD.T - PAD.B;
  const n   = data.length;

  // bars + gaps
  const totalGap = cW * 0.30;
  const gap  = n > 1 ? totalGap / (n - 1) : 0;
  const barW = Math.max(6, (cW - totalGap) / n);

  const max  = Math.max(...data.map(d => d.value), 1);
  const ticks = [0, Math.round(max * 0.5), max];

  return (
    <Svg width={width} height={height}>
      {/* ── Grid lines + Y labels ── */}
      {ticks.map((val, i) => {
        const y = PAD.T + cH - (val / max) * cH;
        return (
          <G key={i}>
            <Line
              x1={PAD.L} y1={y} x2={PAD.L + cW} y2={y}
              stroke={gridColor} strokeWidth={1}
            />
            <SvgText
              x={PAD.L - 5} y={y + 4}
              textAnchor="end" fontSize={8} fill={labelColor}
            >{fmt(val)}</SvgText>
          </G>
        );
      })}

      {/* ── Bars ── */}
      {data.map((item, i) => {
        const bH    = Math.max(4, (item.value / max) * cH);
        const x     = PAD.L + i * (barW + gap);
        const y     = PAD.T + cH - bH;
        const color = item.color || defaultColor;

        return (
          <G key={i}>
            {/* Bar body */}
            <Rect x={x} y={y} width={barW} height={bH} fill={color} rx={5} />

            {/* Value label above bar */}
            {showValues && item.value > 0 && (
              <SvgText
                x={x + barW / 2} y={y - 5}
                textAnchor="middle" fontSize={8} fill={color} fontWeight="bold"
              >{fmt(item.value)}</SvgText>
            )}

            {/* X-axis label */}
            <SvgText
              x={x + barW / 2} y={height - PAD.B + 14}
              textAnchor="middle" fontSize={8} fill={labelColor}
            >{trunc(item.label)}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
/**
 * data          [{ label: string, value: number, color: string }]
 * size          diameter (default 180)
 * centerLabel   big text in the centre hole
 * centerSublabel smaller text below centerLabel
 * showLegend    render a legend row below the chart (default true)
 */

function _polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function _arcPath(cx, cy, R, r, startDeg, endDeg) {
  const end   = Math.min(endDeg, startDeg + 359.99); // avoid full-circle SVG edge case
  const large = end - startDeg > 180 ? 1 : 0;
  const s1 = _polar(cx, cy, R, startDeg);
  const e1 = _polar(cx, cy, R, end);
  const s2 = _polar(cx, cy, r, end);
  const e2 = _polar(cx, cy, r, startDeg);
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${R} ${R} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${r} ${r} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

export function DonutChart({
  data = [],
  size = 180,
  centerLabel = '',
  centerSublabel = '',
  showLegend = true,
}) {
  if (!data.length) return null;

  const cx    = size / 2;
  const cy    = size / 2;
  const R     = size / 2 - 8;
  const r     = R * 0.56;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let angle = 0;
  const slices = data.map((item) => {
    const sweep = (item.value / total) * 360;
    const start = angle;
    angle += sweep;
    return { ...item, start, sweep, pct: Math.round((item.value / total) * 100) };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path
            key={i}
            d={_arcPath(cx, cy, R, r, s.start, s.start + s.sweep)}
            fill={s.color}
          />
        ))}

        {/* Centre labels */}
        {!!centerLabel && (
          <SvgText
            x={cx} y={cy + (centerSublabel ? -3 : 6)}
            textAnchor="middle" fontSize={15} fontWeight="bold" fill="#111827"
          >{centerLabel}</SvgText>
        )}
        {!!centerSublabel && (
          <SvgText
            x={cx} y={cy + 14}
            textAnchor="middle" fontSize={9} fill="#6B7280"
          >{centerSublabel}</SvgText>
        )}
      </Svg>

      {showLegend && (
        <View style={donutSt.legend}>
          {slices.map((s, i) => (
            <View key={i} style={donutSt.item}>
              <View style={[donutSt.dot, { backgroundColor: s.color }]} />
              <Text style={donutSt.label} numberOfLines={1}>{s.label}</Text>
              <Text style={[donutSt.pct, { color: s.color }]}>{s.pct}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const donutSt = StyleSheet.create({
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center', marginTop: 10, paddingHorizontal: 8,
  },
  item:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:   { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 11, color: '#6B7280', maxWidth: 90 },
  pct:   { fontSize: 11, fontWeight: '600' },
});

// ─── Line Chart ───────────────────────────────────────────────────────────────
/**
 * data        [{ label: string, value: number }]
 * width       SVG width
 * height      SVG height (default 150)
 * color       line + fill colour
 * gridColor   grid line colour
 * labelColor  axis text colour
 */
export function LineChart({
  data = [],
  width = SCREEN_W - 64,
  height = 150,
  color = '#0F766E',
  gridColor = '#E5E7EB',
  labelColor = '#9CA3AF',
}) {
  if (data.length < 2) return null;

  const PAD = { L: 34, R: 8, T: 18, B: 30 };
  const cW  = width  - PAD.L - PAD.R;
  const cH  = height - PAD.T - PAD.B;
  const max = Math.max(...data.map(d => d.value), 1);

  const pts = data.map((item, i) => ({
    x: PAD.L + (i / (data.length - 1)) * cW,
    y: PAD.T + cH - (item.value / max) * cH,
    label: item.label,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const fillPath = [
    linePath,
    `L ${pts[pts.length - 1].x.toFixed(2)} ${(PAD.T + cH).toFixed(2)}`,
    `L ${pts[0].x.toFixed(2)} ${(PAD.T + cH).toFixed(2)}`,
    'Z',
  ].join(' ');

  const ticks = [0, Math.round(max * 0.5), max];
  // Show label every N points so they don't overlap
  const step = Math.max(1, Math.ceil(data.length / 6));

  return (
    <Svg width={width} height={height}>
      {/* Grid */}
      {ticks.map((val, i) => {
        const y = PAD.T + cH - (val / max) * cH;
        return (
          <G key={i}>
            <Line
              x1={PAD.L} y1={y} x2={PAD.L + cW} y2={y}
              stroke={gridColor} strokeWidth={1}
            />
            <SvgText
              x={PAD.L - 5} y={y + 4}
              textAnchor="end" fontSize={8} fill={labelColor}
            >{fmt(val)}</SvgText>
          </G>
        );
      })}

      {/* Area fill */}
      <Path d={fillPath} fill={color} fillOpacity={0.12} />

      {/* Line */}
      <Path
        d={linePath}
        stroke={color} strokeWidth={2.5}
        fill="none" strokeLinejoin="round" strokeLinecap="round"
      />

      {/* Dots + labels */}
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          {(i % step === 0 || i === pts.length - 1) && (
            <SvgText
              x={p.x} y={height - PAD.B + 14}
              textAnchor="middle" fontSize={8} fill={labelColor}
            >{trunc(p.label, 5)}</SvgText>
          )}
        </G>
      ))}
    </Svg>
  );
}
