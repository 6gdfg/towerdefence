import type { Position } from '../types/game';

export function getRangeDisplayKind(pos: Position, range: number, width: number, height: number): 'none' | 'full' | 'circle' {
  if (!(range > 0) || !Number.isFinite(range) || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)
    || !(width > 0) || !(height > 0)) return 'none';
  const nearX = Math.max(0, Math.min(width, pos.x));
  const nearY = Math.max(0, Math.min(height, pos.y));
  if (Math.hypot(pos.x - nearX, pos.y - nearY) > range) return 'none';
  const farX = Math.max(Math.abs(pos.x), Math.abs(width - pos.x));
  const farY = Math.max(Math.abs(pos.y), Math.abs(height - pos.y));
  return range >= Math.hypot(farX, farY) ? 'full' : 'circle';
}
