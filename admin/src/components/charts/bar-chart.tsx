'use client';

import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

interface BarSeries {
  dataKey: string;
  color: string;
  label: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  animate?: boolean;
  stacked?: boolean;
  title?: string;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 59, g: 130, b: 246 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function BarChart({
  data,
  xKey,
  series,
  height = 360,
  animate = true,
  stacked = false,
}: BarChartProps) {
  const option = useMemo(() => {
    if (!data.length) return null;

    return {
      backgroundColor: 'transparent',
      grid: { top: 36, bottom: 68, left: 20, right: 28, containLabel: true },
      legend: {
        bottom: 8,
        textStyle: {
          color: '#64748b',
          fontSize: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
        },
        itemWidth: 14,
        itemHeight: 8,
        icon: 'roundRect',
        itemGap: 32,
        itemStyle: { borderWidth: 0 },
      },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderColor: 'rgba(148,163,184,0.15)',
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
        axisPointer: {
          type: 'shadow' as const,
          shadowStyle: { color: 'rgba(99,102,241,0.04)' },
        },
        formatter: (params: any[]) => {
          let total = 0;
          params.forEach((p) => { total += Number(p.value) || 0; });
          let html = `<div style="font-family:Inter,sans-serif;min-width:210px">`;
          html += `<div style="color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,0.12)">${params[0]?.name}</div>`;
          params.forEach((p) => {
            const seriesConfig = series.find(s => s.label === p.seriesName);
            const baseColor = seriesConfig ? seriesConfig.color : '#6366f1';
            const { r: pr, g: pg, b: pb } = hexToRgb(baseColor);
            const pct = total > 0 ? ((Number(p.value) / total) * 100).toFixed(0) : '0';
            html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:10px;padding:4px 0">`;
            html += `<div style="display:flex;align-items:center;gap:10px">`;
            html += `<span style="display:inline-block;width:4px;height:24px;border-radius:4px;background:linear-gradient(180deg,${baseColor},rgba(${pr},${pg},${pb},0.25))"></span>`;
            html += `<span style="color:#cbd5e1;font-size:13px;font-weight:500">${p.seriesName}</span></div>`;
            html += `<div style="display:flex;align-items:baseline;gap:6px"><strong style="font-size:16px;color:#f8fafc;letter-spacing:-0.01em">${Number(p.value).toLocaleString('en-IN')}</strong>`;
            html += `<span style="font-size:11px;color:#64748b">${pct}%</span></div>`;
            html += `</div>`;
          });
          html += '</div>';
          return html;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: data.map((d) => d[xKey] as string),
        axisLine: {
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
          rotate: data.length > 10 ? 35 : 0,
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
      series: series.map((s, sIdx) => {
        const { r, g, b } = hexToRgb(s.color);
        return {
          name: s.label,
          type: 'bar',
          stack: stacked ? 'total' : undefined,
          data: data.map((d) => Number(d[s.dataKey]) || 0),
          itemStyle: {
            borderRadius: stacked ? [0, 0, 0, 0] : [6, 6, 2, 2],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: s.color },
                { offset: 0.6, color: `rgba(${r},${g},${b},0.72)` },
                { offset: 1, color: `rgba(${r},${g},${b},0.35)` },
              ],
            },
          },
          barMaxWidth: 36,
          barCategoryGap: '30%',
          barGap: '16%',
          label: {
            show: series.length === 1 && data.length <= 15,
            position: 'top' as const,
            color: '#64748b',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif',
            distance: 8,
            formatter: (params: any) => {
              if (!params.value) return '';
              if (params.value >= 1_000_000) return `${(params.value / 1_000_000).toFixed(1)}M`;
              if (params.value >= 1000) return `${(params.value / 1000).toFixed(1)}k`;
              return String(params.value);
            },
          },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: `rgba(${Math.min(255, r + 20)},${Math.min(255, g + 20)},${Math.min(255, b + 20)},1)` },
                  { offset: 1, color: `rgba(${r},${g},${b},0.55)` },
                ],
              },
              shadowBlur: 16,
              shadowColor: `rgba(${r},${g},${b},0.4)`,
              shadowOffsetY: 4,
            },
          },
          animationDelay: (idx: number) => idx * 40 + sIdx * 200,
        };
      }),
      animation: animate,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [data, xKey, series, stacked, animate]);

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
