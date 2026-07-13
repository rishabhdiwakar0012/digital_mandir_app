'use client';

import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
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

export function Sparkline({ data, color = '#ea580c', height = 48, width = 100 }: SparklineProps) {
  const option = useMemo(() => {
    if (data.length < 2) return null;
    const { r, g, b } = hexToRgb(color);
    const isUp = data[data.length - 1] >= data[0];
    const lineColor = isUp ? color : '#f87171';
    const { r: lr, g: lg, b: lb } = isUp ? { r, g, b } : { r: 248, g: 113, b: 113 };

    return {
      grid: { top: 4, bottom: 4, left: 2, right: 2 },
      xAxis: {
        type: 'category' as const,
        show: false,
        data: data.map((_, i) => i),
        boundaryGap: false,
      },
      yAxis: { type: 'value' as const, show: false },
      series: [
        {
          type: 'line',
          data,
          smooth: 0.45,
          symbolSize: 0,
          lineStyle: {
            color: lineColor,
            width: 2,
            shadowBlur: 6,
            shadowColor: `rgba(${lr},${lg},${lb},0.3)`,
            shadowOffsetY: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(${lr},${lg},${lb},0.25)` },
                { offset: 0.6, color: `rgba(${lr},${lg},${lb},0.06)` },
                { offset: 1, color: `rgba(${lr},${lg},${lb},0)` },
              ],
            },
          },
        },
      ],
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
    };
  }, [data, color]);

  if (!option) return null;

  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  );
}
