import type { AtBaseModeType, AtModeConfig, PlantType } from './types';

export const DEFAULT_WHACK_A_MOLE_PLANTS: PlantType[] = ['sunflower', 'bottleGrass'];
export const DEFAULT_WHACK_A_MOLE_HAMMER_DAMAGE = 30;

export function getAtBaseModeType(config?: AtModeConfig | null): AtBaseModeType {
  const type = config?.type === 'phantom' ? config.phantom?.subMode : config?.type;
  switch (type) {
    case 'conveyor':
    case 'lastStand':
    case 'flexible':
    case 'whackAMole':
      return type;
    default:
      return 'normal';
  }
}

export function isPhantomAtMode(config?: AtModeConfig | null) {
  return config?.type === 'phantom' || config?.phantomSpawn === true;
}
