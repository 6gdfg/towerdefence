import type { BalanceLabLevelDraft } from './BalanceLabPage';

export const BALANCE_LAB_LEVEL_DRAFTS: BalanceLabLevelDraft[] = [
  {
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
            "count": 10,
            "interval": 0.3,
            "level": 3,
            "reward": 8
          },
          {
            "type": "triangle",
            "count": 12,
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
            "count": 15,
            "interval": 0.45,
            "level": 4,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 12,
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
            "count": 10,
            "interval": 0.11249999999999999,
            "level": 3,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.1325,
            "level": 5,
            "reward": 12
          },
          {
            "type": "square",
            "count": 1,
            "interval": 1.4,
            "level": 20,
            "reward": 110,
            "leakDamage": 4
          }
        ]
      }
    ],
    "unlockRewards": [
      "element:fire"
    ]
  },
  {
    "sourceLevelId": "L1",
    "levelNumber": 1,
    "levelName": "入门小道",
    "difficulty": "HD",
    "rating": 4,
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
            "level": 6,
            "reward": 8
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "reward": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 35,
            "interval": 0.3,
            "level": 7,
            "reward": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.45,
            "level": 10,
            "reward": 10,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.25,
            "level": 8,
            "reward": 13,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 9,
            "reward": 10,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.11249999999999999,
            "level": 11,
            "reward": 13,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.1325,
            "level": 13,
            "reward": 12,
            "startDelay": 10
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 55,
            "reward": 110,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 10
          }
        ]
      }
    ]
  },
  {
    "sourceLevelId": "L1",
    "levelNumber": 1,
    "levelName": "入门小道",
    "difficulty": "IN",
    "rating": 10,
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
            "level": 11,
            "reward": 7
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 8,
            "reward": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 11,
            "reward": 10
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 7,
            "reward": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 10,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 10,
            "reward": 10
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "reward": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 50,
            "reward": 50,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 150,
            "reward": 110,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 0
          }
        ]
      }
    ]
  },
  {
    "sourceLevelId": "L1",
    "levelNumber": 1,
    "levelName": "1-1",
    "difficulty": "AT",
    "rating": 11,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 15,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 12,
            "interval": 0.35,
            "level": 11,
            "reward": 7
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 8,
            "reward": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 11,
            "reward": 10
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 7,
            "reward": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 10,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 10,
            "reward": 10
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "reward": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 50,
            "reward": 50,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 150,
            "reward": 110,
            "isBoss": true,
            "startDelay": 2,
            "leakDamage": 4
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 2,
        "maxQueue": 10,
        "pool": [
          {
            "kind": "plant",
            "id": "bottleGrass",
            "weight": 100
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 80
          },
          {
            "kind": "plant",
            "id": "rocket",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 15
          },
          {
            "kind": "plant",
            "id": "cycloneShroom",
            "weight": 30
          }
        ]
      }
    }
  }
];

export const BALANCE_LAB_DRAFT_BY_KEY: Record<string, BalanceLabLevelDraft> = {
  "L1:EZ": {
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
            "count": 10,
            "interval": 0.3,
            "level": 3,
            "reward": 8
          },
          {
            "type": "triangle",
            "count": 12,
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
            "count": 15,
            "interval": 0.45,
            "level": 4,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 12,
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
            "count": 10,
            "interval": 0.11249999999999999,
            "level": 3,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.1325,
            "level": 5,
            "reward": 12
          },
          {
            "type": "square",
            "count": 1,
            "interval": 1.4,
            "level": 20,
            "reward": 110,
            "leakDamage": 4
          }
        ]
      }
    ],
    "unlockRewards": [
      "element:fire"
    ]
  },
  "L1:HD": {
    "sourceLevelId": "L1",
    "levelNumber": 1,
    "levelName": "入门小道",
    "difficulty": "HD",
    "rating": 4,
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
            "level": 6,
            "reward": 8
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "reward": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 35,
            "interval": 0.3,
            "level": 7,
            "reward": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.45,
            "level": 10,
            "reward": 10,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.25,
            "level": 8,
            "reward": 13,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 9,
            "reward": 10,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.11249999999999999,
            "level": 11,
            "reward": 13,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.1325,
            "level": 13,
            "reward": 12,
            "startDelay": 10
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 55,
            "reward": 110,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 10
          }
        ]
      }
    ]
  },
  "L1:IN": {
    "sourceLevelId": "L1",
    "levelNumber": 1,
    "levelName": "入门小道",
    "difficulty": "IN",
    "rating": 10,
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
            "level": 11,
            "reward": 7
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 8,
            "reward": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 11,
            "reward": 10
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 7,
            "reward": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 10,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 10,
            "reward": 10
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "reward": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 50,
            "reward": 50,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 150,
            "reward": 110,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 0
          }
        ]
      }
    ]
  },
  "L1:AT": {
    "sourceLevelId": "L1",
    "levelNumber": 1,
    "levelName": "1-1",
    "difficulty": "AT",
    "rating": 11,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 15,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 12,
            "interval": 0.35,
            "level": 11,
            "reward": 7
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 8,
            "reward": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 11,
            "reward": 10
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 7,
            "reward": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 10,
            "reward": 10
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 10,
            "reward": 10
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "reward": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 50,
            "reward": 50,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 150,
            "reward": 110,
            "isBoss": true,
            "startDelay": 2,
            "leakDamage": 4
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 2,
        "maxQueue": 10,
        "pool": [
          {
            "kind": "plant",
            "id": "bottleGrass",
            "weight": 100
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 80
          },
          {
            "kind": "plant",
            "id": "rocket",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 15
          },
          {
            "kind": "plant",
            "id": "cycloneShroom",
            "weight": 30
          }
        ]
      }
    }
  }
};

export const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = BALANCE_LAB_LEVEL_DRAFTS[0] as BalanceLabLevelDraft;
