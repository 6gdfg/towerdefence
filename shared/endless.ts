export const ENDLESS_MODE_START_GOLD = 500;
export const ENDLESS_MODE_LIVES = 15;
export const ENDLESS_MODE_ENEMIES_PER_WAVE = 50;
export const ENDLESS_MODE_SPAWN_INTERVAL = 0.4;
export const ENDLESS_MODE_FIRST_WAVE_DELAY = 10;
export const ENDLESS_MODE_WAVE_GAP = 2;
export const ENDLESS_MODE_MAX_PLANTS = 10;
export const ENDLESS_MODE_MAX_ELEMENTS = 3;
export const ENDLESS_MODE_SPECIAL_ENEMY_CHANCE = 0.02;

export function getEndlessModeMinimumDurationSeconds(wavesCleared: number) {
  if (wavesCleared <= 0) return 0;
  const spawningSeconds = (ENDLESS_MODE_ENEMIES_PER_WAVE - 1) * ENDLESS_MODE_SPAWN_INTERVAL;
  return ENDLESS_MODE_FIRST_WAVE_DELAY + spawningSeconds
    + (wavesCleared - 1) * (spawningSeconds + ENDLESS_MODE_WAVE_GAP);
}
