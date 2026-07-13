'use client';

import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

interface AreaChartProps {
  data: { x: string; y: number }[];
  color?: string;
  gradientId?: string;
  height?: number;
  animate?: boolean;
  label?: string;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 234, g: 88, b: 12 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lighten(r: number, g: number, b: number, pct: number) {
  return {
    r: Math.min(255, Math.round(r + (255 - r) * pct)),
    g: Math.min(255, Math.round(g + (255 - g) * pct)),
    b: Math.min(255, Math.round(b + (255 - b) * pct)),
  };
}

export function AreaChart({
  data,
  color = '#ea580c',
  height = 360,
  animate = true,
}: AreaChartProps) {
  const option = useMemo(() => {
    if (!data.length) return null;

    const { r, g, b } = hexToRgb(color);
    const light = lighten(r, g, b, 0.35);
    const maxVal = Math.max(...data.map((d) => d.y));
    const avgVal = data.reduce((s, d) => s + d.y, 0) / data.length;
    const avgLabel =
      avgVal >= 1_000_000
        ? `${(avgVal / 1_000_000).toFixed(1)}M`
        : avgVal >= 1000
          ? `${(avgVal / 1000).toFixed(1)}k`
          : avgVal.toFixed(0);

    return {
      backgroundColor: 'transparent',
      grid: { top: 40, bottom: 56, left: 20, right: 28, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderColor: `rgba(${r},${g},${b},0.35)`,
        borderWidth: 1,
        borderRadius: 16,
        padding: [16, 20],
        textStyle: {
          color: '#f8fafc',
          fontSize: 13,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        extraCssText:
          'backdrop-filter:blur(12px);box-shadow:0 20px 40px rgba(0,0,0,0.25),0 0 0 1px rgba(255,255,255,0.05) inset;',
        formatter: (params: any[]) => {
          const p = params[0];
          const pct = maxVal > 0 ? ((p.value / maxVal) * 100).toFixed(0) : '0';
          const trend = p.dataIndex > 0
            ? p.value - data[p.dataIndex - 1].y
            : 0;
          const trendIcon = trend >= 0 ? '↑' : '↓';
          const trendColor = trend >= 0 ? '#34d399' : '#f87171';
          return [
            `<div style="font-family:Inter,sans-serif;min-width:200px">`,
            `<div style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,0.12)">${p.name}</div>`,
            `<div style="display:flex;align-items:flex-end;justify-content:space-between">`,
            `<div style="display:flex;align-items:center;gap:12px">`,
            `<div style="width:4px;height:38px;border-radius:4px;background:linear-gradient(180deg,${color},rgba(${r},${g},${b},0.15))"></div>`,
            `<div><div style="font-weight:800;font-size:26px;color:#f8fafc;line-height:1;letter-spacing:-0.02em">${Number(p.value).toLocaleString('en-IN')}</div>`,
            `<div style="color:#64748b;font-size:11px;margin-top:5px;display:flex;align-items:center;gap:4px">`,
            `<span style="color:${trendColor};font-weight:700">${trendIcon} ${Math.abs(trend).toLocaleString('en-IN')}</span>`,
            `<span>vs prev</span></div></div></div>`,
            `<div style="text-align:right"><div style="font-size:20px;font-weight:800;background:linear-gradient(135deg,${color},rgb(${light.r},${light.g},${light.b}));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1">${pct}%</div>`,
            `<div style="color:#64748b;font-size:11px;margin-top:5px">of peak</div></div>`,
            `</div></div>`,
          ].join('');
        },
        axisPointer: {
          type: 'line' as const,
          lineStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(${r},${g},${b},0.6)` },
                { offset: 1, color: `rgba(${r},${g},${b},0)` },
              ],
            },
            width: 2,
            type: 'solid' as const,
          },
        },
      },
      xAxis: {
        type: 'category' as const,
        data: data.map((d) => d.x),
        boundaryGap: false,
        axisLine: {
          show: true,
          lineStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: 'rgba(226,232,240,0)' },
                { offset: 0.2, color: 'rgba(226,232,240,0.8)' },
                { offset: 0.8, color: 'rgba(226,232,240,0.8)' },
                { offset: 1, color: 'rgba(226,232,240,0)' },
              ],
            },
            width: 1,
          },
        },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          margin: 14,
          rotate: data.length > 12 ? 35 : 0,
          hideOverlap: true,
          interval: data.length > 20 ? Math.floor(data.length / 10) : 0,
        },
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          margin: 12,
          formatter: (value: number) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
            return String(value);
          },
        },
        splitLine: {
          lineStyle: { color: 'rgba(241,245,249,0.7)', width: 1, type: 'dashed' as const },
        },
        splitNumber: 5,
      },
      series: [
        {
          type: 'line',
          data: data.map((d) => d.y),
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: data.length <= 20 ? 6 : 0,
          showSymbol: false,
          emphasis: {
            focus: 'series' as const,
            showSymbol: true,
            symbolSize: 14,
            itemStyle: {
              color: '#fff',
              borderColor: color,
              borderWidth: 3,
              shadowBlur: 20,
              shadowColor: `rgba(${r},${g},${b},0.6)`,
            },
          },
          lineStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: `rgba(${r},${g},${b},0.7)` },
                { offset: 0.3, color },
                { offset: 0.7, color },
                { offset: 1, color: `rgb(${light.r},${light.g},${light.b})` },
              ],
            },
            width: 3,
            shadowBlur: 12,
            shadowColor: `rgba(${r},${g},${b},0.3)`,
            shadowOffsetY: 6,
          },
          itemStyle: { color, borderColor: '#ffffff', borderWidth: 2.5 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(${r},${g},${b},0.28)` },
                { offset: 0.35, color: `rgba(${r},${g},${b},0.12)` },
                { offset: 0.7, color: `rgba(${r},${g},${b},0.04)` },
                { offset: 1, color: `rgba(${r},${g},${b},0)` },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: {
              color: `rgba(${r},${g},${b},0.3)`,
              type: 'dashed' as const,
              width: 1,
            },
            label: {
              show: true,
              position: 'insideEndTop',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              backgroundColor: `rgba(${r},${g},${b},0.85)`,
              padding: [5, 10],
              borderRadius: 8,
              formatter: () => `Avg ${avgLabel}`,
            },
            data: [{ type: 'average' }],
          },
        },
      ],
      animation: animate,
      animationDuration: 1400,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 30,
    };
  }, [data, color, animate]);

  if (!option) return null;

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  );
}
