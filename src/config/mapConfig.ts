import { MapConfig } from '../types/game';

// 地图配置 - 类似皇室战争的一河两桥布局
export const MAP_CONFIG: MapConfig = {
  width: 18, // 18格宽
  height: 32, // 32格高
  riverY: 16, // 河流在中间
  bridgePositions: [
    { x: 5, y: 16 }, // 左桥
    { x: 12, y: 16 }, // 右桥
  ],
  playerTowerPosition: { x: 9, y: 28 }, // 玩家塔在下方
  enemyTowerPosition: { x: 9, y: 4 }, // 敌人塔在上方
};

// 格子大小(像素)
export const CELL_SIZE = 30;

// 检查位置是否可通行
export function isWalkable(x: number, y: number): boolean {
  const { width, height, riverY, bridgePositions } = MAP_CONFIG;
  
  // 超出边界
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  
  // 河流位置
  if (y === riverY) {
    // 检查是否在桥上
    return bridgePositions.some(bridge => 
      Math.abs(x - bridge.x) <= 1 // 桥宽3格
    );
  }
  
  return true;
}

// 计算两点距离
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

