# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a hybrid educational card game combining two game modes:
1. **Card Battle Mode** (Clash Royale-style): Players deploy educational cards (math, physics, chemistry, history themed) on a map to destroy enemy towers
2. **Tower Defense Mode** (Plants vs. Zombies-style): Players place defensive towers to stop waves of enemies along predefined paths

The project is a full-stack web application deployed on Vercel with Neon PostgreSQL backend for user accounts, progression, upgrades, and rewards.

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand (two separate stores: `gameStore.ts` for card battle, `td/store.ts` for tower defense)
- **Animation**: Framer Motion
- **Backend**: Vercel Serverless Functions (Node.js runtime v20.x)
- **Database**: Neon PostgreSQL (via `@neondatabase/serverless`)
- **Auth**: Custom JWT-based authentication (bcrypt password hashing)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (default port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Dual Game System

The app has **two distinct game modes** that share the same entry point but use completely separate game logic:

- **Card Battle** (`src/components/`, `src/store/gameStore.ts`, `src/utils/gameSystems.ts`, `src/utils/gameLogic.ts`)
  - Uses a grid-based map with river and bridges ([mapConfig.ts](src/config/mapConfig.ts))
  - Card system with unit placement, movement, attacks, special abilities
  - AI opponent with random card play

- **Tower Defense** (`src/td/` directory)
  - Path-based enemy movement with multiple paths support
  - Tower placement on predefined plant grids
  - Wave-based progression with difficulty scaling (1-3 stars)
  - Integrated progression system with cloud save

### Entry Point & Routing

[App.tsx](src/App.tsx) is the root component that manages the entire application flow:
- Authentication stage (`auth`)
- Main hub with upgrades and chest management (`hub`)
- Level selection (`select`)
- Tower defense gameplay (`playing`, `won`, `lost`)

The card battle mode appears to be a legacy/secondary mode. The current main game is the tower defense mode.

### State Management Architecture

**Card Battle State** ([src/store/gameStore.ts](src/store/gameStore.ts)):
- `playerElixir`, `enemyElixir`: Mana/energy system
- `units`: Array of active units on the battlefield
- `playerHand`, `enemyHand`: Current cards in hand
- `gameTime`: Tracks elapsed time for abilities and effects
- Game loop: `updateGame()` → `moveUnits()` → `handleAttacks()` → `handleAbilities()` → `handleTowerAttacks()` → `aiTurn()`

**Tower Defense State** ([src/td/store.ts](src/td/store.ts)):
- `enemies`: Active enemies moving along paths
- `towers`: Placed defensive towers
- `projectiles`: Active projectiles in flight
- `waves`, `waveIndex`: Wave progression state
- `towerLevelMap`: Player's tower upgrade levels (synced from backend)
- Game loop: `update()` handles enemy spawning, movement, tower targeting, projectile physics, and collision detection

### Backend API Structure

All API endpoints are in the `api/` directory as Vercel serverless functions:

- [api/auth.ts](api/auth.ts): Registration (`/api/auth?action=register`), login (`/api/auth?action=login`)
- [api/progress.ts](api/progress.ts): Cloud save/load (GET/POST), level completion, chest rewards
- [api/upgrade.ts](api/upgrade.ts): Tower upgrades using coins and shards
- [api/chest.ts](api/chest.ts): Chest unlock timers and opening mechanics
- [api/health.ts](api/health.ts): Health check endpoint

Database helper modules:
- [api/_db.ts](api/_db.ts): Neon client initialization, connection pooling
- [api/_auth.ts](api/_auth.ts): JWT token generation and verification

### Database Schema

Schema defined in [sql/init.sql](sql/init.sql):
- `users`: player_id (UUID), username, password_hash, coins, shards (JSON), tower_levels (JSON)
- `player_progress`: unlocked levels, star ratings, unlocked_at timestamps
- `chests`: chest inventory with unlock timers

### Card System (Card Battle Mode)

Educational cards are defined in [src/data/educationalCards.ts](src/data/educationalCards.ts):

**Special Abilities** (defined in [src/types/game.ts](src/types/game.ts)):
- `fibonacci`: Fibonacci breeding pattern (rabbit units multiply following 1,1,2,3,5,8...)
- `fraction`: Splits into smaller units on death (1 → 1/2 → 1/4)
- `negative`: Negative HP logic (gains HP when damaged, explodes at 0)
- `kinetic`: Damage scales with velocity (E = ½mv²)
- `catalyst`: Aura that buffs nearby allies' attack speed
- `trojan`: Spawns units on death (Trojan horse)

**Spell Cards**:
- Newton's Apple: AoE damage + stun + knockback
- Acid Rain: Persistent DoT effect
- Inert Gas Shield: Grants immunity to debuffs

**Status Effects**: stun, slow, immune, speedup, dot (damage over time)

The card game loop implementation is in [src/utils/gameSystems.ts](src/utils/gameSystems.ts) and [src/utils/gameLogic.ts](src/utils/gameLogic.ts).

### Tower Defense System

**Level Configuration** ([src/td/levels.ts](src/td/levels.ts)):
- `LEVELS` array defines all playable levels
- `MONSTER_BASE_STATS` defines base HP/speed for circle/triangle/square enemies
- `DIFFICULTY_CONFIG` handles star-based scaling (1★ = easy, 2★ = +2 levels, 3★ = +4 levels)

**Map System** ([src/td/maps.ts](src/td/maps.ts)):
- `MAPS` array contains path definitions and visual map data
- `getPlantGrid()` calculates valid tower placement positions (avoids paths + buffer zones)
- Supports single or multiple paths per map

**Tower Types** (defined in [src/td/store.ts](src/td/store.ts)):
- `cannon`: Single-target, balanced stats
- `splash`: AoE damage in splash radius
- `slow`: Applies slow debuff to enemies

**Progression System** ([src/td/progress.ts](src/td/progress.ts)):
- Local storage + cloud sync (localStorage as cache, backend as source of truth)
- `getUnlocked()`, `setUnlocked()`: Level unlock progression
- `getMaxStar()`, `setStarCleared()`: Star ratings per level
- Chest rewards and tower upgrade materials (shards) stored server-side

### Game Loop & Physics

Both game modes use a `requestAnimationFrame` loop with deltaTime calculation:

**Card Battle**: 60 FPS target, processes unit pathfinding, collision detection, attack timing, ability cooldowns
**Tower Defense**: 60 FPS target, processes enemy movement along Bezier paths, tower targeting (prioritizes most progressed enemy), projectile homing, splash damage

Distance calculations use Euclidean distance from [src/config/mapConfig.ts](src/config/mapConfig.ts).

### Key Subsystems

**Pathfinding** (Card Battle): Simple grid-based movement toward nearest enemy/tower, with river obstacle avoidance via bridges
**Tower Targeting** (TD): Finds enemy with highest `progress` value (closest to leak point) within range
**Projectile Homing** (TD): Projectiles track moving targets, recalculating trajectory each frame until impact
**Upgrade Scaling**: Towers/monsters scale stats with level using multiplier formulas (8% damage, 3% range per level for towers; dynamic HP scaling for monsters)

## Important Implementation Details

### Card Battle
- Cards cycle in hand: when played, next card from deck is added (wraps around using modulo)
- Elixir regenerates at 1 point/second
- Units automatically move toward nearest enemy, attack when in range, respecting attack speed cooldown
- Special abilities (Fibonacci, Catalyst aura) are evaluated every game tick
- Negative HP units require special damage handling (inverted healing/damage logic)

### Tower Defense
- Enemies spawn based on wave group configs (type, count, interval)
- Tower projectiles have travel time (not instant hit)
- Splash towers check distance to impact point, damage all enemies within splash radius
- Slow effect stacks duration but not percentage
- Wave doesn't start until player clicks "Start Wave" (unless `autoStartFirstWave: true`)

### Cloud Save System
- Client-side localStorage acts as cache for offline play
- Backend is source of truth for progression, currency, upgrades
- Player authenticated via JWT token in Authorization header
- Player ID is UUID, username is unique constraint
- Chest unlock timers run server-side (immune to client time manipulation)

## Development Patterns

### Adding New Educational Cards
1. Add card definition to `EDUCATIONAL_CARDS` in [src/data/educationalCards.ts](src/data/educationalCards.ts)
2. If new ability type: add to `AbilityType` union in [src/types/game.ts](src/types/game.ts)
3. Implement ability logic in `updateAbilities()` in [src/utils/gameSystems.ts](src/utils/gameSystems.ts)
4. Handle death mechanics in `handleUnitDeath()` if unit spawns other units

### Adding New Tower Defense Levels
1. Create map in [src/td/maps.ts](src/td/maps.ts) with path coordinates
2. Define level in [src/td/levels.ts](src/td/levels.ts) with wave composition
3. Level auto-unlocks when previous level is cleared (logic in [App.tsx](src/App.tsx))

### Adding New Tower Types
1. Add preset to `TOWERS_PRESET` in [src/td/store.ts](src/td/store.ts)
2. Add type to `TowerType` union in [src/td/types.ts](src/td/types.ts)
3. Handle special mechanics in tower shooting logic in `update()` method
4. Add upgrade UI in [App.tsx](src/App.tsx) hub stage
5. Update database schema to include new tower type in shards/tower_levels JSON

## Environment Variables

Required for backend (Vercel deployment):
- `DATABASE_URL`: Neon PostgreSQL connection string
- `JWT_SECRET`: Secret key for signing authentication tokens

Example: [.env.example](.env.example)

## Deployment

Configured for Vercel:
- [vercel.json](vercel.json) specifies Node.js runtime for API functions
- Build command: `npm run build`
- Output directory: `dist/`
- API routes automatically mapped from `api/` directory

Database initialization:
```bash
# Run init.sql on Neon database (one-time setup)
psql $DATABASE_URL < sql/init.sql
```

## Testing & Debugging

- Use browser DevTools to inspect Zustand state (stores are available in window when using React DevTools)
- API errors logged to Vercel function logs
- Health check: `GET /api/health`
- Database utility script: [unlock_all_levels.sql](unlock_all_levels.sql) for testing progression

## Common Gotchas

- Card battle and tower defense are **separate game systems** - don't mix their state/types
- `Position` type is shared between both games but used differently (card battle: grid cells, TD: continuous coordinates)
- Tower placement must check `plantGrid` validity, not just empty space
- Enemy HP scaling is exponential with level (beware balance issues at high star ratings)
- JWT tokens stored in localStorage, cleared on logout (no automatic refresh)
- Chest unlock timers are server timestamps, not client-side countdowns
