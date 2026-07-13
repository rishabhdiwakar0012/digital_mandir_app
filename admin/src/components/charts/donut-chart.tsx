'use client';

import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

interface DonutChartProps {
  data: { x: string; y: number }[];
  colors?: string[];
  height?: number;
  innerRadius?: number;
  animate?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

const DEFAULT_COLORS = [
  '#6366f1', '#f97316', '#10b981', '#3b82f6',
  '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16',
];

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 99, g: 102, b: 241 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function DonutChart({
  data,
  colors = DEFAULT_COLORS,
  height = 280,
  innerRadius = 70,
  animate = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const option = useMemo(() => {
    if (!data.length) return null;

    const total = data.reduce((sum, d) => sum + d.y, 0);
    const halfH = height / 2;
    const outerPct = 78;
    const innerPct = Math.round((innerRadius / halfH) * outerPct);
    const bgRingInner = innerPct - 2;
    const bgRingOuter = outerPct + 3;

    const graphicItems: any[] = [];

    if (centerLabel) {
      graphicItems.push({
        type: 'group',
        left: 'center',
        top: 'middle',
        children: [
          {
            type: 'circle',
            shape: { cx: 0, cy: 0, r: Math.round(halfH * innerPct / 100) - 8 },
            style: {
              fill: {
                type: 'radial',
                x: 0.5, y: 0.5, r: 0.5,
                colorStops: [
                  { offset: 0, color: 'rgba(255,255,255,0.95)' },
                  { offset: 0.8, color: 'rgba(248,250,252,0.9)' },
                  { offset: 1, color: 'rgba(241,245,249,0.85)' },
                ],
              },
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.06)',
            },
          },
          {
            type: 'text',
            style: {
              text: centerValue || total.toLocaleString('en-IN'),
              textAlign: 'center' as const,
              fill: '#0f172a',
              fontSize: 28,
              fontWeight: 800,
              fontFamily: 'Inter, system-ui, sans-serif',
              x: 0,
              y: -16,
            },
          },
          {
            type: 'text',
            style: {
              text: centerLabel.toUpperCase(),
              textAlign: 'center' as const,
              fill: '#94a3b8',
              fontSize: 10,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: 2,
              x: 0,
              y: 14,
            },
          },
        ],
      });
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item' as const,
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
        formatter: (params: any) => {
          const col =
            colors[data.findIndex((d) => d.x === params.name) % colors.length] ||
            params.color;
          const { r, g, b } = hexToRgb(col);
          return [
            `<div style="font-family:Inter,sans-serif;min-width:180px">`,
            `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(148,163,184,0.12)">`,
            `<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:linear-gradient(135deg,${col},rgba(${r},${g},${b},0.6))"></span>`,
            `<span style="color:#e2e8f0;font-size:14px;font-weight:600">${params.name}</span>`,
            `</div>`,
            `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px">`,
            `<div><div style="font-weight:800;font-size:24px;color:#f8fafc;letter-spacing:-0.02em">${Number(params.value).toLocaleString('en-IN')}</div>`,
            `<div style="color:#64748b;font-size:11px;margin-top:4px">count</div></div>`,
            `<div style="text-align:right"><div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,${col},rgba(${r},${g},${b},0.6));-webkit-background-clip:text;-webkit-text-fill-color:transparent">${params.percent?.toFixed(1)}%</div>`,
            `<div style="color:#64748b;font-size:11px;margin-top:4px">share</div></div>`,
            `</div></div>`,
          ].join('');
        },
      },
      series: [
        /* Background ring for depth effect */
        {
          type: 'pie',
          radius: [`${bgRingInner}%`, `${bgRingOuter}%`],
          center: ['50%', '50%'],
          silent: true,
          animation: false,
          label: { show: false },
          data: [{ value: 1, itemStyle: { color: 'rgba(241,245,249,0.5)' } }],
          itemStyle: { borderWidth: 0 },
        },
        /* Main donut */
        {
          type: 'pie',
          radius: [`${innerPct}%`, `${outerPct}%`],
          center: ['50%', '50%'],
          padAngle: 3,
          itemStyle: {
            borderRadius: 12,
            borderColor: 'rgba(255,255,255,0.9)',
            borderWidth: 3,
          },
          data: data.map((d, i) => {
            const col = colors[i % colors.length];
            const { r, g, b } = hexToRgb(col);
            return {
              name: d.x,
              value: d.y,
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 1, y2: 1,
                  colorStops: [
                    { offset: 0, color: col },
                    { offset: 1, color: `rgba(${r},${g},${b},0.7)` },
                  ],
                },
              },
            };
          }),
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 28,
              shadowOffsetX: 0,
              shadowOffsetY: 4,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
          },
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 80 + 100,
        },
      ],
      graphic: graphicItems,
      animation: animate,
      animationDuration: 1400,
    };
  }, [data, colors, height, innerRadius, animate, centerLabel, centerValue]);

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
