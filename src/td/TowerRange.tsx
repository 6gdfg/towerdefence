import { useId } from 'react';
import { CELL_SIZE } from '../config/mapConfig';
import type { Position } from '../types/game';
import { getRangeDisplayKind } from './rangeDisplay';

type Props = { pos: Position; range: number; mapWidth: number; mapHeight: number; fill: string; stroke: string };

export default function TowerRange({ pos, range, mapWidth, mapHeight, fill, stroke }: Props) {
  const clipId = useId();
  const kind = getRangeDisplayKind(pos, range, mapWidth, mapHeight);
  const width = mapWidth * CELL_SIZE;
  const height = mapHeight * CELL_SIZE;
  if (kind === 'none') return null;
  // A full-map radius has no visible edge; never submit its huge geometry to SVG.
  if (kind === 'full') return fill === 'none' ? null : (
    <rect className="tower-range-fill" width={width} height={height} fill={fill} pointerEvents="none" />
  );
  return (
    <g className="tower-range" pointerEvents="none" clipPath={`url(#${clipId})`}>
      <defs><clipPath id={clipId}><rect width={width} height={height} /></clipPath></defs>
      <circle cx={pos.x * CELL_SIZE} cy={pos.y * CELL_SIZE} r={range * CELL_SIZE}
        fill={fill} stroke={stroke} strokeWidth={1} strokeDasharray="4 4" />
    </g>
  );
}
