import type { AtBaseModeType, AtModeConfig, PlantType } from './types';

export const DEFAULT_WHACK_A_MOLE_PLANTS: PlantType[] = ['sunflower', 'bottleGrass'];
export const DEFAULT_WHACK_A_MOLE_HAMMER_DAMAGE = 30;

export function getAtBaseModeType(config?: AtModeConfig | null): AtBaseModeType {
  if (!config) return 'normal';
  if (config.type === 'phantom') return config.phantom?.subMode ?? 'normal';
  return config.type;
}

export function isPhantomAtMode(config?: AtModeConfig | null) {
  return config?.type === 'phantom' || config?.phantomSpawn === true;
}
