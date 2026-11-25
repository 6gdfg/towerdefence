import type { AtModeConfig, SpecialEnemyConfig, WaveDef } from '../src/td/types.js';

export type BalanceLabLevelDraft = {
  sourceLevelId: string;
  levelNumber: number;
  levelName: string;
  contributor?: string;
  difficulty: 'EZ' | 'HD' | 'IN' | 'AT';
  rating: number;
  mapId: number;
  mapName: string;
  startGold: number;
  lives: number;
  autoStartFirstWave: boolean;
  firstWaveDelaySec: number;
  waves: WaveDef[];
  atModeConfig?: AtModeConfig;
  specialEnemyConfig?: SpecialEnemyConfig;
  unlockRewards?: string[];
};
