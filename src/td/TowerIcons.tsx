import type { CSSProperties } from 'react';
import type { ElementType, PlantType, ShapeType } from './types';

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

type MonsterIconProps = {
  type: ShapeType;
  color?: string;
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
    case 'doubleBottleGrass':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="4" y="5" width="8" height="14" rx="1.5" ry="1.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <rect x="12" y="5" width="8" height="14" rx="1.5" ry="1.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
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
    case 'pentagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 2.8 14.7 8.5 21 9.3 16.3 13.6 17.5 20 12 16.8 6.5 20 7.7 13.6 3 9.3 9.3 8.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
          <polygon points="12 8.2 15.6 10.8 14.2 15 9.8 15 8.4 10.8" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.58} strokeLinejoin="round" />
        </svg>
      );
    case 'pumpkinHead':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <path d="M12 6 C17.5 6 20.5 9 20.5 14 C20.5 18.2 17.4 20 12 20 C6.6 20 3.5 18.2 3.5 14 C3.5 9 6.5 6 12 6 Z" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
          <path d="M12 6 C9.8 8.8 9.8 17.2 12 20 M12 6 C14.2 8.8 14.2 17.2 12 20 M12 6 V3.5 L15 3" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.68} strokeLinecap="round" />
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
    case 'holyFlower':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <path d="M12 3.5 V7 M12 17 V20.5 M3.5 12 H7 M17 12 H20.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.75} strokeLinecap="round" />
          <path d="M12 8.2 L13.2 10.8 L15.8 12 L13.2 13.2 L12 15.8 L10.8 13.2 L8.2 12 L10.8 10.8 Z" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.7} strokeLinejoin="round" />
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
    case 'electricFlower':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH} />
          <path d="M12 4 L9.2 11.2 H12.5 L10.7 20 L16 9.4 H12.8 L12 4 Z" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.8} strokeLinejoin="round" />
          <path d="M5.5 15.8 C8.2 18.6 15.8 18.6 18.5 15.8" fill="none" stroke={stroke} strokeWidth={STROKE_WIDTH * 0.65} strokeLinecap="round" />
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

export function ShovelIcon({ color = DEFAULT_ICON_COLOR, size = 28, style }: { color?: string; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path d="M7 5 L19 17" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <path d="M4.5 7.5 L7.5 4.5 C8.4 3.6 9.8 3.6 10.7 4.5 L12.2 6 L6 12.2 L4.5 10.7 C3.6 9.8 3.6 8.4 4.5 7.5 Z" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M16.5 16.5 L20 20" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <path d="M17.2 20.8 L20.8 17.2" fill="none" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </svg>
  );
}

export function MonsterIcon({ type, color = '#475569', size = 28, style }: MonsterIconProps) {
  const stroke = color;
  const strokeWidth = STROKE_WIDTH;

  switch (type) {
    case 'triangle':
    case 'healer':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 3 3 21 21 21" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          {type === 'healer' && <path d="M12 9 V16 M8.5 12.5 H15.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />}
        </svg>
      );
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={3} ry={3} />
        </svg>
      );
    case 'armored':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="16" fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={3} ry={3} />
          <path d="M7 8 H17 M7 12 H17 M7 16 H17 M12 4.5 V20.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.62} strokeLinecap="round" />
        </svg>
      );
    case 'angryWriter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <polygon points="12 6 6.2 17.5 17.8 17.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.72} strokeLinejoin="round" />
        </svg>
      );
    case 'bunker':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 3 14.6 8.7 20.8 9.4 16.2 13.6 17.4 19.7 12 16.6 6.6 19.7 7.8 13.6 3.2 9.4 9.4 8.7" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </svg>
      );
    case 'evilSniper':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <polygon points="12 2 22 12 12 22 2 12" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <line x1="12" y1="2" x2="12" y2="22" stroke={stroke} strokeWidth={strokeWidth * 0.6} />
          <line x1="2" y1="12" x2="22" y2="12" stroke={stroke} strokeWidth={strokeWidth * 0.6} />
        </svg>
      );
    case 'rager':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="12" cy="12" r="4" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
        </svg>
      );
    case 'igniter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M12 5 C15.2 8.1 16.6 11.1 15.6 14.3 C14.9 16.5 13.3 18 12 18 C10.7 18 9.1 16.5 8.4 14.3 C7.4 11.1 8.8 8.1 12 5 Z" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.72} strokeLinejoin="round" />
        </svg>
      );
    case 'summoner':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" fill="none" stroke={stroke} strokeWidth={strokeWidth} rx={2} ry={2} />
          <circle cx="12" cy="12" r="7" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
        </svg>
      );
    case 'iceShell':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M6 12 C8.2 8 15.8 8 18 12 C15.8 16 8.2 16 6 12 Z" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.75} strokeLinejoin="round" />
          <path d="M12 3.5 V7 M12 17 V20.5 M3.5 12 H7 M17 12 H20.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.6} strokeLinecap="round" />
        </svg>
      );
    case 'freezer':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M12 5 V19 M5.9 8.5 L18.1 15.5 M5.9 15.5 L18.1 8.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.72} strokeLinecap="round" />
        </svg>
      );
    case 'taunter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M12 6.5 V13.5" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.1" fill={stroke} />
        </svg>
      );
    case 'purifier':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="12" cy="12" r="5.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.7} />
          <path d="M12 7.5 V16.5 M7.5 12 H16.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.82} strokeLinecap="round" />
        </svg>
      );
    case 'circle':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
  }
}
