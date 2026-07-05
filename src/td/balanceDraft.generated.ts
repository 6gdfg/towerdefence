import type { BalanceLabLevelDraft } from './BalanceLabPage';

export const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = {
  "sourceLevelId": "L1",
  "levelNumber": 1,
  "levelName": "入门小道",
  "difficulty": "EZ",
  "rating": 1,
  "mapId": 1,
  "mapName": "新手折线",
  "startGold": 1000,
  "lives": 20,
  "autoStartFirstWave": true,
  "firstWaveDelaySec": 0.8,
  "waves": [
    {
      "groups": [
        {
          "type": "circle",
          "count": 12,
          "interval": 0.35,
          "level": 1,
          "reward": 5
        }
      ]
    },
    {
      "groups": [
        {
          "type": "circle",
          "count": 25,
          "interval": 0.3,
          "level": 3,
          "reward": 8
        },
        {
          "type": "triangle",
          "count": 30,
          "interval": 0.28,
          "level": 2,
          "reward": 6
        }
      ]
    },
    {
      "groups": [
        {
          "type": "square",
          "count": 20,
          "interval": 0.45,
          "level": 4,
          "reward": 10
        },
        {
          "type": "triangle",
          "count": 40,
          "interval": 0.25,
          "level": 3,
          "reward": 7
        }
      ]
    },
    {
      "groups": [
        {
          "type": "circle",
          "count": 68,
          "interval": 0.11249999999999999,
          "level": 10,
          "reward": 10
        },
        {
          "type": "triangle",
          "count": 51,
          "interval": 0.1325,
          "level": 15,
          "reward": 12
        },
        {
          "type": "square",
          "count": 1,
          "interval": 1.4,
          "level": 200,
          "reward": 110,
          "leakDamage": 4
        }
      ]
    }
  ]
};
