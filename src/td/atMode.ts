import type { AtBaseModeType, AtModeConfig } from './types';

export function getAtBaseModeType(config?: AtModeConfig | null): AtBaseModeType {
  if (!config) return 'normal';
  if (config.type === 'phantom') return config.phantom?.subMode ?? 'normal';
  return config.type;
}

export function isPhantomAtMode(config?: AtModeConfig | null) {
  return config?.type === 'phantom' || config?.phantomSpawn === true;
}
