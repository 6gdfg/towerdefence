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
    "contributor": "驱蚊花露水",
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
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
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
  },
  {
    "sourceLevelId": "L9",
    "levelNumber": 9,
    "levelName": "2-1",
    "difficulty": "EZ",
    "rating": 4,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 1000,
    "lives": 20,
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
            "type": "windShield",
            "count": 5,
            "interval": 0.4,
            "level": 3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 150,
            "interval": 0.2,
            "level": 1,
            "startDelay": 8
          },
          {
            "type": "evilSniper",
            "count": 2,
            "interval": 0.4,
            "level": 15,
            "startDelay": 38
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 12,
            "interval": 0.4,
            "level": 5,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 4,
            "startDelay": 6
          },
          {
            "type": "windEye",
            "count": 10,
            "interval": 0.4,
            "level": 20,
            "startDelay": 9,
            "isBoss": true
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "element:wind"
    ]
  },
  {
    "sourceLevelId": "L9",
    "levelNumber": 9,
    "levelName": "2-1",
    "difficulty": "HD",
    "rating": 10,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 850,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 16,
            "interval": 0.35,
            "level": 8
          },
          {
            "type": "windShield",
            "count": 8,
            "interval": 0.48,
            "level": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 22,
            "interval": 0.28,
            "level": 9
          },
          {
            "type": "igniter",
            "count": 8,
            "interval": 0.45,
            "level": 8,
            "startDelay": 2.5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.34,
            "level": 11
          },
          {
            "type": "windShield",
            "count": 10,
            "interval": 0.42,
            "level": 10,
            "startDelay": 1.5
          },
          {
            "type": "rager",
            "count": 2,
            "interval": 0.7,
            "level": 9,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 20,
            "interval": 0.25,
            "level": 12
          },
          {
            "type": "windShield",
            "count": 8,
            "interval": 0.4,
            "level": 12,
            "startDelay": 2
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.5,
            "level": 11,
            "startDelay": 4.5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 10,
            "interval": 0.42,
            "level": 14
          },
          {
            "type": "circle",
            "count": 16,
            "interval": 0.3,
            "level": 14,
            "startDelay": 2.5
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.1,
            "level": 30,
            "isBoss": true,
            "startDelay": 6
          }
        ]
      }
    ],
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L9",
    "levelNumber": 9,
    "levelName": "2-1",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 200,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "triangle",
            "count": 3,
            "interval": 0.4,
            "level": 15
          },
          {
            "type": "circle",
            "count": 2,
            "interval": 0.4,
            "level": 18
          },
          {
            "type": "square",
            "count": 1,
            "interval": 0.4,
            "level": 20
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 3,
            "interval": 0.4,
            "level": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 16,
            "startDelay": 6
          },
          {
            "type": "windEye",
            "count": 10,
            "interval": 0.4,
            "level": 14,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 100,
            "interval": 0.1,
            "level": 12
          },
          {
            "type": "circle",
            "count": 100,
            "interval": 0.1,
            "level": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 17,
            "interval": 0.4,
            "level": 25,
            "startDelay": 3
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 19,
            "startDelay": 9
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 130,
            "startDelay": 15,
            "isBoss": true
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 180,
            "startDelay": 25,
            "isBoss": true,
            "bossSpeed": 0.3
          },
          {
            "type": "taunter",
            "count": 88,
            "interval": 0.4,
            "level": 1,
            "startDelay": 35
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L9",
    "levelNumber": 9,
    "levelName": "2-1",
    "difficulty": "AT",
    "rating": 16,
    "mapId": 1,
    "mapName": "新手折线",
    "startGold": 1200,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 16,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 8,
            "interval": 0.4,
            "level": 21,
            "startDelay": 5
          },
          {
            "type": "windShield",
            "count": 10,
            "interval": 0.4,
            "level": 17,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 1,
            "interval": 0.4,
            "level": 30,
            "startDelay": 15
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 7,
            "startDelay": 16
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.4,
            "level": 13,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 2,
            "interval": 0.4,
            "level": 16,
            "startDelay": 3
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 70,
            "startDelay": 4,
            "isBoss": true,
            "bossSpeed": 0.5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 200,
            "interval": 0.2,
            "level": 10,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 1,
            "interval": 0.4,
            "level": 100,
            "startDelay": 5,
            "isBoss": true,
            "bossSpeed": 0.6
          },
          {
            "type": "windEye",
            "count": 2,
            "interval": 0.4,
            "level": 80,
            "isBoss": true,
            "startDelay": 7,
            "bossSpeed": 0.5
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "flexible",
      "flexible": {
        "mode": "random",
        "mapIds": [
          1,
          2,
          3,
          4,
          5,
          10,
          7,
          6,
          11,
          8,
          9,
          16,
          17
        ]
      }
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L10",
    "levelNumber": 10,
    "levelName": "2-2",
    "contributor": "驱蚊花露水",
    "difficulty": "EZ",
    "rating": 7,
    "mapId": 1,
    "mapName": "新手折线",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0,
    "waves": [
      {
        "groups": [
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 10,
            "isBoss": true
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 12
          },
          {
            "type": "windShield",
            "count": 40,
            "interval": 0.1,
            "level": 20
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L10",
    "levelNumber": 10,
    "levelName": "2-2",
    "contributor": "驱蚊花露水",
    "difficulty": "HD",
    "rating": 15,
    "mapId": 17,
    "mapName": "H",
    "startGold": 2000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 30,
            "interval": 0.4,
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 40,
            "interval": 0.1,
            "level": 1
          },
          {
            "type": "bunker",
            "count": 4,
            "interval": 0.4,
            "level": 50
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "machineGun"
    ]
  },
  {
    "sourceLevelId": "L10",
    "levelNumber": 10,
    "levelName": "2-2",
    "contributor": "驱蚊花露水",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 14,
    "mapName": "四线并行",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 19,
            "interval": 0.1,
            "level": 1000,
            "isBoss": true,
            "bossSpeed": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.1,
            "level": 1000,
            "isBoss": true,
            "bossSpeed": 0.1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 5,
            "interval": 1,
            "level": 10000,
            "isBoss": true,
            "bossSpeed": 3
          },
          {
            "type": "circle",
            "count": 100,
            "interval": 0.1,
            "level": 1
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L10",
    "levelNumber": 10,
    "levelName": "2-2",
    "contributor": "驱蚊花露水",
    "difficulty": "AT",
    "rating": 16,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 50,
            "interval": 0.1,
            "level": 10,
            "isBoss": true,
            "bossSpeed": 0.1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 60,
            "interval": 0.1,
            "level": 1,
            "isBoss": true,
            "bossSpeed": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 60,
            "interval": 0.1,
            "level": 10,
            "isBoss": true,
            "bossSpeed": 2
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 0.2,
        "maxQueue": 25,
        "pool": [
          {
            "kind": "element",
            "id": "fire",
            "weight": 1
          },
          {
            "kind": "element",
            "id": "ice",
            "weight": 1
          },
          {
            "kind": "element",
            "id": "wind",
            "weight": 1
          },
          {
            "kind": "element",
            "id": "electric",
            "weight": 1
          },
          {
            "kind": "element",
            "id": "gold",
            "weight": 1
          },
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 1
          }
        ]
      }
    },
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L11",
    "levelNumber": 11,
    "levelName": "2-3",
    "contributor": "驱蚊花露水",
    "difficulty": "EZ",
    "rating": 7,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 160,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 70,
            "interval": 0.1,
            "level": 70,
            "isBoss": true,
            "bossSpeed": 1.5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 20,
            "interval": 0.4,
            "level": 20
          },
          {
            "type": "taunter",
            "count": 10,
            "interval": 0.1,
            "level": 100
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L11",
    "levelNumber": 11,
    "levelName": "2-3",
    "contributor": "驱蚊花露水",
    "difficulty": "HD",
    "rating": 15,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.1,
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.1,
            "level": 1
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 50,
            "isBoss": true
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 100,
            "interval": 0.1,
            "level": 1
          },
          {
            "type": "bunker",
            "count": 2,
            "interval": 0.4,
            "level": 50,
            "isBoss": true
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.1,
            "level": 50
          },
          {
            "type": "windShield",
            "count": 100,
            "interval": 0.1,
            "level": 1,
            "isBoss": true
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L11",
    "levelNumber": 11,
    "levelName": "2-3",
    "difficulty": "IN",
    "rating": 17,
    "mapId": 17,
    "mapName": "H",
    "startGold": 200,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 14,
            "startDelay": 10
          },
          {
            "type": "triangle",
            "count": 4,
            "interval": 0.4,
            "level": 18,
            "startDelay": 18
          },
          {
            "type": "windShield",
            "count": 1,
            "interval": 0.4,
            "level": 25,
            "startDelay": 18
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 28,
            "startDelay": 6
          },
          {
            "type": "square",
            "count": 4,
            "interval": 0.4,
            "level": 35,
            "startDelay": 6
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 16,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 8,
            "interval": 0.4,
            "level": 43,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 15,
            "interval": 0.4,
            "level": 29,
            "startDelay": 7
          },
          {
            "type": "angryWriter",
            "count": 24,
            "interval": 0.4,
            "level": 38,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windEye",
            "count": 2,
            "interval": 0.4,
            "level": 276,
            "startDelay": 3,
            "isBoss": true,
            "bossSpeed": 1
          },
          {
            "type": "taunter",
            "count": 25,
            "interval": 0.4,
            "level": 31,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "freezer",
            "count": 100,
            "interval": 0.4,
            "level": 11
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 35,
            "interval": 0.3,
            "level": 57,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 46,
            "interval": 0.2,
            "level": 66,
            "startDelay": 8
          },
          {
            "type": "angryWriter",
            "count": 18,
            "interval": 0.4,
            "level": 61,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.2,
            "level": 188,
            "isBoss": true,
            "bossSpeed": 0.5,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 66,
            "interval": 0.4,
            "level": 34,
            "startDelay": 18
          }
        ]
      },
      {
        "groups": [
          {
            "type": "evilSniper",
            "count": 60,
            "interval": 0.1,
            "level": 21,
            "startDelay": 5
          },
          {
            "type": "taunter",
            "count": 1,
            "interval": 0.4,
            "level": 333,
            "startDelay": 8,
            "isBoss": true,
            "bossSpeed": 1.2
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 15,
            "interval": 0.4,
            "level": 73,
            "startDelay": 4
          },
          {
            "type": "angryWriter",
            "count": 25,
            "interval": 0.4,
            "level": 77,
            "startDelay": 8
          },
          {
            "type": "windEye",
            "count": 3,
            "interval": 0.4,
            "level": 307,
            "isBoss": true,
            "bossSpeed": 0.8,
            "startDelay": 15
          },
          {
            "type": "igniter",
            "count": 20,
            "interval": 0.4,
            "level": 50,
            "startDelay": 27
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "boomerangLeaf"
    ]
  },
  {
    "sourceLevelId": "L12",
    "levelNumber": 12,
    "levelName": "2-4",
    "contributor": "",
    "difficulty": "EZ",
    "rating": 8,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 700,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 14,
            "interval": 0.4,
            "level": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.45,
            "level": 12
          },
          {
            "type": "circle",
            "count": 12,
            "interval": 0.5,
            "level": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 8,
            "interval": 0.55,
            "level": 13
          },
          {
            "type": "balloonSoldier",
            "count": 1,
            "interval": 0.8,
            "level": 9,
            "startDelay": 4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 18,
            "interval": 0.35,
            "level": 6
          },
          {
            "type": "balloonSoldier",
            "count": 2,
            "interval": 0.75,
            "level": 6,
            "startDelay": 3
          },
          {
            "type": "windShield",
            "count": 6,
            "interval": 0.6,
            "level": 14,
            "startDelay": 6
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 50,
            "isBoss": true,
            "bossSpeed": 0.7
          },
          {
            "type": "windShield",
            "count": 10,
            "interval": 0.45,
            "level": 6,
            "startDelay": 2
          },
          {
            "type": "balloonSoldier",
            "count": 2,
            "interval": 0.8,
            "level": 14,
            "startDelay": 5
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L12",
    "levelNumber": 12,
    "levelName": "2-4",
    "contributor": "驱蚊花露水",
    "difficulty": "HD",
    "rating": 10,
    "mapId": 4,
    "mapName": "中心回廊",
    "startGold": 450,
    "lives": 1,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0,
    "waves": [
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 40,
            "interval": 0.1,
            "level": 100,
            "isBoss": true
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L12",
    "levelNumber": 12,
    "levelName": "2-4",
    "contributor": "",
    "difficulty": "IN",
    "rating": 16,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 300,
    "lives": 10,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "balloonSoldier",
            "count": 8,
            "interval": 2,
            "level": 14,
            "startDelay": 8
          },
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 12,
            "startDelay": 13
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 5,
            "interval": 0.4,
            "level": 16,
            "startDelay": 5
          },
          {
            "type": "triangle",
            "count": 7,
            "interval": 0.4,
            "level": 18,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 2,
            "interval": 0.4,
            "level": 25,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 7,
            "interval": 0.4,
            "level": 23,
            "startDelay": 6
          },
          {
            "type": "iceShell",
            "count": 4,
            "interval": 0.4,
            "level": 24,
            "startDelay": 10
          },
          {
            "type": "armorRepairer",
            "count": 30,
            "interval": 0.4,
            "level": 6,
            "startDelay": 14
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 1,
            "interval": 0.4,
            "level": 200,
            "isBoss": true,
            "startDelay": 2,
            "bossSpeed": 0.7
          },
          {
            "type": "healer",
            "count": 59,
            "interval": 0.4,
            "level": 8,
            "startDelay": 8
          },
          {
            "type": "armorRepairer",
            "count": 27,
            "interval": 0.4,
            "level": 7,
            "startDelay": 16
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 11,
            "interval": 0.4,
            "level": 29,
            "startDelay": 6
          },
          {
            "type": "angryWriter",
            "count": 13,
            "interval": 0.4,
            "level": 35,
            "startDelay": 7
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 6,
            "interval": 0.4,
            "level": 52,
            "startDelay": 6
          },
          {
            "type": "windEye",
            "count": 3,
            "interval": 0.4,
            "level": 64,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "balloonSoldier",
            "count": 20,
            "interval": 6,
            "level": 7,
            "startDelay": 3
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 555,
            "isBoss": true,
            "bossSpeed": 0.4,
            "startDelay": 6
          },
          {
            "type": "taunter",
            "count": 16,
            "interval": 0.4,
            "level": 27,
            "startDelay": 7
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L12",
    "levelNumber": 12,
    "levelName": "2-4",
    "contributor": "",
    "difficulty": "AT",
    "rating": 15,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 1000,
    "lives": 14,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "square",
            "count": 20,
            "interval": 0.4,
            "level": 13,
            "startDelay": 2
          },
          {
            "type": "square",
            "count": 20,
            "interval": 0.4,
            "level": 26,
            "startDelay": 4
          },
          {
            "type": "bunker",
            "count": 20,
            "interval": 0.4,
            "level": 29,
            "startDelay": 6
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 200,
            "interval": 0.4,
            "level": 47,
            "startDelay": 1
          },
          {
            "type": "freezer",
            "count": 100,
            "interval": 0.6,
            "level": 53,
            "startDelay": 3
          },
          {
            "type": "circle",
            "count": 200,
            "interval": 0.4,
            "level": 66,
            "startDelay": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 1000,
            "isBoss": true,
            "bossSpeed": 0.4,
            "startDelay": 1
          },
          {
            "type": "taunter",
            "count": 500,
            "interval": 0.4,
            "level": 15,
            "startDelay": 2
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "lastStand",
      "lastStand": {
        "startGold": 8000,
        "bannedPlants": [
          "sunflower"
        ],
        "killReward": 1
      }
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "windWallGrass"
    ]
  },
  {
    "sourceLevelId": "L13",
    "levelNumber": 13,
    "levelName": "2-5",
    "contributor": "驱蚊花露水",
    "difficulty": "EZ",
    "rating": 8,
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
            "type": "evilSniper",
            "count": 10,
            "interval": 0.4,
            "level": 1
          },
          {
            "type": "iceShell",
            "count": 10,
            "interval": 0.4,
            "level": 10
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
            "isBoss": true
          },
          {
            "type": "taunter",
            "count": 10,
            "interval": 0.4,
            "level": 10
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "puffShroom"
    ]
  },
  {
    "sourceLevelId": "L13",
    "levelNumber": 13,
    "levelName": "2-5",
    "contributor": "驱蚊花露水",
    "difficulty": "HD",
    "rating": 10,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "summoner",
            "count": 10,
            "interval": 0.4,
            "level": 7
          },
          {
            "type": "taunter",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "isBoss": true,
            "bossSpeed": 1
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "summoner",
            "count": 10,
            "interval": 0.4,
            "level": 7
          },
          {
            "type": "balloonSoldier",
            "count": 10,
            "interval": 0.1,
            "level": 7,
            "isBoss": true,
            "bossSpeed": 1
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L13",
    "levelNumber": 13,
    "levelName": "2-5",
    "contributor": "驱蚊花露水",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 8,
    "mapName": "上路压迫",
    "startGold": 950,
    "lives": 1,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "bunker",
            "count": 100,
            "interval": 0.1,
            "level": 20,
            "isBoss": true,
            "bossSpeed": 1
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L13",
    "levelNumber": 13,
    "levelName": "2-5",
    "contributor": "驱蚊花露水",
    "difficulty": "AT",
    "rating": 16,
    "mapId": 2,
    "mapName": "双弯小道",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": false,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "taunter",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "evilSniper",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "freezer",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "armorRepairer",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "windEye",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "rager",
            "count": 10,
            "interval": 0.4,
            "level": 1
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 1
          },
          {
            "type": "purifier",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "summoner",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "healer",
            "count": 10,
            "interval": 0.4,
            "level": 10
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "conveyor",
      "conveyor": {
        "intervalSec": 0.2,
        "maxQueue": 15,
        "pool": [
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "bottleGrass",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "boomerangLeaf",
            "weight": 100
          }
        ]
      }
    },
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L14",
    "levelNumber": 14,
    "levelName": "2-6",
    "contributor": "驱蚊花露水",
    "difficulty": "EZ",
    "rating": 8,
    "mapId": 16,
    "mapName": "一横两弯",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "balloonSoldier",
            "count": 10,
            "interval": 0.1,
            "level": 100,
            "pathId": 2
          },
          {
            "type": "balloonSoldier",
            "count": 10,
            "interval": 0.1,
            "level": 100,
            "pathId": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "freezer",
            "count": 10,
            "interval": 1,
            "level": 10
          },
          {
            "type": "summoner",
            "count": 10,
            "interval": 0.4,
            "level": 10
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L14",
    "levelNumber": 14,
    "levelName": "2-6",
    "contributor": "",
    "difficulty": "HD",
    "rating": 12,
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
            "type": "freezer",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "evilSniper",
            "count": 10,
            "interval": 0.4,
            "level": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "evilSniper",
            "count": 10,
            "interval": 0.4,
            "level": 10
          },
          {
            "type": "balloonSoldier",
            "count": 10,
            "interval": 0.4,
            "level": 10,
            "isBoss": true
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L14",
    "levelNumber": 14,
    "levelName": "2-6",
    "contributor": "驱蚊花露水",
    "difficulty": "IN",
    "rating": 15,
    "mapId": 1000,
    "mapName": "训练回环",
    "startGold": 150,
    "lives": 1,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "balloonSoldier",
            "count": 50,
            "interval": 0.1,
            "level": 1000,
            "isBoss": true
          },
          {
            "type": "balloonSoldier",
            "count": 10,
            "interval": 0.4,
            "level": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.1,
            "level": 100,
            "isBoss": true
          },
          {
            "type": "windEye",
            "count": 10,
            "interval": 0.4,
            "level": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 100,
            "interval": 0.1,
            "level": 100,
            "isBoss": true
          },
          {
            "type": "windEye",
            "count": 10,
            "interval": 0.4,
            "level": 10
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L14",
    "levelNumber": 14,
    "levelName": "2-6",
    "contributor": "",
    "difficulty": "AT",
    "rating": 17,
    "mapId": 11,
    "mapName": "双入口合流",
    "startGold": 250,
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
            "level": 12,
            "startDelay": 8
          },
          {
            "type": "triangle",
            "count": 1,
            "interval": 0.4,
            "level": 14,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "evilSniper",
            "count": 3,
            "interval": 0.4,
            "level": 15
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 5,
            "interval": 0.4,
            "level": 18,
            "startDelay": 3
          },
          {
            "type": "angryWriter",
            "count": 2,
            "interval": 0.4,
            "level": 20,
            "startDelay": 6
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.4,
            "level": 21,
            "startDelay": 7
          },
          {
            "type": "square",
            "count": 5,
            "interval": 0.4,
            "level": 24,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 280,
            "startDelay": 2,
            "isBoss": true,
            "bossSpeed": 1
          },
          {
            "type": "healer",
            "count": 20,
            "interval": 0.2,
            "level": 28,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 26,
            "interval": 0.4,
            "level": 35,
            "startDelay": 1
          },
          {
            "type": "armored",
            "count": 10,
            "interval": 0.4,
            "level": 38,
            "startDelay": 3
          },
          {
            "type": "armorRepairer",
            "count": 15,
            "interval": 0.4,
            "level": 39,
            "startDelay": 5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "summoner",
            "count": 16,
            "interval": 0.4,
            "level": 45,
            "startDelay": 3
          },
          {
            "type": "freezer",
            "count": 30,
            "interval": 0.4,
            "level": 48,
            "startDelay": 5
          },
          {
            "type": "windEye",
            "count": 5,
            "interval": 0.4,
            "level": 55,
            "startDelay": 6
          },
          {
            "type": "igniter",
            "count": 30,
            "interval": 0.2,
            "level": 52,
            "startDelay": 10
          },
          {
            "type": "evilSniper",
            "count": 50,
            "interval": 0.4,
            "level": 53,
            "startDelay": 15
          },
          {
            "type": "balloonSoldier",
            "count": 25,
            "interval": 0.6,
            "level": 55,
            "startDelay": 15
          },
          {
            "type": "taunter",
            "count": 100,
            "interval": 0.2,
            "level": 53,
            "startDelay": 18
          }
        ]
      },
      {
        "groups": [
          {
            "type": "tank",
            "count": 1,
            "interval": 0.4,
            "level": 400,
            "startDelay": 1,
            "isBoss": true,
            "bossSpeed": 0.05
          },
          {
            "type": "healer",
            "count": 100,
            "interval": 0.4,
            "level": 57,
            "startDelay": 2
          },
          {
            "type": "armorRepairer",
            "count": 100,
            "interval": 0.4,
            "level": 60,
            "startDelay": 3
          },
          {
            "type": "balloonSoldier",
            "count": 29,
            "interval": 0.8,
            "level": 50,
            "startDelay": 10
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "normal"
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "antiAirTree"
    ]
  },
  {
    "rating": 10,
    "contributor": "",
    "lives": 20,
    "specialEnemyConfig": {
      "chance": 0.1,
      "type": "charityAmbassador",
      "enabled": false
    },
    "levelNumber": 15,
    "startGold": 1200,
    "difficulty": "EZ",
    "waves": [
      {
        "groups": [
          {
            "count": 18,
            "startDelay": 0,
            "interval": 0.45,
            "level": 10,
            "type": "circle"
          },
          {
            "count": 8,
            "startDelay": 4,
            "interval": 0.55,
            "level": 12,
            "type": "triangle"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 12,
            "startDelay": 0,
            "interval": 0.6,
            "level": 20,
            "type": "square"
          },
          {
            "count": 20,
            "startDelay": 3,
            "interval": 0.35,
            "level": 18,
            "type": "circle"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 10,
            "startDelay": 0,
            "interval": 0.55,
            "level": 28,
            "type": "windShield"
          },
          {
            "count": 4,
            "startDelay": 4,
            "interval": 1.2,
            "level": 30,
            "type": "evilSniper"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 8,
            "startDelay": 0,
            "interval": 0.65,
            "level": 40,
            "type": "armored"
          },
          {
            "count": 5,
            "startDelay": 3,
            "interval": 1.1,
            "level": 40,
            "type": "freezer"
          },
          {
            "count": 24,
            "startDelay": 6,
            "interval": 0.28,
            "level": 38,
            "type": "circle"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 6,
            "startDelay": 0,
            "interval": 1.1,
            "level": 48,
            "type": "summoner"
          },
          {
            "count": 2,
            "startDelay": 4,
            "interval": 2,
            "level": 50,
            "type": "windEye"
          },
          {
            "count": 10,
            "startDelay": 7,
            "interval": 0.65,
            "level": 55,
            "type": "taunter"
          }
        ]
      },
      {
        "groups": [
          {
            "startDelay": 0,
            "isBoss": true,
            "level": 140,
            "type": "bunker",
            "count": 1,
            "interval": 0.5,
            "bossSpeed": 0.7
          },
          {
            "count": 5,
            "startDelay": 4,
            "interval": 1.2,
            "level": 50,
            "type": "healer"
          },
          {
            "count": 8,
            "startDelay": 8,
            "interval": 0.8,
            "level": 55,
            "type": "balloonSoldier"
          }
        ]
      }
    ],
    "sourceLevelId": "L15",
    "mapId": 11,
    "levelName": "2-7",
    "firstWaveDelaySec": 0.8,
    "autoStartFirstWave": true,
    "unlockRewards": [],
    "mapName": "?????"
  },
  {
    "rating": 14,
    "contributor": "",
    "lives": 16,
    "specialEnemyConfig": {
      "chance": 0.1,
      "type": "charityAmbassador",
      "enabled": false
    },
    "levelNumber": 15,
    "startGold": 1600,
    "difficulty": "HD",
    "waves": [
      {
        "groups": [
          {
            "count": 25,
            "startDelay": 0,
            "interval": 0.38,
            "level": 15,
            "type": "circle"
          },
          {
            "count": 15,
            "startDelay": 4,
            "interval": 0.45,
            "level": 18,
            "type": "triangle"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 16,
            "startDelay": 0,
            "interval": 0.45,
            "level": 25,
            "type": "windShield"
          },
          {
            "count": 20,
            "startDelay": 3,
            "interval": 0.4,
            "level": 28,
            "type": "square"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 15,
            "startDelay": 0,
            "interval": 0.5,
            "level": 40,
            "type": "armored"
          },
          {
            "count": 8,
            "startDelay": 4,
            "interval": 0.8,
            "level": 42,
            "type": "evilSniper"
          },
          {
            "count": 20,
            "startDelay": 7,
            "interval": 0.35,
            "level": 40,
            "type": "igniter"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 12,
            "startDelay": 0,
            "interval": 0.65,
            "level": 55,
            "type": "freezer"
          },
          {
            "count": 8,
            "startDelay": 4,
            "interval": 0.8,
            "level": 58,
            "type": "healer"
          },
          {
            "count": 10,
            "startDelay": 7,
            "interval": 0.7,
            "level": 60,
            "type": "balloonSoldier"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 10,
            "startDelay": 0,
            "interval": 0.75,
            "level": 70,
            "type": "summoner"
          },
          {
            "count": 4,
            "startDelay": 4,
            "interval": 1.3,
            "level": 72,
            "type": "windEye"
          },
          {
            "count": 18,
            "startDelay": 8,
            "interval": 0.4,
            "level": 75,
            "type": "taunter"
          }
        ]
      },
      {
        "groups": [
          {
            "count": 12,
            "startDelay": 0,
            "interval": 0.7,
            "level": 80,
            "type": "armorRepairer"
          },
          {
            "count": 16,
            "startDelay": 4,
            "interval": 0.5,
            "level": 82,
            "type": "armored"
          },
          {
            "count": 45,
            "startDelay": 7,
            "interval": 0.2,
            "level": 85,
            "type": "circle"
          }
        ]
      },
      {
        "groups": [
          {
            "startDelay": 0,
            "isBoss": true,
            "level": 220,
            "type": "bunker",
            "count": 1,
            "interval": 0.5,
            "bossSpeed": 0.7
          },
          {
            "count": 12,
            "startDelay": 3,
            "interval": 0.6,
            "level": 82,
            "type": "healer"
          },
          {
            "count": 10,
            "startDelay": 5,
            "interval": 0.7,
            "level": 85,
            "type": "armorRepairer"
          },
          {
            "count": 20,
            "startDelay": 8,
            "interval": 0.45,
            "level": 80,
            "type": "balloonSoldier"
          },
          {
            "count": 22,
            "startDelay": 10,
            "interval": 0.35,
            "level": 85,
            "type": "taunter"
          }
        ]
      }
    ],
    "sourceLevelId": "L15",
    "mapId": 11,
    "levelName": "2-7",
    "firstWaveDelaySec": 0.8,
    "autoStartFirstWave": true,
    "unlockRewards": [],
    "mapName": "?????"
  },
  {
    "sourceLevelId": "L15",
    "levelNumber": 15,
    "levelName": "2-7",
    "contributor": "",
    "difficulty": "IN",
    "rating": 16,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 100,
    "lives": 15,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 3,
            "interval": 0.4,
            "level": 13,
            "startDelay": 10
          },
          {
            "type": "freezer",
            "count": 2,
            "interval": 0.4,
            "level": 10,
            "startDelay": 13
          }
        ]
      },
      {
        "groups": [
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 18,
            "startDelay": 5
          },
          {
            "type": "armored",
            "count": 2,
            "interval": 0.4,
            "level": 25,
            "startDelay": 9
          },
          {
            "type": "armorRepairer",
            "count": 5,
            "interval": 0.4,
            "level": 21,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 20,
            "interval": 0.4,
            "level": 30,
            "startDelay": 5
          },
          {
            "type": "angryWriter",
            "count": 5,
            "interval": 0.4,
            "level": 34,
            "startDelay": 12
          },
          {
            "type": "balloonSoldier",
            "count": 16,
            "interval": 0.5,
            "level": 25,
            "startDelay": 13
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 120,
            "startDelay": 16,
            "isBoss": true,
            "bossSpeed": 0.4
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 0.4,
            "level": 29,
            "startDelay": 24
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 30,
            "interval": 0.4,
            "level": 46,
            "startDelay": 3
          },
          {
            "type": "windShield",
            "count": 16,
            "interval": 0.4,
            "level": 50,
            "startDelay": 6
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 180,
            "startDelay": 10,
            "isBoss": true,
            "bossSpeed": 0.6
          },
          {
            "type": "igniter",
            "count": 20,
            "interval": 0.4,
            "level": 52,
            "startDelay": 14
          }
        ]
      },
      {
        "groups": [
          {
            "type": "summoner",
            "count": 24,
            "interval": 0.4,
            "level": 60,
            "startDelay": 2
          },
          {
            "type": "healer",
            "count": 50,
            "interval": 0.3,
            "level": 63,
            "startDelay": 4
          },
          {
            "type": "tank",
            "count": 1,
            "interval": 0.4,
            "level": 150,
            "startDelay": 6,
            "isBoss": true,
            "bossSpeed": 0.07
          },
          {
            "type": "taunter",
            "count": 41,
            "interval": 0.4,
            "level": 65,
            "startDelay": 9
          },
          {
            "type": "freezer",
            "count": 10,
            "interval": 0.4,
            "level": 69,
            "startDelay": 12
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 200,
            "startDelay": 15,
            "isBoss": true,
            "bossSpeed": 0.3
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L15",
    "levelNumber": 15,
    "levelName": "2-7",
    "contributor": "hebscyf",
    "difficulty": "AT",
    "rating": 18,
    "mapId": 10,
    "mapName": "交错回环",
    "startGold": 1000,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 10,
            "interval": 0.4,
            "level": 40,
            "startDelay": 0
          },
          {
            "type": "balloonSoldier",
            "count": 10,
            "interval": 2,
            "level": 100,
            "startDelay": 1
          },
          {
            "type": "triangle",
            "count": 10,
            "interval": 1.1,
            "level": 40,
            "startDelay": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "summoner",
            "count": 1,
            "interval": 0.4,
            "level": 1500,
            "isBoss": true,
            "bossSpeed": 1,
            "startDelay": 0
          },
          {
            "type": "taunter",
            "count": 1,
            "interval": 0.4,
            "level": 1500,
            "startDelay": 0,
            "isBoss": true,
            "bossSpeed": 1
          },
          {
            "type": "summoner",
            "count": 50,
            "interval": 0.11,
            "level": 300
          }
        ]
      },
      {
        "groups": [
          {
            "type": "freezer",
            "count": 10,
            "interval": 0.5,
            "level": 301,
            "startDelay": 0
          },
          {
            "type": "angryWriter",
            "count": 10,
            "interval": 3.1,
            "level": 1500,
            "startDelay": 0,
            "isBoss": true
          },
          {
            "type": "taunter",
            "count": 100,
            "interval": 0.1,
            "level": 500,
            "startDelay": 0
          },
          {
            "type": "armored",
            "count": 521,
            "interval": 0.1,
            "level": 500,
            "startDelay": 0
          }
        ]
      },
      {
        "groups": [
          {
            "type": "healer",
            "count": 50,
            "interval": 3,
            "level": 2000,
            "isBoss": true,
            "bossSpeed": 0.21,
            "startDelay": 0
          },
          {
            "type": "armorRepairer",
            "count": 50,
            "interval": 3,
            "level": 2000,
            "isBoss": true,
            "bossSpeed": 0.21,
            "startDelay": 0
          },
          {
            "type": "bunker",
            "count": 500,
            "interval": 0.1,
            "level": 1000,
            "startDelay": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "tank",
            "count": 20,
            "interval": 5,
            "level": 100,
            "startDelay": 1
          },
          {
            "type": "tank",
            "count": 5,
            "interval": 20,
            "level": 600,
            "startDelay": 1,
            "isBoss": true
          }
        ]
      }
    ],
    "atModeConfig": {
      "type": "normal"
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": [
      "fourLeafClover"
    ]
  },
  {
    "sourceLevelId": "L16",
    "levelNumber": 16,
    "levelName": "2-8",
    "contributor": "",
    "difficulty": "EZ",
    "rating": 11,
    "mapId": 18,
    "mapName": "Z",
    "startGold": 1200,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 10,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 20,
            "interval": 0.5,
            "level": 15,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 8,
            "interval": 0.7,
            "level": 15,
            "startDelay": 6
          },
          {
            "type": "jackInTheBox",
            "count": 2,
            "interval": 5,
            "level": 15,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 20,
            "interval": 0.5,
            "level": 24,
            "startDelay": 0
          },
          {
            "type": "square",
            "count": 12,
            "interval": 0.7,
            "level": 24,
            "startDelay": 4
          },
          {
            "type": "jackInTheBox",
            "count": 4,
            "interval": 4,
            "level": 24,
            "startDelay": 8
          },
          {
            "type": "healer",
            "count": 2,
            "interval": 5,
            "level": 24,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 32,
            "interval": 0.35,
            "level": 32,
            "startDelay": 0
          },
          {
            "type": "angryWriter",
            "count": 14,
            "interval": 0.8,
            "level": 32,
            "startDelay": 4
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 1,
            "level": 90,
            "isBoss": true,
            "bossSpeed": 0.9,
            "startDelay": 6
          },
          {
            "type": "jackInTheBox",
            "count": 6,
            "interval": 3,
            "level": 32,
            "startDelay": 8
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 20,
            "interval": 0.5,
            "level": 40,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 24,
            "interval": 0.4,
            "level": 40,
            "startDelay": 4
          },
          {
            "type": "armorRepairer",
            "count": 4,
            "interval": 4,
            "level": 40,
            "startDelay": 6
          },
          {
            "type": "jackInTheBox",
            "count": 6,
            "interval": 3,
            "level": 40,
            "startDelay": 8
          },
          {
            "type": "armored",
            "count": 1,
            "interval": 1,
            "level": 130,
            "isBoss": true,
            "bossSpeed": 0.75,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "iceShell",
            "count": 20,
            "interval": 0.6,
            "level": 50,
            "startDelay": 0
          },
          {
            "type": "windShield",
            "count": 28,
            "interval": 0.4,
            "level": 50,
            "startDelay": 3
          },
          {
            "type": "freezer",
            "count": 3,
            "interval": 5,
            "level": 50,
            "startDelay": 5
          },
          {
            "type": "jackInTheBox",
            "count": 8,
            "interval": 2.8,
            "level": 50,
            "startDelay": 6
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 1,
            "level": 180,
            "isBoss": true,
            "bossSpeed": 0.5,
            "startDelay": 10
          },
          {
            "type": "balloonSoldier",
            "count": 2,
            "interval": 6,
            "level": 50,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "circle",
            "count": 40,
            "interval": 0.3,
            "level": 60,
            "startDelay": 0
          },
          {
            "type": "armored",
            "count": 24,
            "interval": 0.45,
            "level": 60,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 10,
            "interval": 2.5,
            "level": 60,
            "startDelay": 5
          },
          {
            "type": "armorRepairer",
            "count": 4,
            "interval": 4,
            "level": 60,
            "startDelay": 7
          },
          {
            "type": "bunker",
            "count": 2,
            "interval": 8,
            "level": 260,
            "isBoss": true,
            "bossSpeed": 0.45,
            "startDelay": 8
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 1,
            "level": 230,
            "isBoss": true,
            "bossSpeed": 0.7,
            "startDelay": 10
          },
          {
            "type": "jackInTheBox",
            "count": 1,
            "interval": 1,
            "level": 200,
            "isBoss": true,
            "bossSpeed": 1.2,
            "startDelay": 14
          },
          {
            "type": "balloonSoldier",
            "count": 3,
            "interval": 6,
            "level": 60,
            "startDelay": 16
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L16",
    "levelNumber": 16,
    "levelName": "2-8",
    "contributor": "",
    "difficulty": "HD",
    "rating": 16,
    "mapId": 18,
    "mapName": "Z",
    "startGold": 1500,
    "lives": 20,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 10,
    "waves": [
      {
        "groups": [
          {
            "type": "circle",
            "count": 30,
            "interval": 0.4,
            "level": 20,
            "startDelay": 0
          },
          {
            "type": "windShield",
            "count": 17,
            "interval": 0.6,
            "level": 20,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 4,
            "interval": 4,
            "level": 20,
            "startDelay": 6
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 21,
            "interval": 0.6,
            "level": 30,
            "startDelay": 0
          },
          {
            "type": "armored",
            "count": 21,
            "interval": 0.5,
            "level": 30,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 7,
            "interval": 3,
            "level": 30,
            "startDelay": 5
          },
          {
            "type": "armorRepairer",
            "count": 4,
            "interval": 4,
            "level": 30,
            "startDelay": 7
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 1,
            "level": 160,
            "isBoss": true,
            "bossSpeed": 0.9,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "iceShell",
            "count": 26,
            "interval": 0.55,
            "level": 42,
            "startDelay": 0
          },
          {
            "type": "triangle",
            "count": 34,
            "interval": 0.3,
            "level": 42,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 9,
            "interval": 2.8,
            "level": 42,
            "startDelay": 5
          },
          {
            "type": "healer",
            "count": 5,
            "interval": 3,
            "level": 42,
            "startDelay": 6
          },
          {
            "type": "armored",
            "count": 2,
            "interval": 7,
            "level": 250,
            "isBoss": true,
            "bossSpeed": 0.75,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 38,
            "interval": 0.35,
            "level": 55,
            "startDelay": 0
          },
          {
            "type": "angryWriter",
            "count": 26,
            "interval": 0.5,
            "level": 55,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 10,
            "interval": 2.5,
            "level": 55,
            "startDelay": 5
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 4,
            "level": 55,
            "startDelay": 7
          },
          {
            "type": "windEye",
            "count": 2,
            "interval": 8,
            "level": 300,
            "isBoss": true,
            "bossSpeed": 0.7,
            "startDelay": 10
          },
          {
            "type": "balloonSoldier",
            "count": 4,
            "interval": 6,
            "level": 55,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 34,
            "interval": 0.4,
            "level": 70,
            "startDelay": 0
          },
          {
            "type": "iceShell",
            "count": 26,
            "interval": 0.5,
            "level": 70,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 12,
            "interval": 2.3,
            "level": 70,
            "startDelay": 5
          },
          {
            "type": "armorRepairer",
            "count": 7,
            "interval": 3,
            "level": 70,
            "startDelay": 6
          },
          {
            "type": "bunker",
            "count": 2,
            "interval": 8,
            "level": 360,
            "isBoss": true,
            "bossSpeed": 0.4,
            "startDelay": 9
          },
          {
            "type": "jackInTheBox",
            "count": 2,
            "interval": 10,
            "level": 320,
            "isBoss": true,
            "bossSpeed": 1.3,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "taunter",
            "count": 13,
            "interval": 1.2,
            "level": 85,
            "startDelay": 0
          },
          {
            "type": "windShield",
            "count": 43,
            "interval": 0.3,
            "level": 85,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 14,
            "interval": 2.1,
            "level": 85,
            "startDelay": 5
          },
          {
            "type": "freezer",
            "count": 7,
            "interval": 3,
            "level": 85,
            "startDelay": 7
          },
          {
            "type": "windEye",
            "count": 2,
            "interval": 7,
            "level": 420,
            "isBoss": true,
            "bossSpeed": 0.65,
            "startDelay": 10
          },
          {
            "type": "balloonSoldier",
            "count": 6,
            "interval": 5.5,
            "level": 85,
            "startDelay": 12
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 43,
            "interval": 0.3,
            "level": 100,
            "startDelay": 0
          },
          {
            "type": "angryWriter",
            "count": 34,
            "interval": 0.4,
            "level": 100,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 15,
            "interval": 2,
            "level": 100,
            "startDelay": 5
          },
          {
            "type": "armorRepairer",
            "count": 9,
            "interval": 2.5,
            "level": 100,
            "startDelay": 6
          },
          {
            "type": "bunker",
            "count": 3,
            "interval": 7,
            "level": 550,
            "isBoss": true,
            "bossSpeed": 0.4,
            "startDelay": 8
          },
          {
            "type": "windEye",
            "count": 2,
            "interval": 8,
            "level": 500,
            "isBoss": true,
            "bossSpeed": 0.6,
            "startDelay": 10
          },
          {
            "type": "jackInTheBox",
            "count": 2,
            "interval": 10,
            "level": 450,
            "isBoss": true,
            "bossSpeed": 1.4,
            "startDelay": 12
          },
          {
            "type": "tank",
            "count": 1,
            "interval": 1,
            "level": 130,
            "isBoss": true,
            "bossSpeed": 0.06,
            "startDelay": 16
          },
          {
            "type": "balloonSoldier",
            "count": 7,
            "interval": 5.5,
            "level": 100,
            "startDelay": 18
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": false,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L16",
    "levelNumber": 16,
    "levelName": "2-8",
    "contributor": "",
    "difficulty": "IN",
    "rating": 17,
    "mapId": 18,
    "mapName": "Z",
    "startGold": 230,
    "lives": 8,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "triangle",
            "count": 10,
            "interval": 0.4,
            "level": 14,
            "startDelay": 5
          },
          {
            "type": "igniter",
            "count": 6,
            "interval": 0.4,
            "level": 13,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 5,
            "interval": 0.4,
            "level": 17,
            "startDelay": 9
          }
        ]
      },
      {
        "groups": [
          {
            "type": "jackInTheBox",
            "count": 50,
            "interval": 0.3,
            "level": 140,
            "startDelay": 3
          },
          {
            "type": "angryWriter",
            "count": 4,
            "interval": 0.4,
            "level": 21,
            "startDelay": 7
          },
          {
            "type": "summoner",
            "count": 10,
            "interval": 0.4,
            "level": 26,
            "startDelay": 13
          },
          {
            "type": "balloonSoldier",
            "count": 7,
            "interval": 0.4,
            "level": 34,
            "startDelay": 18
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windEye",
            "count": 2,
            "interval": 0.4,
            "level": 160,
            "startDelay": 3,
            "isBoss": true,
            "bossSpeed": 0.3
          },
          {
            "type": "circle",
            "count": 18,
            "interval": 0.4,
            "level": 31,
            "startDelay": 8
          },
          {
            "type": "igniter",
            "count": 13,
            "interval": 0.4,
            "level": 36,
            "startDelay": 14
          },
          {
            "type": "windShield",
            "count": 34,
            "interval": 0.4,
            "level": 41,
            "startDelay": 18
          },
          {
            "type": "jackInTheBox",
            "count": 1,
            "interval": 0.4,
            "level": 300,
            "startDelay": 19,
            "isBoss": true
          },
          {
            "type": "evilSniper",
            "count": 4,
            "interval": 0.4,
            "level": 47,
            "startDelay": 20
          },
          {
            "type": "taunter",
            "count": 40,
            "interval": 0.4,
            "level": 50,
            "startDelay": 24
          }
        ]
      },
      {
        "groups": [
          {
            "type": "tank",
            "count": 1,
            "interval": 0.4,
            "level": 80,
            "isBoss": true,
            "startDelay": 2
          },
          {
            "type": "freezer",
            "count": 8,
            "interval": 0.4,
            "level": 56,
            "startDelay": 6
          },
          {
            "type": "balloonSoldier",
            "count": 13,
            "interval": 0.4,
            "level": 53,
            "startDelay": 7
          },
          {
            "type": "purifier",
            "count": 55,
            "interval": 0.2,
            "level": 60,
            "startDelay": 13
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 200,
            "startDelay": 15,
            "isBoss": true,
            "bossSpeed": 0.3
          }
        ]
      },
      {
        "groups": [
          {
            "type": "jackInTheBox",
            "count": 80,
            "interval": 0.4,
            "level": 67,
            "startDelay": 3
          },
          {
            "type": "taunter",
            "count": 65,
            "interval": 0.1,
            "level": 71,
            "startDelay": 4
          },
          {
            "type": "freezer",
            "count": 4,
            "interval": 0.4,
            "level": 75,
            "startDelay": 9
          },
          {
            "type": "evilSniper",
            "count": 1,
            "interval": 0.4,
            "level": 450,
            "startDelay": 10,
            "isBoss": true,
            "bossSpeed": 1
          }
        ]
      },
      {
        "groups": [
          {
            "type": "tank",
            "count": 2,
            "interval": 0.4,
            "level": 330,
            "isBoss": true,
            "startDelay": 4,
            "bossSpeed": 0.06
          },
          {
            "type": "summoner",
            "count": 300,
            "interval": 0.1,
            "level": 88,
            "startDelay": 7
          },
          {
            "type": "balloonSoldier",
            "count": 35,
            "interval": 0.6,
            "level": 97,
            "startDelay": 8
          },
          {
            "type": "angryWriter",
            "count": 1,
            "interval": 0.4,
            "level": 600,
            "startDelay": 11,
            "isBoss": true,
            "bossSpeed": 1
          },
          {
            "type": "purifier",
            "count": 88,
            "interval": 0.4,
            "level": 120,
            "startDelay": 15
          },
          {
            "type": "armorRepairer",
            "count": 40,
            "interval": 0.4,
            "level": 130,
            "startDelay": 18
          }
        ]
      }
    ],
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  },
  {
    "sourceLevelId": "L16",
    "levelNumber": 16,
    "levelName": "2-8",
    "contributor": "",
    "difficulty": "AT",
    "rating": 17,
    "mapId": 18,
    "mapName": "Z",
    "startGold": 1000,
    "lives": 12,
    "autoStartFirstWave": true,
    "firstWaveDelaySec": 0.8,
    "waves": [
      {
        "groups": [
          {
            "type": "jackInTheBox",
            "count": 10,
            "interval": 0.4,
            "level": 15,
            "startDelay": 4
          },
          {
            "type": "summoner",
            "count": 7,
            "interval": 0.4,
            "level": 34,
            "startDelay": 8
          },
          {
            "type": "square",
            "count": 8,
            "interval": 0.4,
            "level": 37,
            "startDelay": 10
          }
        ]
      },
      {
        "groups": [
          {
            "type": "igniter",
            "count": 10,
            "interval": 0.4,
            "level": 47,
            "startDelay": 3
          },
          {
            "type": "angryWriter",
            "count": 4,
            "interval": 0.4,
            "level": 56,
            "startDelay": 6
          },
          {
            "type": "windEye",
            "count": 12,
            "interval": 0.4,
            "level": 62,
            "startDelay": 9
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 180,
            "startDelay": 12,
            "isBoss": true,
            "bossSpeed": 0.5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "windShield",
            "count": 24,
            "interval": 0.5,
            "level": 70,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 12,
            "interval": 0.8,
            "level": 72,
            "startDelay": 6
          },
          {
            "type": "armored",
            "count": 16,
            "interval": 0.6,
            "level": 75,
            "startDelay": 10
          },
          {
            "type": "healer",
            "count": 4,
            "interval": 3,
            "level": 78,
            "startDelay": 14
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 260,
            "startDelay": 17,
            "isBoss": true,
            "bossSpeed": 0.45
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 240,
            "startDelay": 22,
            "isBoss": true,
            "bossSpeed": 0.45
          }
        ]
      },
      {
        "groups": [
          {
            "type": "angryWriter",
            "count": 20,
            "interval": 0.6,
            "level": 82,
            "startDelay": 3
          },
          {
            "type": "windShield",
            "count": 30,
            "interval": 0.4,
            "level": 86,
            "startDelay": 7
          },
          {
            "type": "jackInTheBox",
            "count": 16,
            "interval": 0.7,
            "level": 90,
            "startDelay": 11
          },
          {
            "type": "armorRepairer",
            "count": 5,
            "interval": 3,
            "level": 92,
            "startDelay": 15
          },
          {
            "type": "balloonSoldier",
            "count": 4,
            "interval": 5,
            "level": 95,
            "startDelay": 18
          },
          {
            "type": "bunker",
            "count": 1,
            "interval": 0.4,
            "level": 360,
            "startDelay": 23,
            "isBoss": true,
            "bossSpeed": 0.4
          },
          {
            "type": "armored",
            "count": 1,
            "interval": 0.4,
            "level": 330,
            "startDelay": 28,
            "isBoss": true,
            "bossSpeed": 0.5
          }
        ]
      },
      {
        "groups": [
          {
            "type": "iceShell",
            "count": 24,
            "interval": 0.5,
            "level": 100,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 20,
            "interval": 0.7,
            "level": 105,
            "startDelay": 7
          },
          {
            "type": "taunter",
            "count": 12,
            "interval": 1,
            "level": 108,
            "startDelay": 12
          },
          {
            "type": "freezer",
            "count": 5,
            "interval": 4,
            "level": 112,
            "startDelay": 17
          },
          {
            "type": "balloonSoldier",
            "count": 6,
            "interval": 5,
            "level": 115,
            "startDelay": 21
          },
          {
            "type": "bunker",
            "count": 2,
            "interval": 10,
            "level": 500,
            "startDelay": 24,
            "isBoss": true,
            "bossSpeed": 0.35
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 450,
            "startDelay": 30,
            "isBoss": true,
            "bossSpeed": 0.4
          }
        ]
      },
      {
        "groups": [
          {
            "type": "armored",
            "count": 35,
            "interval": 0.4,
            "level": 120,
            "startDelay": 3
          },
          {
            "type": "jackInTheBox",
            "count": 24,
            "interval": 0.6,
            "level": 125,
            "startDelay": 7
          },
          {
            "type": "summoner",
            "count": 12,
            "interval": 1,
            "level": 130,
            "startDelay": 12
          },
          {
            "type": "armorRepairer",
            "count": 8,
            "interval": 3,
            "level": 135,
            "startDelay": 17
          },
          {
            "type": "balloonSoldier",
            "count": 8,
            "interval": 5,
            "level": 140,
            "startDelay": 21
          },
          {
            "type": "bunker",
            "count": 2,
            "interval": 12,
            "level": 650,
            "startDelay": 24,
            "isBoss": true,
            "bossSpeed": 0.3
          },
          {
            "type": "windEye",
            "count": 1,
            "interval": 0.4,
            "level": 600,
            "startDelay": 30,
            "isBoss": true,
            "bossSpeed": 0.35
          },
          {
            "type": "tank",
            "count": 1,
            "interval": 0.4,
            "level": 120,
            "startDelay": 36,
            "isBoss": true,
            "bossSpeed": 0.06
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
            "kind": "plant",
            "id": "puffShroom",
            "weight": 50
          },
          {
            "kind": "plant",
            "id": "machineGun",
            "weight": 30
          },
          {
            "kind": "element",
            "id": "fire",
            "weight": 50
          },
          {
            "kind": "element",
            "id": "ice",
            "weight": 50
          },
          {
            "kind": "element",
            "id": "wind",
            "weight": 50
          },
          {
            "kind": "plant",
            "id": "doubleBottleGrass",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "fourLeafClover",
            "weight": 100
          },
          {
            "kind": "plant",
            "id": "boomerangLeaf",
            "weight": 60
          },
          {
            "kind": "plant",
            "id": "sniper",
            "weight": 30
          },
          {
            "kind": "plant",
            "id": "rocket",
            "weight": 80
          },
          {
            "kind": "plant",
            "id": "antiAirTree",
            "weight": 40
          },
          {
            "kind": "plant",
            "id": "dandelion",
            "weight": 40
          },
          {
            "kind": "plant",
            "id": "windSailGrass",
            "weight": 40
          },
          {
            "kind": "plant",
            "id": "cycloneShroom",
            "weight": 30
          },
          {
            "kind": "element",
            "id": "electric",
            "weight": 50
          },
          {
            "kind": "element",
            "id": "gold",
            "weight": 50
          },
          {
            "kind": "plant",
            "id": "hotPepper",
            "weight": 20
          },
          {
            "kind": "plant",
            "id": "electricFlower",
            "weight": 50
          }
        ]
      }
    },
    "specialEnemyConfig": {
      "enabled": true,
      "type": "charityAmbassador",
      "chance": 0.1
    },
    "unlockRewards": []
  }
];

export const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = BALANCE_LAB_LEVEL_DRAFTS[0] as BalanceLabLevelDraft;
