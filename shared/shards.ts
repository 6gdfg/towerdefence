export type SplitShardInventory = {
  plantShards: Record<string, number>;
  elementShards: Record<string, number>;
};

export function splitShardInventory(shards: Record<string, number>): SplitShardInventory {
  const plantShards: Record<string, number> = {};
  const elementShards: Record<string, number> = {};

  for (const [key, value] of Object.entries(shards)) {
    const count = Number(value) || 0;
    if (key.startsWith('element:')) {
      elementShards[key.slice('element:'.length)] = count;
    } else {
      plantShards[key] = count;
    }
  }

  return { plantShards, elementShards };
}

export function mergeShardInventory(
  plantShards: Record<string, number> = {},
  elementShards: Record<string, number> = {},
): Record<string, number> {
  const shards: Record<string, number> = { ...plantShards };
  for (const [element, count] of Object.entries(elementShards)) {
    shards[`element:${element}`] = Number(count) || 0;
  }
  return shards;
}
