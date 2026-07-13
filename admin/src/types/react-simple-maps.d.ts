declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    style?: React.CSSProperties;
    height?: number;
    width?: number;
    children?: React.ReactNode;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface ZoomableGroupProps {
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps {
    key?: string;
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (evt: React.MouseEvent<SVGPathElement>) => void;
    onMouseMove?: (evt: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (evt: React.MouseEvent<SVGPathElement>) => void;
    onClick?: (evt: React.MouseEvent<SVGPathElement>) => void;
    [key: string]: unknown;
  }
  export const Geography: React.FC<GeographyProps>;
}
