import type { Position } from '../types/game';
import { normalizeMapPaths, type MapPath } from './mapPath';

export interface MapSpec {
  id: number;
  name: string;
  desc?: string;
  size: { w: number; h: number };
  roadWidthCells: number;
  path: MapPath;
  plantGrid?: Position[];
}

type GridPoint = readonly [number, number];
type GridPath = readonly GridPoint[];
type GridMapDef = {
  id: number;
  name: string;
  desc?: string;
  size?: { w: number; h: number };
  roadWidthCells?: number;
  path: GridPath | readonly GridPath[];
};

const DEFAULT_MAP_SIZE = { w: 40, h: 20 } as const;
const DEFAULT_ROAD_WIDTH_CELLS = 2;
const PLANT_ROAD_PADDING_CELLS = 1;
export const SPIRAL_MAP_ID = 1000;

function keyOf(col: number, row: number): string {
  return `${col},${row}`;
}

function toCenter([col, row]: GridPoint): Position {
  return { x: col + 0.5, y: row + 0.5 };
}

function isGridPathList(path: GridPath | readonly GridPath[]): path is readonly GridPath[] {
  const first = path[0];
  return Array.isArray(first) && Array.isArray(first[0]);
}

function normalizeGridPaths(path: GridPath | readonly GridPath[]): readonly GridPath[] {
  return isGridPathList(path) ? path : [path];
}

function toMapPath(path: GridPath | readonly GridPath[]): MapPath {
  const paths = normalizeGridPaths(path).map(singlePath => singlePath.map(toCenter));
  return paths.length === 1 ? paths[0] : paths;
}

function toCellPoint(point: Position): { col: number; row: number } {
  return {
    col: Math.round(point.x - 0.5),
    row: Math.round(point.y - 0.5),
  };
}

function isCellCenter(point: Position): boolean {
  const col = point.x - 0.5;
  const row = point.y - 0.5;
  return Number.isInteger(col) && Number.isInteger(row);
}

function expandSegmentCells(a: Position, b: Position): string[] {
  const start = toCellPoint(a);
  const end = toCellPoint(b);
  const cells: string[] = [];

  if (start.col === end.col) {
    const from = Math.min(start.row, end.row);
    const to = Math.max(start.row, end.row);
    for (let row = from; row <= to; row++) {
      cells.push(keyOf(start.col, row));
    }
    return cells;
  }

  if (start.row === end.row) {
    const from = Math.min(start.col, end.col);
    const to = Math.max(start.col, end.col);
    for (let col = from; col <= to; col++) {
      cells.push(keyOf(col, start.row));
    }
    return cells;
  }

  throw new Error(`Map path segment must be horizontal or vertical: (${a.x},${a.y}) -> (${b.x},${b.y})`);
}

function collectRoadCells(map: MapSpec): Set<string> {
  const cells = new Set<string>();

  for (const path of normalizeMapPaths(map.path)) {
    for (let i = 0; i < path.length - 1; i++) {
      for (const key of expandSegmentCells(path[i], path[i + 1])) {
        cells.add(key);
      }
    }
  }

  return cells;
}

function collectBlockedPlantCells(map: MapSpec): Set<string> {
  const roadCells = collectRoadCells(map);
  const blocked = new Set<string>();

  for (const key of roadCells) {
    const [colText, rowText] = key.split(',');
    const col = Number(colText);
    const row = Number(rowText);
    for (let dy = -PLANT_ROAD_PADDING_CELLS; dy <= PLANT_ROAD_PADDING_CELLS; dy++) {
      for (let dx = -PLANT_ROAD_PADDING_CELLS; dx <= PLANT_ROAD_PADDING_CELLS; dx++) {
        blocked.add(keyOf(col + dx, row + dy));
      }
    }
  }

  return blocked;
}

export function generatePlantGrid(map: MapSpec): Position[] {
  const blocked = collectBlockedPlantCells(map);
  const grid: Position[] = [];

  for (let row = 1; row < map.size.h - 1; row++) {
    for (let col = 1; col < map.size.w - 1; col++) {
      if (blocked.has(keyOf(col, row))) continue;
      grid.push(toCenter([col, row]));
    }
  }

  return grid;
}

export function getPlantGrid(map: MapSpec): Position[] {
  return map.plantGrid ?? generatePlantGrid(map);
}

function distancePointToSegment(point: Position, start: Position, end: Position): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const projection = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const closestX = start.x + dx * projection;
  const closestY = start.y + dy * projection;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function isPositionCoveredByRoad(map: MapSpec, position: Position): boolean {
  const halfRoadWidth = map.roadWidthCells / 2;
  return normalizeMapPaths(map.path).some(path => (
    path.slice(0, -1).some((point, index) => (
      distancePointToSegment(position, point, path[index + 1]) <= halfRoadWidth + 1e-6
    ))
  ));
}

function createMap(def: GridMapDef): MapSpec {
  const map: MapSpec = {
    id: def.id,
    name: def.name,
    desc: def.desc,
    size: def.size ?? DEFAULT_MAP_SIZE,
    roadWidthCells: def.roadWidthCells ?? DEFAULT_ROAD_WIDTH_CELLS,
    path: toMapPath(def.path),
  };

  map.plantGrid = generatePlantGrid(map);
  return map;
}

function validateMap(map: MapSpec): void {
  if (!Number.isInteger(map.id)) {
    throw new Error(`Map id must be an integer: ${map.name}`);
  }
  if (!Number.isInteger(map.size.w) || !Number.isInteger(map.size.h) || map.size.w < 8 || map.size.h < 8) {
    throw new Error(`Map ${map.id} has an invalid size`);
  }
  if (!Number.isInteger(map.roadWidthCells) || map.roadWidthCells < 1) {
    throw new Error(`Map ${map.id} has an invalid road width`);
  }

  const margin = Math.max(1, Math.ceil(map.roadWidthCells / 2));
  const paths = normalizeMapPaths(map.path);
  if (paths.length === 0) {
    throw new Error(`Map ${map.id} has no path`);
  }

  for (const [pathIndex, path] of paths.entries()) {
    if (path.length < 2) {
      throw new Error(`Map ${map.id} path ${pathIndex} must contain at least two points`);
    }

    for (const point of path) {
      if (!isCellCenter(point)) {
        throw new Error(`Map ${map.id} path ${pathIndex} has a non-center point: (${point.x},${point.y})`);
      }

      const { col, row } = toCellPoint(point);
      if (col < margin || row < margin || col >= map.size.w - margin || row >= map.size.h - margin) {
        throw new Error(`Map ${map.id} path ${pathIndex} point is too close to the edge: (${col},${row})`);
      }
    }

    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      if (a.x === b.x && a.y === b.y) {
        throw new Error(`Map ${map.id} path ${pathIndex} has a zero-length segment at index ${i}`);
      }
      if (a.x !== b.x && a.y !== b.y) {
        throw new Error(`Map ${map.id} path ${pathIndex} has a diagonal segment at index ${i}`);
      }
    }
  }

  const plantGrid = getPlantGrid(map);
  if (plantGrid.length === 0) {
    throw new Error(`Map ${map.id} has no plant cells`);
  }

  const blocked = collectBlockedPlantCells(map);
  for (const point of plantGrid) {
    if (!isCellCenter(point)) {
      throw new Error(`Map ${map.id} has a non-center plant cell: (${point.x},${point.y})`);
    }
    const { col, row } = toCellPoint(point);
    if (col < 0 || row < 0 || col >= map.size.w || row >= map.size.h) {
      throw new Error(`Map ${map.id} has an out-of-bounds plant cell: (${col},${row})`);
    }
    if (blocked.has(keyOf(col, row))) {
      throw new Error(`Map ${map.id} has a plant cell too close to the road: (${col},${row})`);
    }
  }
}

function validateMaps(maps: readonly MapSpec[]): void {
  const ids = new Set<number>();

  for (const map of maps) {
    if (ids.has(map.id)) {
      throw new Error(`Duplicate map id: ${map.id}`);
    }
    ids.add(map.id);
    validateMap(map);
  }
}

export const MAPS: MapSpec[] = [
  createMap({
    id: 1,
    name: '新手折线',
    desc: '横向基础折线，适合确认放置和行进对齐',
    path: [[2, 16], [10, 16], [10, 12], [20, 12], [20, 8], [31, 8], [31, 4], [37, 4]],
  }),
  createMap({
    id: 2,
    name: '双弯小道',
    desc: '两段宽回折，给中距离塔留出空间',
    path: [[2, 15], [8, 15], [8, 5], [17, 5], [17, 17], [27, 17], [27, 7], [37, 7]],
  }),
  createMap({
    id: 3,
    name: '长廊回折',
    desc: '长横道和竖道交替，路线清晰不交叉',
    path: [[2, 10], [8, 10], [8, 3], [18, 3], [18, 17], [29, 17], [29, 6], [37, 6]],
  }),
  createMap({
    id: 4,
    name: '中心回廊',
    desc: '主路围绕中部来回推进',
    path: [[2, 17], [15, 17], [15, 13], [7, 13], [7, 8], [22, 8], [22, 4], [36, 4]],
  }),
  createMap({
    id: 5,
    name: '外圈绕行',
    desc: '外圈长路后切回内侧，避免斜线和自由曲线',
    path: [[2, 18], [2, 3], [13, 3], [13, 16], [25, 16], [25, 6], [37, 6]],
  }),
  createMap({
    id: 6,
    name: '内外穿插',
    desc: '左右穿插但不自交，适合测试索敌范围',
    path: [[2, 5], [13, 5], [13, 18], [23, 18], [23, 10], [32, 10], [32, 4], [37, 4]],
  }),
  createMap({
    id: 7,
    name: '左右蛇形',
    desc: '规整蛇形长路，所有弯点都落在格子中心',
    path: [[2, 3], [37, 3], [37, 7], [4, 7], [4, 11], [36, 11], [36, 15], [3, 15], [3, 18], [37, 18]],
  }),
  createMap({
    id: 8,
    name: '上路压迫',
    desc: '后半段靠上推进，保留下方建设空间',
    path: [[2, 6], [12, 6], [12, 3], [26, 3], [26, 9], [36, 9], [36, 15], [22, 15], [22, 18], [37, 18]],
  }),
  createMap({
    id: 9,
    name: '下路绕行',
    desc: '下半区多次折返，终点从左上收束',
    path: [[2, 17], [12, 17], [12, 18], [26, 18], [26, 13], [7, 13], [7, 6], [20, 6], [20, 3], [37, 3]],
  }),
  createMap({
    id: 10,
    name: '交错回环',
    desc: '多段交错回环，但路径本身不交叉',
    path: [[2, 18], [11, 18], [11, 4], [23, 4], [23, 16], [34, 16], [34, 7], [15, 7], [15, 12], [37, 12]],
  }),
  createMap({
    id: 11,
    name: '双入口合流',
    desc: '两条入口在中段合流，用来稳定测试多路径',
    path: [
      [[2, 5], [12, 5], [12, 10], [21, 10], [21, 15], [37, 15]],
      [[2, 18], [12, 18], [12, 13], [21, 13], [21, 15], [37, 15]],
    ],
  }),
  createMap({
    id: 12,
    name: '双线并进',
    desc: '两条独立路线并进，终点分离但坐标规则一致',
    path: [
      [[2, 5], [10, 5], [10, 15], [19, 15], [19, 8], [37, 8]],
      [[2, 18], [14, 18], [14, 11], [25, 11], [25, 4], [37, 4]],
    ],
  }),
  createMap({
    id: 13,
    name: '三线并行',
    desc: '三条等距笔直道路并排推进，每条路线独立通向终点',
    path: [
      [[2, 4], [37, 4]],
      [[2, 10], [37, 10]],
      [[2, 16], [37, 16]],
    ],
  }),
  createMap({
    id: 14,
    name: '四线并行',
    desc: '四条等距笔直道路并排推进，上下边界保留建设空间',
    size: { w: 40, h: 24 },
    path: [
      [[2, 4], [37, 4]],
      [[2, 9], [37, 9]],
      [[2, 14], [37, 14]],
      [[2, 19], [37, 19]],
    ],
  }),
  createMap({
    id: 15,
    name: '五线并行',
    desc: '五条等距笔直道路并排推进，入口多且防线压力分散',
    size: { w: 40, h: 28 },
    path: [
      [[2, 4], [37, 4]],
      [[2, 9], [37, 9]],
      [[2, 14], [37, 14]],
      [[2, 19], [37, 19]],
      [[2, 24], [37, 24]],
    ],
  }),
  createMap({
    id: 16,
    name: '一横两弯',
    desc: '上方横路配合下方左右双弯入口，两个下路入口汇向中部偏下房子',
    path: [
      [[2, 4], [37, 4]],
      [[3, 18], [3, 10], [20, 10]],
      [[36, 18], [36, 10], [20, 10]],
    ],
  }),
  createMap({
    id: 17,
    name: 'H',
    desc: '四个入口沿左右竖线汇入中央横梁，最终通向中间房子',
    path: [
      [[5, 3], [5, 10], [20, 10]],
      [[5, 17], [5, 10], [20, 10]],
      [[34, 3], [34, 10], [20, 10]],
      [[34, 17], [34, 10], [20, 10]],
    ],
  }),
  createMap({
    id: SPIRAL_MAP_ID,
    name: '训练回环',
    desc: '无尽和测试模式使用的稳定长路线',
    size: { w: 44, h: 22 },
    path: [[2, 4], [41, 4], [41, 8], [3, 8], [3, 12], [39, 12], [39, 16], [5, 16], [5, 20], [41, 20]],
  }),
];

validateMaps(MAPS);
