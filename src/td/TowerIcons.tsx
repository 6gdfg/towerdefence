import type { CSSProperties } from 'react';
import type { ElementType, PlantType } from './types';

type PlantIconProps = {
  type: PlantType;
  color?: string;
  size?: number;
  style?: CSSProperties;
};

type ElementIconProps = {
  element?: ElementType;
  color: string;
  size?: number;
  style?: CSSProperties;
};

const DEFAULT_ICON_COLOR = '#9ca3af';
const STROKE_WIDTH = 2.2;

export function PlantIcon({ type, color = DEFAULT_ICON_COLOR, size = 28, style }: PlantIconProps) {
  const stroke = color;

  switch (type) {
    case 'sunflower':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <circle cx="12" cy="12" r="3.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.8} />
        </svg>
      );
    case 'bottleGrass':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="2" ry="2" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
        </svg>
      );
    case 'puffShroom':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" ry="1.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
        </svg>
      );
    case 'fourLeafClover':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="9" cy="8" r="4" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <circle cx="15" cy="8" r="4" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <circle cx="9" cy="16" r="4" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <circle cx="15" cy="16" r="4" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
        </svg>
      );
    case 'machineGun':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 4 4 20 20 20" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
        </svg>
      );
    case 'rocket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 3 21 12 12 21 3 12" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
          <line x1="12" y1="3" x2="12" y2="8.5" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.8} />
          <line x1="12" y1="21" x2="12" y2="17" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.8} />
        </svg>
      );
    case 'sunlightFlower':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.9} rx="1" ry="1" />
        </svg>
      );
    case 'hotPepper':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <path d="M12 3 C17 7 19 11 18 15.5 C17.3 19 14.8 21 12 21 C9.2 21 6.7 19 6 15.5 C5 11 7 7 12 3 Z" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
          <path d="M12 6 L9.5 13 H12.2 L10.8 18 L15 10.8 H12.4 L12 6 Z" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.72} strokeLinejoin="round" />
        </svg>
      );
    case 'frostBlastShroom':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <path d="M12 4 V20 M4 12 H20 M6.4 6.4 L17.6 17.6 M17.6 6.4 L6.4 17.6" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.75} strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.7} />
        </svg>
      );
    case 'cycloneShroom':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <path d="M16.8 8.2 C14 5.9 8.6 6.9 8 11 C7.5 14.4 11.5 15.8 14.3 14.1 C16.6 12.7 15.6 10.1 13.1 10.2" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.82} strokeLinecap="round" />
          <path d="M7.2 16.2 C10 18.5 15.4 17.5 16 13.4" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.72} strokeLinecap="round" />
        </svg>
      );
    case 'magnetNeedle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <path d="M7 5 V12 C7 15.3 9.1 18 12 18 C14.9 18 17 15.3 17 12 V5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          <line x1="7" y1="5" x2="10" y2="5" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          <line x1="14" y1="5" x2="17" y2="5" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
          <line x1="12" y1="9" x2="12" y2="21" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.75} strokeLinecap="round" />
          <path d="M10 17 L12 21 L14 17" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.75} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case 'sniper':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 4 20 12 12 20 4 12" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
          <line x1="12" y1="4" x2="12" y2="20" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.6} />
          <line x1="4" y1="12" x2="20" y2="12" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.6} />
        </svg>
      );
  }
}

export function ElementIcon({ color, size = 28, style }: ElementIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <polygon points="12 2 22 12 12 22 2 12" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} />
    </svg>
  );
}
