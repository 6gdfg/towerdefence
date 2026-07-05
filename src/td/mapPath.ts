import type { Position } from '../types/game';

export type MapPath = Position[] | Position[][];

export function isMultiPath(path: MapPath): path is Position[][] {
  return Array.isArray(path[0]);
}

export function normalizeMapPaths(path: MapPath): Position[][] {
  return isMultiPath(path) ? path : [path];
}

export function countMapPaths(map: { path: MapPath } | null | undefined): number {
  if (!map) return 1;
  return isMultiPath(map.path) ? map.path.length : 1;
}
