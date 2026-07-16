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
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.3,
            "level": 2
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.28,
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 15,
            "interval": 0.45,
            "level": 2
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.25,
            "level": 2
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.11249999999999999,
            "level": 2
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.1325,
            "level": 2
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
            "level": 3
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 35,
            "interval": 0.3,
            "level": 3
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
            "level": 6
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5
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
            "level": 5
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5
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
            "level": 1
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
    "difficulty": "IN",
    "rating": 10,
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
            "startDelay": 5
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
            "level": 1
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "EZ",
    "rating": 4,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 800,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 8,
            "interval": 0.5,
            "level": 1,
            "startDelay": 5
          },
          {
            "type": "circle",
            "count": 8,
            "interval": 0.4,
            "level": 2,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 7,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "circle",
            "count": 6,
            "interval": 0.4,
            "level": 4,
            "startDelay": 20
          },
          {
            "type": "circle",
            "count": 5,
            "interval": 0.4,
            "level": 5,
            "startDelay": 30
          },
          {
            "type": "circle",
            "count": 4,
            "interval": 0.4,
            "level": 6,
            "startDelay": 40
          },
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 7,
            "startDelay": 50
          },
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 8,
            "startDelay": 60
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 100
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "HD",
    "rating": 8,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 50000,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.2,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 4,
            "startDelay": 15
          },
          {
            "type": "square",
            "count": 50,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 100,
            "startDelay": 40,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "IN",
    "rating": 12,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 100,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 5,
            "startDelay": 10
          },
          {
            "type": "square",
            "count": 2,
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
            "count": 1,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 8,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 20,
            "interval": 0.4,
            "level": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 14
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 13,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "startDelay": 15,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "AT",
    "rating": 13,
    "mapId": 17,
    "mapName": "H",
    "startGold": 800,
    "lives": 15,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 8,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 20,
            "interval": 0.4,
            "level": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 14
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 13,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "isBoss": true,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 100,
            "interval": 0.4,
            "level": 2
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 1.5,
        "maxQueue": 8,
        "pool": [
          {
            "kind": "plant",
            "id": "bottleGrass",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "puffShroom",
            "weight": 50
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 50
          },
          {
            "kind": "plant",
            "id": "rocket",
            "weight": 90
          },
          {
            "kind": "plant",
            "id": "doubleBottleGrass",
            "weight": 90
          },
          {
            "kind": "plant",
            "id": "holyFlower",
            "weight": 30
          }
        ]
      }
    },
    "unlockRewards": [
      "doubleBottleGrass"
    ]
  },
  {
    "sourceLevelId": "L5",
    "levelNumber": 5,
    "levelName": "1-5",
    "difficulty": "EZ",
    "rating": 3,
    "mapId": 5,
    "mapName": "外圈绕行",
    "startGold": 700,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 2,
            "startDelay": 15
          },
          {
            "type": "rager",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 3,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "rager",
            "count": 50,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 3
          },
          {
            "type": "igniter",
            "count": 4,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "startDelay": 5,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L5",
    "levelNumber": 5,
    "levelName": "1-5",
    "difficulty": "HD",
    "rating": 6,
    "mapId": 13,
    "mapName": "三线并行",
    "startGold": 600,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 4
          },
          {
            "type": "triangle",
            "count": 5,
            "interval": 0.4,
            "level": 30
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 2,
            "interval": 0.4,
            "level": 6
          }
        ]
      },
      {
        "groups": [
          {
            "type": "rager",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 0.4,
            "level": 15,
            "startDelay": 5,
            "isBoss": true
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 80
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L5",
    "levelNumber": 5,
    "levelName": "1-5",
    "difficulty": "IN",
    "rating": 16,
    "mapId": 15,
    "mapName": "五线并行",
    "startGold": 100,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 8
          },
          {
            "type": "rager",
            "count": 5,
            "interval": 0.4,
            "level": 9,
            "startDelay": 10
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 25,
            "startDelay": 11
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 5,
            "interval": 0.4,
            "level": 10,
            "startDelay": 7
          },
          {
            "type": "rager",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 60,
            "interval": 0.4,
            "level": 20,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 30,
            "interval": 0.4,
            "level": 15,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 35,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 120,
            "startDelay": 25,
            "isBoss": true
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 1,
            "interval": 0.4,
            "level": 120,
            "startDelay": 3,
            "isBoss": true
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 400,
            "startDelay": 4,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": [
      "hotPepper"
    ]
  },
  {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "EZ",
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
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 2,
            "startDelay": 15
          },
          {
            "type": "rager",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 3,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "rager",
            "count": 50,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 3
          },
          {
            "type": "igniter",
            "count": 4,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "isBoss": true,
            "startDelay": 5
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "HD",
    "rating": 8,
    "mapId": 1,
    "mapName": "新手折线",
    "startGold": 3000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.2,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 4,
            "startDelay": 15
          },
          {
            "type": "square",
            "count": 50,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 100,
            "isBoss": true,
            "startDelay": 40
          },
          {
            "type": "angryWriter",
            "count": 100,
            "interval": 0.4,
            "level": 3,
            "startDelay": 50
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "IN",
    "rating": 13,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 200,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 8
          },
          {
            "type": "rager",
            "count": 40,
            "interval": 0.4,
            "level": 5,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 5,
            "interval": 0.4,
            "level": 10,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 60,
            "interval": 0.4,
            "level": 20,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 30,
            "interval": 0.4,
            "level": 15,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 35,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 80,
            "isBoss": true,
            "startDelay": 25
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 15
          },
          {
            "type": "purifier",
            "count": 100,
            "interval": 0.4,
            "level": 1,
            "startDelay": 15
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "AT",
    "rating": 14,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 1000,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 8
          },
          {
            "type": "rager",
            "count": 40,
            "interval": 0.4,
            "level": 5,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 5,
            "interval": 0.4,
            "level": 10,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 60,
            "interval": 0.4,
            "level": 20,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 30,
            "interval": 0.4,
            "level": 15,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 35,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 80,
            "isBoss": true,
            "startDelay": 25
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 15,
            "startDelay": 0
          },
          {
            "type": "purifier",
            "count": 100,
            "interval": 0.4,
            "level": 1,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 20,
            "startDelay": 15
          },
          {
            "type": "evilSniper",
            "count": 30,
            "interval": 0.4,
            "level": 16,
            "startDelay": 20
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 200,
            "startDelay": 40,
            "isBoss": true
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 1.5,
        "maxQueue": 10,
        "pool": [
          {
            "kind": "plant",
            "id": "sunflower",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "puffShroom",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "machineGun",
            "weight": 100
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "sunlightFlower",
            "weight": 100
          }
        ]
      }
    },
    "unlockRewards": [
      "rocket"
    ]
  },
  {
    "sourceLevelId": "L7",
    "levelNumber": 7,
    "levelName": "1-7",
    "difficulty": "EZ",
    "rating": 5,
    "mapId": 7,
    "mapName": "左右蛇形",
    "startGold": 1200,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.55,
            "level": 2,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 6,
            "interval": 0.65,
            "level": 2,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 12,
            "interval": 0.5,
            "level": 3,
            "startDelay": 1
          },
          {
            "type": "square",
            "count": 6,
            "interval": 0.7,
            "level": 2,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 2,
            "interval": 1.2,
            "level": 2,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.48,
            "level": 3,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 2,
            "interval": 1.4,
            "level": 3,
            "startDelay": 4
          },
          {
            "type": "square",
            "count": 8,
            "interval": 0.65,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.42,
            "level": 4,
            "startDelay": 1
          },
          {
            "type": "igniter",
            "count": 4,
            "interval": 0.9,
            "level": 3,
            "startDelay": 4
          },
          {
            "type": "taunter",
            "count": 2,
            "interval": 1.3,
            "level": 4,
            "startDelay": 7
          },
          {
            "type": "freezer",
            "count": 2,
            "interval": 1.3,
            "level": 4,
            "startDelay": 10
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 24,
            "startDelay": 14,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L7",
    "levelNumber": 7,
    "levelName": "1-7",
    "difficulty": "HD",
    "rating": 10,
    "mapId": 7,
    "mapName": "左右蛇形",
    "startGold": 900,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.48,
            "level": 5,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 8,
            "interval": 0.58,
            "level": 5,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 16,
            "interval": 0.44,
            "level": 6,
            "startDelay": 1
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.65,
            "level": 6,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 1.1,
            "level": 5,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 7,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 3,
            "interval": 1.1,
            "level": 7,
            "startDelay": 4
          },
          {
            "type": "igniter",
            "count": 5,
            "interval": 0.8,
            "level": 6,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 8,
            "interval": 0.75,
            "level": 8,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 12,
            "interval": 0.42,
            "level": 8,
            "startDelay": 3
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 1,
            "level": 8,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 3,
            "interval": 1.1,
            "level": 8,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.36,
            "level": 9,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 16,
            "interval": 0.38,
            "level": 10,
            "startDelay": 3
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.9,
            "level": 10,
            "startDelay": 6
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 1,
            "level": 9,
            "startDelay": 9
          },
          {
            "type": "angryWriter",
            "count": 3,
            "interval": 1,
            "level": 12,
            "startDelay": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 55,
            "startDelay": 15,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L7",
    "levelNumber": 7,
    "levelName": "1-7",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 7,
    "mapName": "左右蛇形",
    "startGold": 500,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.46,
            "level": 20,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.52,
            "level": 22,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 10,
            "interval": 0.62,
            "level": 24,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 1,
            "level": 22,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 1.1,
            "level": 20,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 8,
            "interval": 0.7,
            "level": 28,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 18,
            "interval": 0.4,
            "level": 26,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.72,
            "level": 25,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.95,
            "level": 28,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.34,
            "level": 32,
            "startDelay": 1
          },
          {
            "type": "angryWriter",
            "count": 6,
            "interval": 0.8,
            "level": 30,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 0.9,
            "level": 30,
            "startDelay": 7
          },
          {
            "type": "taunter",
            "count": 5,
            "interval": 0.85,
            "level": 32,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 4,
            "interval": 1.1,
            "level": 35,
            "startDelay": 1
          },
          {
            "type": "armored",
            "count": 12,
            "interval": 0.58,
            "level": 36,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.85,
            "level": 34,
            "startDelay": 7
          },
          {
            "type": "taunter",
            "count": 5,
            "interval": 0.8,
            "level": 36,
            "startDelay": 10
          },
          {
            "type": "purifier",
            "count": 3,
            "interval": 1,
            "level": 32,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 24,
            "interval": 0.3,
            "level": 40,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.32,
            "level": 42,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 8,
            "interval": 0.62,
            "level": 40,
            "startDelay": 5
          },
          {
            "type": "taunter",
            "count": 6,
            "interval": 0.72,
            "level": 45,
            "startDelay": 7
          },
          {
            "type": "freezer",
            "count": 6,
            "interval": 0.75,
            "level": 42,
            "startDelay": 9
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.8,
            "level": 48,
            "startDelay": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 180,
            "startDelay": 16,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "EZ",
    "rating": 6,
    "mapId": 4,
    "mapName": "中心回廊",
    "startGold": 800,
    "lives": 1,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "count": 300,
            "interval": 0.2,
            "level": 5,
            "type": "circle"
          },
          {
            "count": 1,
            "interval": 0.1,
            "level": 400,
            "type": "bunker"
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "HD",
    "rating": 13,
    "mapId": 8,
    "mapName": "上路压迫",
    "startGold": 700,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 18,
            "interval": 0.42,
            "level": 12,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.46,
            "level": 13,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 12,
            "interval": 0.58,
            "level": 14,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.95,
            "level": 13,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 1,
            "level": 12,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 10,
            "interval": 0.68,
            "level": 16,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 20,
            "interval": 0.36,
            "level": 15,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.7,
            "level": 15,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.85,
            "level": 16,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.32,
            "level": 18,
            "startDelay": 1
          },
          {
            "type": "angryWriter",
            "count": 6,
            "interval": 0.75,
            "level": 18,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.85,
            "level": 17,
            "startDelay": 7
          },
          {
            "type": "purifier",
            "count": 3,
            "interval": 1,
            "level": 16,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 4,
            "interval": 1,
            "level": 20,
            "startDelay": 1
          },
          {
            "type": "armored",
            "count": 14,
            "interval": 0.52,
            "level": 21,
            "startDelay": 3
          },
          {
            "type": "taunter",
            "count": 5,
            "interval": 0.75,
            "level": 20,
            "startDelay": 6
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.8,
            "level": 20,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 26,
            "interval": 0.28,
            "level": 22,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 22,
            "interval": 0.3,
            "level": 24,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 8,
            "interval": 0.58,
            "level": 22,
            "startDelay": 5
          },
          {
            "type": "taunter",
            "count": 6,
            "interval": 0.68,
            "level": 24,
            "startDelay": 7
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.72,
            "level": 22,
            "startDelay": 9
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.75,
            "level": 24,
            "startDelay": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 100,
            "startDelay": 16,
            "isBoss": true,
            "bossSpeed": 0.55
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 700,
    "lives": 12,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.46,
            "level": 1000,
            "startDelay": 1,
            "isBoss": true,
            "bossSpeed": 0.1
          },
          {
            "type": "triangle",
            "count": 25,
            "interval": 0.52,
            "level": 22,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 20,
            "interval": 0.4,
            "level": 24,
            "startDelay": 30
          },
          {
            "type": "healer",
            "count": 20,
            "interval": 0.4,
            "level": 21,
            "startDelay": 50
          },
          {
            "type": "armored",
            "count": 10,
            "interval": 0.4,
            "level": 18,
            "startDelay": 70
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 150,
            "startDelay": 80,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "AT",
    "rating": 14,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 600,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 7,
            "startDelay": 25
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 18,
            "interval": 0.4,
            "level": 8
          },
          {
            "type": "square",
            "count": 5,
            "interval": 0.4,
            "level": 12
          },
          {
            "type": "armored",
            "count": 5,
            "interval": 0.4,
            "level": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 80,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 160,
            "interval": 0.4,
            "level": 1,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 1,
            "interval": 0.4,
            "level": 500,
            "startDelay": 1,
            "isBoss": true,
            "bossSpeed": 0.3
          },
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 6,
            "interval": 0.4,
            "level": 8,
            "startDelay": 10
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "phantom",
      "phantom": {
        "subMode": "normal"
      }
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.03
    },
    "unlockRewards": [
      "flameBottleGrass"
    ]
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
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.3,
            "level": 2
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.28,
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 15,
            "interval": 0.45,
            "level": 2
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.25,
            "level": 2
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.11249999999999999,
            "level": 2
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.1325,
            "level": 2
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
            "level": 3
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 35,
            "interval": 0.3,
            "level": 3
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
            "level": 6
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5
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
            "level": 5
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 45,
            "interval": 0.3,
            "level": 6
          },
          {
            "type": "igniter",
            "count": 7,
            "interval": 0.28,
            "level": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.45,
            "level": 5
          },
          {
            "type": "triangle",
            "count": 40,
            "interval": 0.25,
            "level": 5
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 5
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
            "level": 1
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L3:IN": {
    "sourceLevelId": "L3",
    "levelNumber": 3,
    "levelName": "1-3",
    "difficulty": "IN",
    "rating": 10,
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
            "startDelay": 5
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
            "level": 1
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L4:EZ": {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "EZ",
    "rating": 4,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 800,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 8,
            "interval": 0.5,
            "level": 1,
            "startDelay": 5
          },
          {
            "type": "circle",
            "count": 8,
            "interval": 0.4,
            "level": 2,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 7,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "circle",
            "count": 6,
            "interval": 0.4,
            "level": 4,
            "startDelay": 20
          },
          {
            "type": "circle",
            "count": 5,
            "interval": 0.4,
            "level": 5,
            "startDelay": 30
          },
          {
            "type": "circle",
            "count": 4,
            "interval": 0.4,
            "level": 6,
            "startDelay": 40
          },
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 7,
            "startDelay": 50
          },
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 8,
            "startDelay": 60
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 100
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L4:HD": {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "HD",
    "rating": 8,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 50000,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.2,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 4,
            "startDelay": 15
          },
          {
            "type": "square",
            "count": 50,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 100,
            "startDelay": 40,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L4:IN": {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "IN",
    "rating": 12,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 100,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 5,
            "startDelay": 10
          },
          {
            "type": "square",
            "count": 2,
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
            "count": 1,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 8,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 20,
            "interval": 0.4,
            "level": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 14
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 13,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "startDelay": 15,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L4:AT": {
    "sourceLevelId": "L4",
    "levelNumber": 4,
    "levelName": "1-4",
    "difficulty": "AT",
    "rating": 13,
    "mapId": 17,
    "mapName": "H",
    "startGold": 800,
    "lives": 15,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 8,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 10,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 20,
            "interval": 0.4,
            "level": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 14
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 13,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 15,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 12,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "isBoss": true,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 100,
            "interval": 0.4,
            "level": 2
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 1.5,
        "maxQueue": 8,
        "pool": [
          {
            "kind": "plant",
            "id": "bottleGrass",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "puffShroom",
            "weight": 50
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 50
          },
          {
            "kind": "plant",
            "id": "rocket",
            "weight": 90
          },
          {
            "kind": "plant",
            "id": "doubleBottleGrass",
            "weight": 90
          },
          {
            "kind": "plant",
            "id": "holyFlower",
            "weight": 30
          }
        ]
      }
    },
    "unlockRewards": [
      "doubleBottleGrass"
    ]
  },
  "L5:EZ": {
    "sourceLevelId": "L5",
    "levelNumber": 5,
    "levelName": "1-5",
    "difficulty": "EZ",
    "rating": 3,
    "mapId": 5,
    "mapName": "外圈绕行",
    "startGold": 700,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 2,
            "startDelay": 15
          },
          {
            "type": "rager",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 3,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "rager",
            "count": 50,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 3
          },
          {
            "type": "igniter",
            "count": 4,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "startDelay": 5,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L5:HD": {
    "sourceLevelId": "L5",
    "levelNumber": 5,
    "levelName": "1-5",
    "difficulty": "HD",
    "rating": 6,
    "mapId": 13,
    "mapName": "三线并行",
    "startGold": 600,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 4
          },
          {
            "type": "triangle",
            "count": 5,
            "interval": 0.4,
            "level": 30
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 2,
            "interval": 0.4,
            "level": 6
          }
        ]
      },
      {
        "groups": [
          {
            "type": "rager",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 0.4,
            "level": 15,
            "startDelay": 5,
            "isBoss": true
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 80
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L5:IN": {
    "sourceLevelId": "L5",
    "levelNumber": 5,
    "levelName": "1-5",
    "difficulty": "IN",
    "rating": 16,
    "mapId": 15,
    "mapName": "五线并行",
    "startGold": 100,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 8
          },
          {
            "type": "rager",
            "count": 5,
            "interval": 0.4,
            "level": 9,
            "startDelay": 10
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 25,
            "startDelay": 11
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 5,
            "interval": 0.4,
            "level": 10,
            "startDelay": 7
          },
          {
            "type": "rager",
            "count": 2,
            "interval": 0.4,
            "level": 1,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 60,
            "interval": 0.4,
            "level": 20,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 30,
            "interval": 0.4,
            "level": 15,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 35,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 120,
            "startDelay": 25,
            "isBoss": true
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 1,
            "interval": 0.4,
            "level": 120,
            "startDelay": 3,
            "isBoss": true
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 400,
            "startDelay": 4,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": [
      "hotPepper"
    ]
  },
  "L6:EZ": {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "EZ",
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
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 2,
            "startDelay": 15
          },
          {
            "type": "rager",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 3,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "rager",
            "count": 50,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 10,
            "interval": 0.4,
            "level": 3
          },
          {
            "type": "igniter",
            "count": 4,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "isBoss": true,
            "startDelay": 5
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L6:HD": {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "HD",
    "rating": 8,
    "mapId": 1,
    "mapName": "新手折线",
    "startGold": 3000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.2,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 4,
            "startDelay": 15
          },
          {
            "type": "square",
            "count": 50,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 100,
            "isBoss": true,
            "startDelay": 40
          },
          {
            "type": "angryWriter",
            "count": 100,
            "interval": 0.4,
            "level": 3,
            "startDelay": 50
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L6:IN": {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "IN",
    "rating": 13,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 200,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 8
          },
          {
            "type": "rager",
            "count": 40,
            "interval": 0.4,
            "level": 5,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 5,
            "interval": 0.4,
            "level": 10,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 60,
            "interval": 0.4,
            "level": 20,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 30,
            "interval": 0.4,
            "level": 15,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 35,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 80,
            "isBoss": true,
            "startDelay": 25
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 15
          },
          {
            "type": "purifier",
            "count": 100,
            "interval": 0.4,
            "level": 1,
            "startDelay": 15
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L6:AT": {
    "sourceLevelId": "L6",
    "levelNumber": 6,
    "levelName": "1-6",
    "difficulty": "AT",
    "rating": 14,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 1000,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 5,
            "startDelay": 5
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 7,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 6,
            "startDelay": 8
          },
          {
            "type": "rager",
            "count": 40,
            "interval": 0.4,
            "level": 5,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 4,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 5,
            "interval": 0.4,
            "level": 10,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 60,
            "interval": 0.4,
            "level": 20,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 30,
            "interval": 0.4,
            "level": 15,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 35,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 80,
            "isBoss": true,
            "startDelay": 25
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 500,
            "interval": 0.1,
            "level": 15,
            "startDelay": 0
          },
          {
            "type": "purifier",
            "count": 100,
            "interval": 0.4,
            "level": 1,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 20,
            "startDelay": 15
          },
          {
            "type": "evilSniper",
            "count": 30,
            "interval": 0.4,
            "level": 16,
            "startDelay": 20
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 200,
            "startDelay": 40,
            "isBoss": true
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 1.5,
        "maxQueue": 10,
        "pool": [
          {
            "kind": "plant",
            "id": "sunflower",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "puffShroom",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "machineGun",
            "weight": 100
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "sunlightFlower",
            "weight": 100
          }
        ]
      }
    },
    "unlockRewards": [
      "rocket"
    ]
  },
  "L7:EZ": {
    "sourceLevelId": "L7",
    "levelNumber": 7,
    "levelName": "1-7",
    "difficulty": "EZ",
    "rating": 5,
    "mapId": 7,
    "mapName": "左右蛇形",
    "startGold": 1200,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.55,
            "level": 2,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 6,
            "interval": 0.65,
            "level": 2,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 12,
            "interval": 0.5,
            "level": 3,
            "startDelay": 1
          },
          {
            "type": "square",
            "count": 6,
            "interval": 0.7,
            "level": 2,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 2,
            "interval": 1.2,
            "level": 2,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.48,
            "level": 3,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 2,
            "interval": 1.4,
            "level": 3,
            "startDelay": 4
          },
          {
            "type": "square",
            "count": 8,
            "interval": 0.65,
            "level": 3,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.42,
            "level": 4,
            "startDelay": 1
          },
          {
            "type": "igniter",
            "count": 4,
            "interval": 0.9,
            "level": 3,
            "startDelay": 4
          },
          {
            "type": "taunter",
            "count": 2,
            "interval": 1.3,
            "level": 4,
            "startDelay": 7
          },
          {
            "type": "freezer",
            "count": 2,
            "interval": 1.3,
            "level": 4,
            "startDelay": 10
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 24,
            "startDelay": 14,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L7:HD": {
    "sourceLevelId": "L7",
    "levelNumber": 7,
    "levelName": "1-7",
    "difficulty": "HD",
    "rating": 10,
    "mapId": 7,
    "mapName": "左右蛇形",
    "startGold": 900,
    "lives": 16,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.48,
            "level": 5,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 8,
            "interval": 0.58,
            "level": 5,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 16,
            "interval": 0.44,
            "level": 6,
            "startDelay": 1
          },
          {
            "type": "square",
            "count": 10,
            "interval": 0.65,
            "level": 6,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 1.1,
            "level": 5,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.4,
            "level": 7,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 3,
            "interval": 1.1,
            "level": 7,
            "startDelay": 4
          },
          {
            "type": "igniter",
            "count": 5,
            "interval": 0.8,
            "level": 6,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 8,
            "interval": 0.75,
            "level": 8,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 12,
            "interval": 0.42,
            "level": 8,
            "startDelay": 3
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 1,
            "level": 8,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 3,
            "interval": 1.1,
            "level": 8,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.36,
            "level": 9,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 16,
            "interval": 0.38,
            "level": 10,
            "startDelay": 3
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.9,
            "level": 10,
            "startDelay": 6
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 1,
            "level": 9,
            "startDelay": 9
          },
          {
            "type": "angryWriter",
            "count": 3,
            "interval": 1,
            "level": 12,
            "startDelay": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 55,
            "startDelay": 15,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L7:IN": {
    "sourceLevelId": "L7",
    "levelNumber": 7,
    "levelName": "1-7",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 7,
    "mapName": "左右蛇形",
    "startGold": 500,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.46,
            "level": 20,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.52,
            "level": 22,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 10,
            "interval": 0.62,
            "level": 24,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 1,
            "level": 22,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 1.1,
            "level": 20,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 8,
            "interval": 0.7,
            "level": 28,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 18,
            "interval": 0.4,
            "level": 26,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.72,
            "level": 25,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.95,
            "level": 28,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.34,
            "level": 32,
            "startDelay": 1
          },
          {
            "type": "angryWriter",
            "count": 6,
            "interval": 0.8,
            "level": 30,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 0.9,
            "level": 30,
            "startDelay": 7
          },
          {
            "type": "taunter",
            "count": 5,
            "interval": 0.85,
            "level": 32,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 4,
            "interval": 1.1,
            "level": 35,
            "startDelay": 1
          },
          {
            "type": "armored",
            "count": 12,
            "interval": 0.58,
            "level": 36,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.85,
            "level": 34,
            "startDelay": 7
          },
          {
            "type": "taunter",
            "count": 5,
            "interval": 0.8,
            "level": 36,
            "startDelay": 10
          },
          {
            "type": "purifier",
            "count": 3,
            "interval": 1,
            "level": 32,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 24,
            "interval": 0.3,
            "level": 40,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.32,
            "level": 42,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 8,
            "interval": 0.62,
            "level": 40,
            "startDelay": 5
          },
          {
            "type": "taunter",
            "count": 6,
            "interval": 0.72,
            "level": 45,
            "startDelay": 7
          },
          {
            "type": "freezer",
            "count": 6,
            "interval": 0.75,
            "level": 42,
            "startDelay": 9
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.8,
            "level": 48,
            "startDelay": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 180,
            "startDelay": 16,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L8:EZ": {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "EZ",
    "rating": 6,
    "mapId": 4,
    "mapName": "中心回廊",
    "startGold": 800,
    "lives": 1,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "count": 300,
            "interval": 0.2,
            "level": 5,
            "type": "circle"
          },
          {
            "count": 1,
            "interval": 0.1,
            "level": 400,
            "type": "bunker"
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L8:HD": {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "HD",
    "rating": 13,
    "mapId": 8,
    "mapName": "上路压迫",
    "startGold": 700,
    "lives": 14,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 18,
            "interval": 0.42,
            "level": 12,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 12,
            "interval": 0.46,
            "level": 13,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 12,
            "interval": 0.58,
            "level": 14,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.95,
            "level": 13,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 1,
            "level": 12,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 10,
            "interval": 0.68,
            "level": 16,
            "startDelay": 1
          },
          {
            "type": "circle",
            "count": 20,
            "interval": 0.36,
            "level": 15,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.7,
            "level": 15,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 4,
            "interval": 0.85,
            "level": 16,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.32,
            "level": 18,
            "startDelay": 1
          },
          {
            "type": "angryWriter",
            "count": 6,
            "interval": 0.75,
            "level": 18,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.85,
            "level": 17,
            "startDelay": 7
          },
          {
            "type": "purifier",
            "count": 3,
            "interval": 1,
            "level": 16,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 4,
            "interval": 1,
            "level": 20,
            "startDelay": 1
          },
          {
            "type": "armored",
            "count": 14,
            "interval": 0.52,
            "level": 21,
            "startDelay": 3
          },
          {
            "type": "taunter",
            "count": 5,
            "interval": 0.75,
            "level": 20,
            "startDelay": 6
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.8,
            "level": 20,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 26,
            "interval": 0.28,
            "level": 22,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 22,
            "interval": 0.3,
            "level": 24,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 8,
            "interval": 0.58,
            "level": 22,
            "startDelay": 5
          },
          {
            "type": "taunter",
            "count": 6,
            "interval": 0.68,
            "level": 24,
            "startDelay": 7
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 0.72,
            "level": 22,
            "startDelay": 9
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.75,
            "level": 24,
            "startDelay": 11
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 100,
            "startDelay": 16,
            "isBoss": true,
            "bossSpeed": 0.55
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L8:IN": {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 700,
    "lives": 12,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.46,
            "level": 1000,
            "startDelay": 1,
            "isBoss": true,
            "bossSpeed": 0.1
          },
          {
            "type": "triangle",
            "count": 25,
            "interval": 0.52,
            "level": 22,
            "startDelay": 10
          },
          {
            "type": "circle",
            "count": 20,
            "interval": 0.4,
            "level": 24,
            "startDelay": 30
          },
          {
            "type": "healer",
            "count": 20,
            "interval": 0.4,
            "level": 21,
            "startDelay": 50
          },
          {
            "type": "armored",
            "count": 10,
            "interval": 0.4,
            "level": 18,
            "startDelay": 70
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 150,
            "startDelay": 80,
            "isBoss": true
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  "L8:AT": {
    "sourceLevelId": "L8",
    "levelNumber": 8,
    "levelName": "1-8",
    "difficulty": "AT",
    "rating": 14,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 600,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 0.4,
            "level": 3,
            "startDelay": 15
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 7,
            "startDelay": 25
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 18,
            "interval": 0.4,
            "level": 8
          },
          {
            "type": "square",
            "count": 5,
            "interval": 0.4,
            "level": 12
          },
          {
            "type": "armored",
            "count": 5,
            "interval": 0.4,
            "level": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "square",
            "count": 80,
            "interval": 0.4,
            "level": 2,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 160,
            "interval": 0.4,
            "level": 1,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 1,
            "interval": 0.4,
            "level": 500,
            "startDelay": 1,
            "isBoss": true,
            "bossSpeed": 0.3
          },
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.4,
            "level": 3,
            "startDelay": 5
          },
          {
            "type": "bunker",
            "count": 6,
            "interval": 0.4,
            "level": 8,
            "startDelay": 10
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "phantom",
      "phantom": {
        "subMode": "normal"
      }
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.03
    },
    "unlockRewards": [
      "flameBottleGrass"
    ]
  }
};

export const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = BALANCE_LAB_LEVEL_DRAFTS[0] as BalanceLabLevelDraft;
