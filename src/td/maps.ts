import { Position } from '../types/game';

export interface MapSpec {
  id: number;
  name: string;
  desc?: string;
  size: { w: number; h: number };
  roadWidthCells: number;
  path: Position[] | Position[][];
  plantGrid?: Position[];
}

const DEFAULT_MAP_WIDTH = 24;
const DEFAULT_MAP_HEIGHT = 40;

// 字母模板的原始设计尺寸和布局参数
const LETTER_TEMPLATE_WIDTH = 10; // 每个字母占据的区域宽度（包含字母本身+内部padding）
const LETTER_TEMPLATE_HEIGHT = 36; // 地图高度（增加上下padding，确保y:2-30的字母完整显示）
const LETTER_SPACING = 1; // 字母区域之间的间距
const LETTER_VERTICAL_OFFSET = 2; // 字母在垂直方向的偏移（增加顶部空间）

// 字母路径配置：需要反转的字母（从下往上出怪，单路径）
const REVERSED_LETTERS = new Set(['B', 'E', 'F', 'L']);

// 字母路径配置：多路径字母（分兵）
const MULTI_PATH_LETTERS: Record<string, Position[][]> = {
  'A': [
    // 路径1：顶部尖点→中间横杠→左下
    [{ x: 4, y: 2 }, { x: 3, y: 14 }, { x: 2, y: 30 }],
    // 路径2：顶部尖点→中间横杠→右下
    [{ x: 4, y: 2 }, { x: 3, y: 14 }, { x: 6, y: 30 }],
  ],
  'H': [
    // 路径1：左上→沿左竖线到中间横杠（家）
    [{ x: 2, y: 2 }, { x: 2, y: 16 }, { x: 4, y: 16 }],
    // 路径2：左下→沿左竖线到中间横杠（家）
    [{ x: 2, y: 30 }, { x: 2, y: 16 }, { x: 4, y: 16 }],
    // 路径3：右上→沿右竖线到中间横杠（家）
    [{ x: 6, y: 2 }, { x: 6, y: 16 }, { x: 4, y: 16 }],
    // 路径4：右下→沿右竖线到中间横杠（家）
    [{ x: 6, y: 30 }, { x: 6, y: 16 }, { x: 4, y: 16 }],
  ],
  'M': [
    // 路径1：左下→左峰→中间谷
    [{ x: 2, y: 30 }, { x: 2, y: 2 }, { x: 4, y: 10 }],
    // 路径2：右下→右峰→中间谷
    [{ x: 6, y: 30 }, { x: 6, y: 2 }, { x: 4, y: 10 }],
  ],
  'P': [
    // 路径1：底部到顶部左侧经过圆弧左侧
    [{ x: 2, y: 30 }, { x: 2, y: 12 }, { x: 5, y: 5 }, { x: 2, y: 2 }],
    // 路径2：底部中间到圆弧右侧再到顶部
    [{ x: 3, y: 30 }, { x: 5, y: 20 }, { x: 5, y: 5 }, { x: 3, y: 2 }],
  ],
  'Q': [
    // 路径1：顶部→左侧→底部→右侧→右下汇合点→尾巴底部（家）
    [{ x: 4, y: 2 }, { x: 2, y: 8 }, { x: 2, y: 24 }, { x: 4, y: 30 }, { x: 6, y: 24 }, { x: 6.5, y: 26 }, { x: 7, y: 30 }],
    // 路径2：顶部→右侧→右下汇合点→尾巴底部（家）
    [{ x: 4, y: 2 }, { x: 6, y: 8 }, { x: 6, y: 24 }, { x: 6.5, y: 26 }, { x: 7, y: 30 }],
  ],
  'R': [
    // 路径1：左下→沿左竖线→经过半圆弯道→顶部家
    [{ x: 2, y: 30 }, { x: 2, y: 12 }, { x: 5, y: 5 }, { x: 2, y: 2 }],
    // 路径2：右下→沿斜线到中间→沿左竖线→顶部家
    [{ x: 6, y: 30 }, { x: 2, y: 14 }, { x: 2, y: 2 }],
  ],
  'T': [
    // 路径1：底部→顶部中心→沿横杠到左端（家1）
    [{ x: 4, y: 30 }, { x: 4, y: 4 }, { x: 4, y: 2 }, { x: 2, y: 2 }],
    // 路径2：底部→顶部中心→沿横杠到右端（家2）
    [{ x: 4, y: 30 }, { x: 4, y: 4 }, { x: 4, y: 2 }, { x: 6, y: 2 }],
  ],
  'U': [
    // 路径1：左上到底部
    [{ x: 2, y: 2 }, { x: 2, y: 24 }, { x: 4, y: 30 }],
    // 路径2：右上到底部
    [{ x: 6, y: 2 }, { x: 6, y: 24 }, { x: 4, y: 30 }],
  ],
  'V': [
    // 路径1：左上到底部中心
    [{ x: 2, y: 2 }, { x: 4, y: 22 }, { x: 4, y: 30 }],
    // 路径2：右上到底部中心
    [{ x: 6, y: 2 }, { x: 4, y: 22 }, { x: 4, y: 30 }],
  ],
  'W': [
    // 路径1：左上→左谷→中间峰
    [{ x: 2, y: 2 }, { x: 2, y: 22 }, { x: 4, y: 16 }],
    // 路径2：右上→右谷→中间峰
    [{ x: 6, y: 2 }, { x: 6, y: 22 }, { x: 4, y: 16 }],
  ],
  'X': [
    // 路径1：左上到右下
    [{ x: 2, y: 2 }, { x: 6, y: 30 }],
    // 路径2：右上到左下  
    [{ x: 6, y: 2 }, { x: 2, y: 30 }],
  ],
  'Y': [
    // 路径1：左上→沿左斜边→汇合点→底部
    [{ x: 2, y: 2 }, { x: 3, y: 8 }, { x: 4, y: 14 }, { x: 4, y: 30 }],
    // 路径2：右上→沿右斜边→汇合点→底部
    [{ x: 6, y: 2 }, { x: 5, y: 8 }, { x: 4, y: 14 }, { x: 4, y: 30 }],
  ],
};

const LETTER_TEMPLATES: Record<string, Position[]> = {
  'A': [
    // 默认路径（备用）
    { x: 4, y: 2 }, { x: 3, y: 14 }, { x: 2, y: 30 },
  ],
  'B': [
    { x: 2, y: 2 }, { x: 5, y: 5 }, { x: 2, y: 12 }, { x: 5, y: 20 }, { x: 2, y: 30 },
  ],
  'C': [
    { x: 6, y: 4 }, { x: 3, y: 2 }, { x: 2, y: 8 }, { x: 2, y: 24 }, { x: 3, y: 30 }, { x: 6, y: 28 },
  ],
  'D': [
    { x: 2, y: 2 }, { x: 6, y: 6 }, { x: 6, y: 24 }, { x: 2, y: 30 },
  ],
  'E': [
    { x: 2, y: 2 }, { x: 2, y: 30 }, { x: 6, y: 30 }, { x: 2, y: 30 }, { x: 2, y: 16 }, { x: 5, y: 16 }, { x: 2, y: 16 }, { x: 2, y: 2 }, { x: 6, y: 2 },
  ],
  'F': [
    { x: 2, y: 2 }, { x: 2, y: 30 }, { x: 2, y: 16 }, { x: 5, y: 16 }, { x: 2, y: 16 }, { x: 2, y: 2 }, { x: 6, y: 2 },
  ],
  'G': [
    { x: 6, y: 4 }, { x: 3, y: 2 }, { x: 2, y: 8 }, { x: 2, y: 24 }, { x: 6, y: 28 }, { x: 6, y: 20 }, { x: 4, y: 20 },
  ],
  'H': [
    // 默认路径（备用）
    { x: 2, y: 30 }, { x: 2, y: 2 },
  ],
  'I': [
    { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 30 }, { x: 2, y: 30 }, { x: 6, y: 30 },
  ],
  'J': [
    { x: 6, y: 2 }, { x: 6, y: 24 }, { x: 4, y: 30 }, { x: 2, y: 24 },
  ],
  'K': [
    { x: 2, y: 2 }, { x: 2, y: 30 }, { x: 2, y: 16 }, { x: 6, y: 2 }, { x: 2, y: 16 }, { x: 6, y: 30 },
  ],
  'L': [
    { x: 2, y: 2 }, { x: 2, y: 30 }, { x: 6, y: 30 },
  ],
  'M': [
    // 默认路径（备用）
    { x: 2, y: 30 }, { x: 2, y: 2 }, { x: 4, y: 10 },
  ],
  'N': [
    { x: 2, y: 2 }, { x: 2, y: 22 }, { x: 6, y: 10 }, { x: 6, y: 30 },
  ],
  'O': [
    { x: 4, y: 2 }, { x: 2, y: 8 }, { x: 2, y: 24 }, { x: 4, y: 30 }, { x: 6, y: 24 }, { x: 6, y: 8 }, { x: 4, y: 2 },
  ],
  'P': [
    // 默认路径（备用）
    { x: 2, y: 30 }, { x: 2, y: 12 }, { x: 5, y: 5 }, { x: 2, y: 2 },
  ],
  'Q': [
    // 默认路径（如果没有使用多路径配置）
    { x: 4, y: 2 }, { x: 2, y: 8 }, { x: 2, y: 24 }, { x: 4, y: 30 }, { x: 6, y: 24 }, { x: 6, y: 8 }, { x: 4, y: 2 },
  ],
  'R': [
    // 默认路径（备用）
    { x: 2, y: 30 }, { x: 2, y: 12 }, { x: 5, y: 5 }, { x: 2, y: 2 },
  ],
  'S': [
    { x: 6, y: 2 }, { x: 2, y: 8 }, { x: 6, y: 16 }, { x: 2, y: 24 }, { x: 6, y: 30 },
  ],
  'T': [
    // 默认路径（备用）
    { x: 4, y: 30 }, { x: 4, y: 4 }, { x: 4, y: 2 }, { x: 2, y: 2 },
  ],
  'U': [
    // 默认路径（备用）
    { x: 2, y: 2 }, { x: 2, y: 24 }, { x: 4, y: 30 },
  ],
  'V': [
    // 默认路径（备用）
    { x: 2, y: 2 }, { x: 4, y: 22 }, { x: 4, y: 30 },
  ],
  'W': [
    // 默认路径（备用）
    { x: 2, y: 2 }, { x: 2, y: 22 }, { x: 4, y: 16 },
  ],
  'X': [
    // 默认路径（如果没有使用多路径配置）
    { x: 2, y: 2 }, { x: 4, y: 16 }, { x: 6, y: 30 },
  ],
  'Y': [
    // 默认路径（备用）
    { x: 2, y: 2 }, { x: 3, y: 8 }, { x: 4, y: 14 }, { x: 4, y: 30 },
  ],
  'Z': [
    { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 30 }, { x: 6, y: 30 },
  ],
};

function fitTemplateToSection(
  template: Position[] | undefined, 
  sectionStartX: number
): Position[] {
  // 如果没有模板，返回一条竖直线（居中）
  if (!template || template.length === 0) {
    const centerX = sectionStartX + LETTER_TEMPLATE_WIDTH / 2;
    return [
      { x: centerX, y: 2 + LETTER_VERTICAL_OFFSET },
      { x: centerX, y: 30 + LETTER_VERTICAL_OFFSET },
    ];
  }

  // 计算字母模板的x范围
  const minX = Math.min(...template.map(p => p.x));
  const maxX = Math.max(...template.map(p => p.x));
  
  // 计算字母在区域内的居中偏移
  // 字母模板中心点相对于minX的偏移
  const templateCenterOffset = (maxX + minX) / 2 - minX;
  // 区域中心点
  const sectionCenter = LETTER_TEMPLATE_WIDTH / 2;
  // 最终偏移 = 区域起始位置 + (区域中心 - 字母中心偏移)
  const finalOffsetX = sectionStartX + sectionCenter - templateCenterOffset;

  // 应用平移（包括垂直偏移）
  return template.map(point => ({
    x: point.x - minX + finalOffsetX,
    y: point.y + LETTER_VERTICAL_OFFSET,
  }));
}

function reversePathPoints(path: Position[]): Position[] {
  return [...path].reverse();
}

function generateLetterPath(letters: string): Position[][] {
  const upper = letters.toUpperCase();
  const allPaths: Position[][] = [];
  
  upper.split('').forEach((letter, index) => {
    // 每个字母区域的起始x坐标
    const sectionStartX = LETTER_SPACING + index * (LETTER_TEMPLATE_WIDTH + LETTER_SPACING);
    
    // 检查是否有多路径配置
    const multiPaths = MULTI_PATH_LETTERS[letter];
    if (multiPaths) {
      // 对于多路径字母，需要统一计算所有路径的转换基准
      // 收集所有路径的所有点
      const allPoints: Position[] = [];
      multiPaths.forEach(pathTemplate => {
        allPoints.push(...pathTemplate);
      });
      
      // 计算统一的x范围
      const minX = Math.min(...allPoints.map(p => p.x));
      const maxX = Math.max(...allPoints.map(p => p.x));
      const templateCenterOffset = (maxX + minX) / 2 - minX;
      const sectionCenter = LETTER_TEMPLATE_WIDTH / 2;
      const finalOffsetX = sectionStartX + sectionCenter - templateCenterOffset;
      
      // 对每条路径应用统一的转换
      multiPaths.forEach(pathTemplate => {
        const fittedPath = pathTemplate.map(point => ({
          x: point.x - minX + finalOffsetX,
          y: point.y + LETTER_VERTICAL_OFFSET,
        }));
        allPaths.push(fittedPath);
      });
    } else {
      // 使用单路径
      let path = fitTemplateToSection(LETTER_TEMPLATES[letter], sectionStartX);
      
      // 检查是否需要反转
      if (REVERSED_LETTERS.has(letter)) {
        path = reversePathPoints(path);
      }
      
      allPaths.push(path);
    }
  });
  
  return allPaths;
}

function createLetterMap(id: number, name: string, desc: string, letters: string): MapSpec {
  const letterCount = Math.max(1, letters.length);
  
  // 地图宽度 = 字母数量 × (字母宽度 + 间距) - 最后一个字母后不需要间距 + 间距作为首尾padding
  const width = letterCount * LETTER_TEMPLATE_WIDTH + (letterCount + 1) * LETTER_SPACING;

  return {
    id,
    name,
    desc,
    size: { w: width, h: LETTER_TEMPLATE_HEIGHT },
    roadWidthCells: 2,
    path: generateLetterPath(letters),
  };
}

export const MAPS: MapSpec[] = [
  {
    id: 1,
    name: '折线小道',
    desc: '入门简单路线',
    size: { w: DEFAULT_MAP_WIDTH, h: DEFAULT_MAP_HEIGHT },
    roadWidthCells: 2,
    path: [
      { x: 2, y: 28 }, { x: 2, y: 20 }, { x: 8, y: 20 }, { x: 8, y: 10 }, { x: 14, y: 10 }, { x: 14, y: 4 },
    ],
  },
  {
    id: 2,
    name: '双拐角',
    desc: '两次大拐角',
    size: { w: DEFAULT_MAP_WIDTH, h: DEFAULT_MAP_HEIGHT },
    roadWidthCells: 2,
    path: [
      { x: 3, y: 30 }, { x: 3, y: 24 }, { x: 10, y: 24 }, { x: 10, y: 14 }, { x: 5, y: 14 }, { x: 5, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 3 },
    ],
  },
  {
    id: 3,
    name: 'Z字回廊',
    desc: 'Z 字折返',
    size: { w: DEFAULT_MAP_WIDTH, h: DEFAULT_MAP_HEIGHT },
    roadWidthCells: 2,
    path: [
      { x: 1, y: 29 }, { x: 1, y: 23 }, { x: 6, y: 23 }, { x: 6, y: 17 }, { x: 12, y: 17 }, { x: 12, y: 11 }, { x: 16, y: 11 }, { x: 16, y: 4 },
    ],
  },
  {
    id: 4,
    name: '蛇形长廊',
    desc: '多段小折返',
    size: { w: DEFAULT_MAP_WIDTH, h: DEFAULT_MAP_HEIGHT },
    roadWidthCells: 2,
    path: [
      { x: 2, y: 30 }, { x: 2, y: 26 }, { x: 6, y: 26 }, { x: 6, y: 22 }, { x: 10, y: 22 }, { x: 10, y: 18 }, { x: 14, y: 18 }, { x: 14, y: 14 }, { x: 8, y: 14 }, { x: 8, y: 10 }, { x: 12, y: 10 }, { x: 12, y: 6 }, { x: 4, y: 6 },
    ],
  },
  {
    id: 5,
    name: 'U形回环',
    desc: '上下各一次 U 回折',
    size: { w: DEFAULT_MAP_WIDTH, h: DEFAULT_MAP_HEIGHT },
    roadWidthCells: 2,
    path: [
      { x: 4, y: 30 }, { x: 4, y: 24 }, { x: 14, y: 24 }, { x: 14, y: 20 }, { x: 6, y: 20 }, { x: 6, y: 14 }, { x: 12, y: 14 }, { x: 12, y: 8 }, { x: 15, y: 8 }, { x: 15, y: 3 },
    ],
  },
  {
    id: 6,
    name: '弯弓射日',
    desc: '上窄下宽的弧形折返',
    size: { w: DEFAULT_MAP_WIDTH, h: DEFAULT_MAP_HEIGHT },
    roadWidthCells: 2,
    path: [
      { x: 2, y: 31 }, { x: 2, y: 25 }, { x: 5, y: 25 }, { x: 5, y: 19 }, { x: 9, y: 19 }, { x: 9, y: 13 }, { x: 13, y: 13 }, { x: 13, y: 7 }, { x: 16, y: 7 }, { x: 16, y: 3 },
    ],
  },
  ...[
    ['CJX', '陈同学'], ['CX', '陈同学'], ['CYF', '陈同学'], ['CYK', '陈同学'], ['CYX', '陈同学'],
    ['CZJ', '陈同学'], ['CZL', '陈同学'], ['FFY', '冯同学'], ['GYR', '郭同学'], ['HML', '黄同学'],
    ['HZM', '黄同学'], ['LFY', '李同学'], ['LHC', '李同学'], ['LRE', '李同学'], ['LSQ', '李同学'],
    ['LXL', '李同学'], ['LYD', '李同学'], ['LZH', '李同学'], ['MRY', '马同学'], ['MYN', '马同学'],
    ['PFY', '潘同学'], ['SGJW', '宋同学'], ['SQQ', '宋同学'], ['SZT', '宋同学'], ['THC', '唐同学'],
    ['TS', '唐同学'], ['WSY', '王同学'], ['WFX', '王同学'], ['WJC', '王同学'], ['WSH', '王同学'],
    ['WYY', '王同学'], ['WZC', '王同学'], ['WZK', '王同学'], ['WZS', '王同学'], ['YD', '杨同学'],
    ['YMQ', '杨同学'], ['YRZ', '杨同学'], ['YAN', '杨同学'], ['ZJW', '张同学'], ['ZQH', '张同学'],
    ['ZRR', '张同学'], ['ZSQ', '张同学'], ['ZWZ', '张同学'], ['ZYA', '张同学'], ['ZYC', '张同学'],
    ['ZYH', '张同学'], ['ZZM', '张同学'], ['ZZN', '张同学'], ['ZZQ', '张同学'],
  ].map(([letters, owner], index) =>
    createLetterMap(7 + index, letters, owner, letters)
  )
];

export type { Position };

const GRID_SPACING = 1.5;

function nearestDistanceToSinglePath(pos: Position, path: Position[]): number {
  let minDist = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const dist = distanceToSegment(pos, p1, p2);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

function nearestDistanceToPath(pos: Position, path: Position[] | Position[][]): number {
  if (Array.isArray(path[0])) {
    return (path as Position[][]).reduce((min, singlePath) => {
      const dist = nearestDistanceToSinglePath(pos, singlePath);
      return Math.min(min, dist);
    }, Infinity);
  }
  return nearestDistanceToSinglePath(pos, path as Position[]);
}

function distanceToSegment(p: Position, a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export function generatePlantGrid(map: MapSpec): Position[] {
  const { size, path, roadWidthCells } = map;
  const grid: Position[] = [];
  const threshold = Math.max(0.8, roadWidthCells * 0.55);

  for (let y = 0.5; y < size.h - 0.5; y += GRID_SPACING) {
    for (let x = 0.5; x < size.w - 0.5; x += GRID_SPACING) {
      const pos = { x, y };
      const dist = nearestDistanceToPath(pos, path);
      if (dist >= threshold) {
        grid.push(pos);
      }
    }
  }

  return grid;
}

export function getPlantGrid(map: MapSpec): Position[] {
  return map.plantGrid || generatePlantGrid(map);
}


