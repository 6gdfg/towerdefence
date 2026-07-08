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
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.3,
            "level": 2,
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.28,
            "level": 1,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 15,
            "interval": 0.45,
            "level": 2,
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.25,
            "level": 2,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.11249999999999999,
            "level": 2,
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.1325,
            "level": 2,
          },
          {
            "type": "square",
            "count": 1,
            "interval": 1.4,
            "level": 10,
            "leakDamage": 4
          }
        ]
      }
    ],
    "unlockRewards": []
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
            "level": 3,
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 3,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 35,
            "interval": 0.3,
            "level": 3,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.45,
            "level": 5,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.25,
            "level": 4,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 5,
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
            "level": 6,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.1325,
            "level": 6,
            "startDelay": 10
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 27,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 10
          }
        ]
      }
    ],
    "unlockRewards": []
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
            "level": 6,
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6,
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5,
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5,
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 25,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 75,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 0
          }
        ]
      }
    ],
    "unlockRewards": []
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
            "level": 5,
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6,
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5,
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5,
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 25,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 75,
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
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L2",
    "levelNumber": 2,
    "levelName": "1-2",
    "difficulty": "EZ",
    "rating": 3,
    "mapId": 3,
    "mapName": "长廊回折",
    "startGold": 1000,
    "lives": 18,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 10
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 20
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 30
          },
          {
            "type": "triangle",
            "count": 4,
            "interval": 0.4,
            "level": 1,
            "startDelay": 40
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 25,
            "interval": 0.1,
            "level": 2,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 25,
            "interval": 0.1,
            "level": 2,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 15,
            "interval": 0.1,
            "level": 2,
            "startDelay": 3
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L2",
    "levelNumber": 2,
    "levelName": "1-2",
    "difficulty": "HD",
    "rating": 6,
    "mapId": 3,
    "mapName": "长廊回折",
    "startGold": 1000,
    "lives": 18,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 15,
            "startDelay": 3
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 15,
            "startDelay": 6
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.4,
            "level": 15,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 500,
            "startDelay": 0,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L2",
    "levelNumber": 2,
    "levelName": "1-2",
    "difficulty": "IN",
    "rating": 9,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 60,
    "lives": 18,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 1,
            "interval": 0.1,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 3,
            "interval": 0.4,
            "level": 3,
            "startDelay": 10
          },
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 20
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 30,
            "startDelay": 20
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 4,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 8,
            "interval": 0.4,
            "level": 4,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 5,
            "startDelay": 0
          },
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 30
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 150,
            "startDelay": 30,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L3",
    "levelNumber": 3,
    "levelName": "1-3",
    "difficulty": "EZ",
    "rating": 3,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 800,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "igniter",
            "count": 18,
            "interval": 0.5,
            "level": 3,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 3,
            "startDelay": 20
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 70,
            "startDelay": 20,
            "isBoss": true
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L3",
    "levelNumber": 3,
    "levelName": "1-3",
    "difficulty": "HD",
    "rating": 7,
    "mapId": 1,
    "mapName": "新手折线",
    "startGold": 80,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.5,
            "level": 1,
            "startDelay": 5
          },
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 2,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 5,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5,
            "isBoss": false
          },
          {
            "type": "circle",
            "count": 4,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 15,
            "interval": 0.4,
            "level": 3,
            "startDelay": 2
          },
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.4,
            "level": 1,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 1,
          }
        ]
      }
    ],
    "unlockRewards": []
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
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.3,
            "level": 2,
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.28,
            "level": 1,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 15,
            "interval": 0.45,
            "level": 2,
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.25,
            "level": 2,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.11249999999999999,
            "level": 2,
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.1325,
            "level": 2,
          },
          {
            "type": "square",
            "count": 1,
            "interval": 1.4,
            "level": 10,
            "leakDamage": 4
          }
        ]
      }
    ],
    "unlockRewards": []
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
            "level": 3,
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 3,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 35,
            "interval": 0.3,
            "level": 3,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.45,
            "level": 5,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.25,
            "level": 4,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 5,
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
            "level": 6,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.1325,
            "level": 6,
            "startDelay": 10
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 27,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 10
          }
        ]
      }
    ],
    "unlockRewards": []
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
            "level": 6,
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6,
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5,
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5,
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 25,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 75,
            "isBoss": true,
            "leakDamage": 4,
            "startDelay": 0
          }
        ]
      }
    ],
    "unlockRewards": []
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
            "level": 5,
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6,
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5,
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5,
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5,
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.11249999999999999,
            "level": 25,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 2,
            "interval": 1.4,
            "level": 75,
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
    },
    "unlockRewards": []
  },
  "L2:EZ": {
    "sourceLevelId": "L2",
    "levelNumber": 2,
    "levelName": "1-2",
    "difficulty": "EZ",
    "rating": 3,
    "mapId": 3,
    "mapName": "长廊回折",
    "startGold": 1000,
    "lives": 18,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 10
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 20
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 30
          },
          {
            "type": "triangle",
            "count": 4,
            "interval": 0.4,
            "level": 1,
            "startDelay": 40
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 25,
            "interval": 0.1,
            "level": 2,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 25,
            "interval": 0.1,
            "level": 2,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 15,
            "interval": 0.1,
            "level": 2,
            "startDelay": 3
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L2:HD": {
    "sourceLevelId": "L2",
    "levelNumber": 2,
    "levelName": "1-2",
    "difficulty": "HD",
    "rating": 6,
    "mapId": 3,
    "mapName": "长廊回折",
    "startGold": 1000,
    "lives": 18,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 15,
            "startDelay": 3
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 15,
            "startDelay": 6
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.4,
            "level": 15,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 500,
            "startDelay": 0,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L2:IN": {
    "sourceLevelId": "L2",
    "levelNumber": 2,
    "levelName": "1-2",
    "difficulty": "IN",
    "rating": 9,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 60,
    "lives": 18,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 1,
            "interval": 0.1,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 3,
            "interval": 0.4,
            "level": 3,
            "startDelay": 10
          },
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 20
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 30,
            "startDelay": 20
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 4,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 8,
            "interval": 0.4,
            "level": 4,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 5,
            "startDelay": 0
          },
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.4,
            "level": 1,
            "startDelay": 30
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 150,
            "startDelay": 30,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L3:EZ": {
    "sourceLevelId": "L3",
    "levelNumber": 3,
    "levelName": "1-3",
    "difficulty": "EZ",
    "rating": 3,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 800,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "igniter",
            "count": 18,
            "interval": 0.5,
            "level": 3,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 3,
            "startDelay": 20
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 70,
            "startDelay": 20,
            "isBoss": true
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L3:HD": {
    "sourceLevelId": "L3",
    "levelNumber": 3,
    "levelName": "1-3",
    "difficulty": "HD",
    "rating": 7,
    "mapId": 1,
    "mapName": "新手折线",
    "startGold": 80,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "igniter",
            "count": 1,
            "interval": 0.5,
            "level": 1,
            "startDelay": 5
          },
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 2,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 5,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5,
            "isBoss": false
          },
          {
            "type": "circle",
            "count": 4,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 15,
            "interval": 0.4,
            "level": 3,
            "startDelay": 2
          },
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.4,
            "level": 1,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 1,
          }
        ]
      }
    ],
    "unlockRewards": []
  }
};

export const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = BALANCE_LAB_LEVEL_DRAFTS[0] as BalanceLabLevelDraft;
