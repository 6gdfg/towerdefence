import React, { useEffect, useRef, useState } from 'react';
import { useTDStore } from './store';
import { CELL_SIZE } from '../config/mapConfig';
import { Position } from '../types/game';
import { ELEMENT_PLANT_CONFIG, DEFAULT_PLANT_COLOR, DEFAULT_BULLET_COLOR, getPlantRuntimeConfig } from './plants';
import { PlantType, ElementType } from './types';
import { ELEMENT_SINGLE_USE_COOLDOWN } from './config';
import { ElementIcon, PlantIcon, ShovelIcon } from './TowerIcons';

function worldToPx(p: Position) { return { left: p.x * CELL_SIZE, top: p.y * CELL_SIZE }; }

const ENEMY_SHAPE_SIZE = 22;
const SUN_COLLECT_ANIMATION_SEC = 0.55;
const SUN_COLLECT_TARGET: Position = { x: 1.1, y: 1.1 };

function SunIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="5.2" fill="#fbbf24" stroke="#d97706" strokeWidth="1.6" />
      <g stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5.2" />
        <line x1="12" y1="18.8" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5.2" y2="12" />
        <line x1="18.8" y1="12" x2="21.5" y2="12" />
        <line x1="5.3" y1="5.3" x2="7.2" y2="7.2" />
        <line x1="16.8" y1="16.8" x2="18.7" y2="18.7" />
        <line x1="18.7" y1="5.3" x2="16.8" y2="7.2" />
        <line x1="7.2" y1="16.8" x2="5.3" y2="18.7" />
      </g>
    </svg>
  );
}

type TDGameProps = {
  onWin?: () => void;
  onLose?: () => void;
  onExit?: () => void;
  tutorialMode?: boolean;
  onTutorialSkip?: () => void;
  difficultyLabel?: string | null;
};

export default function TDGame({ onWin, onLose, onExit, tutorialMode = false, onTutorialSkip, difficultyLabel }: TDGameProps = {}) {
  const { gold, lives, enemies, towers, projectiles, singleUseCasts, damagePopups, sunPickups, elementCooldowns, plantCooldowns, paths, mapWidth, mapHeight, roadWidthCells, plantGrid, waves, isWaveActive, waveIndex, running, startWave, placeTower, placeTowerFromConveyor, applyElement, applyElementFromConveyor, canPlaceTower, removeTower, collectSun, autoCollectSun, setAutoCollectSun, update, togglePause, gameTime, availablePlants, availableElements, manualFireTower, mode, lifeBonusPerWave, labOverrides, atModeConfig, conveyorQueue } = useTDStore();
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
  const [selectedConveyorIndex, setSelectedConveyorIndex] = useState<number | null>(null);
  const [shovelActive, setShovelActive] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false,
  );
  const [showAbout, setShowAbout] = useState(false);
  const announcedWinRef = useRef(false);
  const announcedLoseRef = useRef(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const selectedPlantInfo = selectedPlant ? getPlantRuntimeConfig(selectedPlant, labOverrides) : null;
  const selectedElementInfo = selectedElement ? ELEMENT_PLANT_CONFIG[selectedElement] : null;
  const isConveyorMode = atModeConfig?.type === 'conveyor';
  const selectedConveyorItem = selectedConveyorIndex == null ? null : conveyorQueue[selectedConveyorIndex] ?? null;
  const selectedConveyorElementRemaining = selectedConveyorItem?.kind === 'element'
    ? Math.max(0, (elementCooldowns?.[selectedConveyorItem.id] ?? 0) - gameTime)
    : 0;
  const plantChoices = availablePlants
    .map(id => getPlantRuntimeConfig(id, labOverrides))
    .filter((cfg): cfg is NonNullable<ReturnType<typeof getPlantRuntimeConfig>> => Boolean(cfg));
  const elementChoices = availableElements.map(id => ELEMENT_PLANT_CONFIG[id]).filter(Boolean);
  const selectedElementCooldown = selectedElement ? ELEMENT_SINGLE_USE_COOLDOWN[selectedElement] : 0;
  const selectedPlantRemaining = selectedPlant ? Math.max(0, (plantCooldowns?.[selectedPlant] ?? 0) - gameTime) : 0;
  const waveNumberDisplay = waveIndex + (isWaveActive ? 1 : 0);
  const isFiniteMode = mode === 'campaign' || mode === 'at' || mode === 'random' || mode === 'lab';
  const modeLabel = mode === 'endless'
    ? '无尽模式'
    : mode === 'endlessTest'
      ? '测试模式'
      : mode === 'lab'
        ? '平衡测试'
        : mode === 'random'
          ? '随机模式'
          : mode === 'at'
            ? 'AT 模式'
            : mode === 'campaign'
              ? '关卡模式'
              : null;
  const tutorialCopy = (() => {
    if (!tutorialMode) return null;
    if (towers.length === 0) {
      return {
        title: 'Introduction',
        body: selectedPlant
          ? '在地图上的灰色小点附近点击，就能把当前植物种下去。先把攻击植物放在道路拐角旁边。'
          : '先从左侧选择一个初始植物。瓶子草负责攻击，小喷菇免费但有冷却，向日葵负责产阳光。',
      };
    }
    if (!isWaveActive && waveIndex === 0) {
      return {
        title: '准备开波',
        body: '已经有植物了。点击右上角“开始/下一波”，怪物会沿着白色道路前进。',
      };
    }
    if (isWaveActive) {
      return {
        title: '观察战斗',
        body: enemies.length > 0
          ? '植物会自动攻击进入射程的怪物。漏怪会扣生命，击败怪物会获得本局阳光。'
          : '这一波正在结束。等场上怪物清空后，就可以开始下一波。',
      };
    }
    if (waveIndex < waves.length) {
      return {
        title: '继续布置',
        body: '用击败怪物获得的阳光补植物，然后继续下一波。正式关卡也是这个循环。',
      };
    }
    return {
      title: '训练完成',
      body: '这就是基础流程：选植物、种在可种植点、开波、防住全部怪物。',
    };
  })();

  useEffect(() => {
    if (selectedPlant && !availablePlants.includes(selectedPlant)) {
      setSelectedPlant(null);
    }
  }, [availablePlants, selectedPlant]);

  useEffect(() => {
    if (selectedElement && !availableElements.includes(selectedElement)) {
      setSelectedElement(null);
    }
  }, [availableElements, selectedElement]);

  useEffect(() => {
    if (!isConveyorMode) {
      setSelectedConveyorIndex(null);
      return;
    }
    setSelectedPlant(null);
    setSelectedElement(null);
    setShovelActive(false);
    if (selectedConveyorIndex != null && selectedConveyorIndex >= conveyorQueue.length) {
      setSelectedConveyorIndex(null);
    }
  }, [conveyorQueue.length, isConveyorMode, selectedConveyorIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const node = mapWrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const updateStageSize = () => {
      const rect = node.getBoundingClientRect();
      const next = {
        width: Math.max(0, Math.round(rect.width)),
        height: Math.max(0, Math.round(rect.height)),
      };
      setStageSize(current => (
        current.width === next.width && current.height === next.height ? current : next
      ));
    };

    updateStageSize();
    const observer = new ResizeObserver(updateStageSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);


  const corridorPx = roadWidthCells * CELL_SIZE;
  const BORDER_PX = 0.6; // 路两侧边框粗细（像素）- 细灰线
  const outerWidth = corridorPx + BORDER_PX * 2;
  const baseMapWidth = mapWidth * CELL_SIZE;
  const baseMapHeight = mapHeight * CELL_SIZE;
  const mapAspect = baseMapHeight > 0 ? baseMapWidth / baseMapHeight : 1;
  const availableStageWidth = Math.max(0, stageSize.width - 12);
  const availableStageHeight = Math.max(0, stageSize.height - 12);
  const fittedMapWidth = availableStageWidth > 0 && availableStageHeight > 0
    ? Math.min(availableStageWidth, availableStageHeight * mapAspect)
    : 0;
  const fittedMapHeight = fittedMapWidth > 0 ? fittedMapWidth / mapAspect : 0;

  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      update(dt);
    }, 1000 / 30);
    return () => clearInterval(id);
  }, [update]);


  useEffect(() => {
    if (!isWaveActive && waveIndex >= waves.length && !announcedWinRef.current) {
      announcedWinRef.current = true;
      onWin && onWin();
    }
  }, [isWaveActive, waveIndex, waves.length, onWin]);

  useEffect(() => {
    if (lives <= 0 && !announcedLoseRef.current) {
      announcedLoseRef.current = true;
      onLose && onLose();
    }
  }, [lives, onLose]);

  const handlePlace = (e: React.MouseEvent) => {
    if (shovelActive) return;
    if (!selectedPlant && !selectedElement && !selectedConveyorItem) return;
    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Transform the screen point to SVG coordinate system
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const clickX = svgP.x / CELL_SIZE;
    const clickY = svgP.y / CELL_SIZE;

    let nearestGrid = null as Position | null;
    let minDist = Infinity;
    for (const g of plantGrid) {
      const dist = Math.hypot(g.x - clickX, g.y - clickY);
      if (dist < minDist) {
        minDist = dist;
        nearestGrid = g;
      }
    }

    if (nearestGrid && minDist < 1.0) {
      if (selectedConveyorItem && selectedConveyorIndex != null) {
        if (selectedConveyorItem.kind === 'plant') {
          if (canPlaceTower(nearestGrid)) {
            placeTowerFromConveyor(selectedConveyorIndex, nearestGrid);
            setSelectedConveyorIndex(null);
          }
        } else {
          const targetTower = towers.some(tower => Math.hypot(tower.pos.x - nearestGrid.x, tower.pos.y - nearestGrid.y) <= 0.75);
          const cooldownReadyAt = elementCooldowns?.[selectedConveyorItem.id] ?? 0;
          const canUseElement = targetTower || cooldownReadyAt <= gameTime;
          applyElementFromConveyor(selectedConveyorIndex, nearestGrid);
          if (canUseElement) {
            setSelectedConveyorIndex(null);
          }
        }
      } else if (selectedPlant) {
        if (canPlaceTower(nearestGrid)) {
          placeTower(selectedPlant, nearestGrid);
        }
      } else if (selectedElement) {
        applyElement(selectedElement, nearestGrid);
      }
    }
  };

  const handleTowerClick = (tower: typeof towers[number], e: React.MouseEvent) => {
    if (shovelActive) {
      e.stopPropagation();
      removeTower(tower.id);
      setShovelActive(false);
      return;
    }
    if (selectedPlant || selectedElement || selectedConveyorItem) return;
    e.stopPropagation();
    if (tower.type === 'sunlightFlower') {
      manualFireTower(tower.id);
    }
  };

  const handleExit = () => {
    if (!window.confirm('退出当前对局？本局进度不会保存。')) return;
    onExit?.();
  };

  const getSunDisplayPos = (sun: typeof sunPickups[number]) => {
    if (!sun.collecting || sun.collectedAt == null) return sun.pos;
    const start = sun.collectFrom ?? sun.pos;
    const rawProgress = Math.max(0, Math.min(1, (gameTime - sun.collectedAt) / SUN_COLLECT_ANIMATION_SEC));
    const progress = 1 - Math.pow(1 - rawProgress, 3);
    return {
      x: start.x + (SUN_COLLECT_TARGET.x - start.x) * progress,
      y: start.y + (SUN_COLLECT_TARGET.y - start.y) * progress,
    };
  };


  return (
    <div className="game-shell">
      <header className="glass-panel game-topbar">
        <div className="game-stats">
          <div className="game-stat" aria-label={`阳光 ${gold}`} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <SunIcon size={24} />
            <span>{gold}</span>
          </div>
          <div className="game-stat">生命: {lives}</div>
          <div className="game-stat">波次: {isFiniteMode ? `${Math.min(waveNumberDisplay, waves.length)} / ${waves.length}` : `${waveNumberDisplay} / ∞`}</div>
          {difficultyLabel && <div className="game-stat difficulty-stat">{difficultyLabel}</div>}
          {mode && mode !== 'campaign' && modeLabel && (
            <div className="game-stat" style={{ color:'#f97316' }}>
              模式：{modeLabel}
              {lifeBonusPerWave ? (
                <span style={{ marginLeft:8, color:'#22c55e' }}>每波 +{lifeBonusPerWave} 生命</span>
              ) : null}
            </div>
          )}
        </div>
          <div style={{ display:'flex', gap:8, alignItems: 'center', flexWrap: 'wrap' }}>
            <a className="icon-button" href="https://github.com/6gdfg/towerdefence" target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
            <button onClick={() => setShowAbout(true)} className="action-button">
              关于
            </button>
            <button onClick={togglePause} className="action-button">
              {running ? '⏸️ 暂停' : '▶️ 继续'}
            </button>
            <button onClick={handleExit} className="action-button danger">
              退出
            </button>
            <label className="action-button" style={{ display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={!!autoCollectSun}
                onChange={event => setAutoCollectSun(event.target.checked)}
              />
              自动收集
            </label>
            <button disabled={isWaveActive || waveIndex >= waves.length} onClick={startWave} className="action-button primary" style={{ opacity: isWaveActive || waveIndex >= waves.length ? 0.55 : 1 }}>开始/下一波</button>
          </div>
      </header>

      {tutorialCopy && (
        <div className="tutorial-game-tip">
          <div>
            <strong>{tutorialCopy.title}</strong>
            <span>{tutorialCopy.body}</span>
          </div>
          {onTutorialSkip && (
            <button onClick={onTutorialSkip} className="action-button">
              跳过教程
            </button>
          )}
        </div>
      )}

      <div style={{ display:'flex', flex:'1 1 auto', minHeight:0, flexDirection: isMobile ? 'column' : 'row' }}>
        <aside
          className="game-sidepanel"
          style={{
            width: isMobile ? '100%' : 240,
            padding: isMobile ? '12px 16px' : '12px 16px 20px 24px',
            borderRight: isMobile ? 'none' : '1px solid rgba(203,213,225,0.68)',
            borderBottom: isMobile ? '1px solid rgba(203,213,225,0.68)' : 'none',
            overflowY: isMobile ? 'visible' : 'auto',
            flexShrink:0,
          }}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>工具</div>
              <button
                type="button"
                title="铲子"
                onClick={() => {
                  setShovelActive(active => !active);
                  setSelectedPlant(null);
                  setSelectedElement(null);
                  setSelectedConveyorIndex(null);
                }}
                style={{
                  width: '100%',
                  display:'flex',
                  alignItems:'center',
                  justifyContent: isMobile ? 'center' : 'space-between',
                  padding: isMobile ? '8px' : '8px 10px',
                  borderRadius:8,
                  border: shovelActive ? '2px solid #111827' : '1px solid #d1d5db',
                  background: shovelActive ? '#fef2f2' : '#ffffff',
                  color:'#111827',
                  cursor:'pointer',
                  boxShadow: shovelActive ? '0 2px 6px rgba(17,24,39,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                  minHeight: isMobile ? 44 : undefined,
                }}
              >
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ShovelIcon color={shovelActive ? '#111827' : '#9ca3af'} size={isMobile ? 26 : 28} />
                </span>
                {!isMobile && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                    <span>铲子</span>
                    <span style={{ fontSize:12, color:'#6b7280' }}>移除植物</span>
                  </div>
                )}
              </button>
              {shovelActive && (
                <div style={{ fontSize:12, color:'#6b7280', padding:'6px 0 0' }}>
                  当前操作：铲掉一个植物
                </div>
              )}
            </div>
            {isConveyorMode ? (
              <div>
                <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>传送带</div>
                <div
                  style={{
                    display:'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    gap: isMobile ? 6 : 8,
                  }}
                >
                  {conveyorQueue.length === 0 && (
                    <div style={{ fontSize:12, color:'#9ca3af' }}>等待物品进入传送带</div>
                  )}
                  {conveyorQueue.map((item, index) => {
                    const active = selectedConveyorIndex === index;
                    const isPlant = item.kind === 'plant';
                    const plantCfg = isPlant ? getPlantRuntimeConfig(item.id, labOverrides) : null;
                    const elementCfg = !isPlant ? ELEMENT_PLANT_CONFIG[item.id] : null;
                    const name = plantCfg?.name ?? elementCfg?.name ?? item.id;
                    const color = isPlant ? DEFAULT_PLANT_COLOR : elementCfg?.color ?? '#64748b';
                    return (
                      <button
                        key={`${item.kind}-${item.id}-${index}`}
                        title={name}
                        onClick={() => {
                          setSelectedConveyorIndex(active ? null : index);
                          setSelectedPlant(null);
                          setSelectedElement(null);
                          setShovelActive(false);
                        }}
                        style={{
                          display:'flex',
                          alignItems:'center',
                          justifyContent: isMobile ? 'center' : 'space-between',
                          padding: isMobile ? '8px' : '8px 10px',
                          borderRadius:8,
                          border: active ? '2px solid #111827' : '1px solid #d1d5db',
                          background:'#ffffff',
                          color:'#111827',
                          cursor:'pointer',
                          boxShadow: active ? '0 2px 6px rgba(17,24,39,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                          flex: isMobile ? '1 0 calc(18% - 4px)' : undefined,
                          minWidth: isMobile ? 44 : undefined,
                          minHeight: isMobile ? 44 : undefined,
                        }}
                      >
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {isPlant ? (
                            <PlantIcon type={item.id} color={active ? '#111827' : color} size={isMobile ? 26 : 28} />
                          ) : (
                            <ElementIcon element={item.id} color={active ? '#111827' : color} size={isMobile ? 26 : 28} />
                          )}
                        </span>
                        {!isMobile && (
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                            <span>{name}</span>
                            <span style={{ fontSize:12, color:'#6b7280' }}>{isPlant ? '植物' : '元素'}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedConveyorItem && (
                  <div style={{ fontSize:12, color:'#6b7280', padding:'8px 0 0' }}>
                    当前操作：放置传送带物品（不消耗阳光；元素单独释放仍有冷却）
                    {selectedConveyorElementRemaining > 0.01 ? `，单放冷却 ${Math.ceil(selectedConveyorElementRemaining)} 秒` : ''}
                  </div>
                )}
              </div>
            ) : (
              <>
            <div>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>基础植物</div>
              <div
                style={{
                  display:'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  gap: isMobile ? 6 : 8,
                }}
              >
                {plantChoices.length === 0 && (
                  <div style={{ fontSize:12, color:'#9ca3af' }}>暂无可用植物</div>
                )}
                {plantChoices.map(cfg => {
                  const active = selectedPlant === cfg.id;
                  const cooldownReadyAt = plantCooldowns?.[cfg.id] ?? 0;
                  const remaining = Math.max(0, cooldownReadyAt - gameTime);
                  const onCooldown = remaining > 0.01;
                  return (
                    <button
                      key={cfg.id}
                      title={cfg.name}
                      disabled={onCooldown}
                      onClick={() => {
                        if (onCooldown) return;
                        setSelectedPlant(active ? null : cfg.id);
                        setSelectedElement(null);
                        setShovelActive(false);
                      }}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent: isMobile ? 'center' : 'space-between',
                        padding: isMobile ? '8px' : '8px 10px',
                        borderRadius:8,
                        border: active ? '2px solid #111827' : '1px solid #d1d5db',
                        background:'#ffffff',
                        color:'#111827',
                        cursor: onCooldown ? 'not-allowed' : 'pointer',
                        boxShadow: active ? '0 2px 6px rgba(17,24,39,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                        flex: isMobile ? '1 0 calc(18% - 4px)' : undefined,
                        minWidth: isMobile ? 44 : undefined,
                        minHeight: isMobile ? 44 : undefined,
                        position:'relative',
                        overflow:'hidden',
                        opacity: onCooldown ? 0.68 : 1,
                      }}
                    >
                      {onCooldown && (
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#ffffff', fontWeight:700, background:'rgba(15,23,42,0.48)', zIndex:1 }}>
                          {Math.ceil(remaining)}s
                        </div>
                      )}
                      {isMobile ? (
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <PlantIcon type={cfg.id} color={active ? '#111827' : DEFAULT_PLANT_COLOR} size={26} />
                        </span>
                      ) : (
                        <>
                          <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <PlantIcon type={cfg.id} color={active ? '#111827' : DEFAULT_PLANT_COLOR} size={28} />
                          </span>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                            <span>{cfg.name}</span>
                            <span style={{ fontSize:12, color:'#6b7280', display:'inline-flex', alignItems:'center', gap:4 }}>
                              <SunIcon size={16} />
                              {cfg.cost}{cfg.placementCooldown ? ` · ${cfg.placementCooldown}s` : ''}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>元素增幅</div>
              <div
                style={{
                  display:'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  gap: isMobile ? 6 : 8,
                }}
              >
                {elementChoices.length === 0 && (
                  <div style={{ fontSize:12, color:'#9ca3af' }}>暂无可用元素</div>
                )}
                {elementChoices.map(cfg => {
                  const active = selectedElement === cfg.id;
                  const cooldownReadyAt = elementCooldowns?.[cfg.id] ?? 0;
                  const totalCooldown = ELEMENT_SINGLE_USE_COOLDOWN[cfg.id] ?? 1;
                  const remaining = Math.max(0, cooldownReadyAt - gameTime);
                  const ratio = Math.min(1, remaining / totalCooldown);
                  const onCooldown = remaining > 0.01;
                  const handleSelect = () => {
                    if (active) {
                      setSelectedElement(null);
                      return;
                    }
                    if (onCooldown) return;
                    setSelectedElement(cfg.id);
                    setSelectedPlant(null);
                    setShovelActive(false);
                  };
                  return (
                    <button
                      key={cfg.id}
                      title={cfg.name}
                      onClick={handleSelect}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent: isMobile ? 'center' : 'space-between',
                        padding: isMobile ? '8px' : '8px 10px',
                        borderRadius:8,
                        border: active ? `2px solid ${cfg.color}` : '1px solid #d1d5db',
                        background: active ? cfg.color : '#ffffff',
                        color: active ? '#ffffff' : '#111827',
                        cursor: active ? 'pointer' : onCooldown ? 'not-allowed' : 'pointer',
                        boxShadow: active ? `0 2px 6px ${cfg.color}55` : '0 1px 2px rgba(0,0,0,0.05)',
                        position:'relative',
                        overflow:'hidden',
                        opacity: onCooldown ? 0.7 : 1,
                        flex: isMobile ? '1 0 calc(18% - 4px)' : undefined,
                        minWidth: isMobile ? 44 : undefined,
                        minHeight: isMobile ? 44 : undefined,
                      }}
                    >
                      {onCooldown && (
                        <>
                          <div style={{ position:'absolute', left:0, bottom:0, width:'100%', height:`${Math.min(100, Math.max(0, ratio * 100))}%`, background:'rgba(15,23,42,0.35)', transition:'height 0.1s linear' }} />
                          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#f8fafc', textShadow:'0 1px 2px rgba(0,0,0,0.4)' }}>
                            {Math.ceil(remaining)}s
                          </div>
                        </>
                      )}
                      {isMobile ? (
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <ElementIcon element={cfg.id} color={active ? '#ffffff' : cfg.color} size={26} />
                        </span>
                      ) : (
                        <>
                          <span style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <ElementIcon element={cfg.id} color={active ? '#ffffff' : cfg.color} size={28} />
                          </span>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                            <span>{cfg.name}</span>
                            <span style={{ fontSize:12, color: active ? '#f9fafb' : '#6b7280', display:'inline-flex', alignItems:'center', gap:4 }}>
                              <SunIcon size={16} />
                              {cfg.cost}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlantInfo && (
              <div style={{ fontSize:12, color:'#6b7280', padding:'4px 0' }}>
                当前操作：放置 {selectedPlantInfo.name}（消耗 {selectedPlantInfo.cost} 阳光）
                {selectedPlantRemaining > 0.01 ? `，冷却中 ${Math.ceil(selectedPlantRemaining)} 秒` : selectedPlantInfo.placementCooldown ? `，冷却 ${selectedPlantInfo.placementCooldown} 秒` : ''}
              </div>
            )}
          {!selectedPlantInfo && selectedElementInfo && (
            <div style={{ fontSize:12, color:'#6b7280', padding:'4px 0' }}>
              当前操作：释放 {selectedElementInfo.name}（消耗 {selectedElementInfo.cost} 阳光，单独释放冷却 {selectedElementCooldown} 秒，附加到植物时无冷却）
            </div>
          )}
              </>
            )}
          </div>
        </aside>

        <div
          ref={mapWrapperRef}
          className="game-map-stage"
          style={{
          }}
        >
        <svg
          ref={svgRef}
          onClick={handlePlace}
          className="game-map-svg"
          style={{
            width: fittedMapWidth > 0 ? fittedMapWidth : undefined,
            height: fittedMapHeight > 0 ? fittedMapHeight : undefined,
            cursor: shovelActive ? 'crosshair' : selectedPlant || selectedConveyorItem?.kind === 'plant' ? 'crosshair' : selectedElement || selectedConveyorItem?.kind === 'element' ? 'cell' : 'default',
          }}
          viewBox={`0 0 ${baseMapWidth} ${baseMapHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="100%" height="100%" fill="transparent" />
          <defs>
            <pattern id="grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={mapWidth * CELL_SIZE} height={mapHeight * CELL_SIZE} fill="url(#grid)" />

          {paths.map((path, pathIdx) => (
            <g key={pathIdx}>
              <polyline
                points={path.map(p => `${p.x * CELL_SIZE},${p.y * CELL_SIZE}`).join(' ')}
                fill="none"
                stroke="#9ca3af"
                strokeWidth={outerWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
              />
              <polyline
                points={path.map(p => `${p.x * CELL_SIZE},${p.y * CELL_SIZE}`).join(' ')}
                fill="none"
                stroke="#F8FAFC"
                strokeWidth={corridorPx}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={1}
              />
            </g>
          ))}

          <g>
            {plantGrid.map((p, i) => (
              <circle
                key={i}
                cx={p.x * CELL_SIZE}
                cy={p.y * CELL_SIZE}
                r={3}
                fill="#d1d5db"
                opacity={0.4}
              />
            ))}
          </g>

          {(() => {
            // 收集所有唯一的终点坐标（去重，使用四舍五入容忍浮点数误差）
            const uniqueEndPoints = new Map<string, Position>();
            paths.forEach((path) => {
              const endPoint = path[path.length - 1];
              // 四舍五入到小数点后1位，容忍坐标偏移误差
              const roundedX = Math.round(endPoint.x * 10) / 10;
              const roundedY = Math.round(endPoint.y * 10) / 10;
              const key = `${roundedX},${roundedY}`;
              if (!uniqueEndPoints.has(key)) {
                uniqueEndPoints.set(key, endPoint);
              }
            });

            // 为每个唯一的终点渲染一个家
            return Array.from(uniqueEndPoints.values()).map((endPoint) => {
              const houseSize = CELL_SIZE * 1.5;
              const houseX = endPoint.x * CELL_SIZE - houseSize / 2;
              const houseY = endPoint.y * CELL_SIZE - houseSize / 2;

              return (
                <g key={`house-${endPoint.x}-${endPoint.y}`}>
                  <rect
                    x={houseX + houseSize * 0.15}
                    y={houseY + houseSize * 0.4}
                    width={houseSize * 0.7}
                    height={houseSize * 0.5}
                    fill="#8b4513"
                    stroke="#654321"
                    strokeWidth="1.5"
                  />
                  <path
                    d={`M ${houseX + houseSize * 0.5} ${houseY + houseSize * 0.1}
                        L ${houseX + houseSize * 0.05} ${houseY + houseSize * 0.45}
                        L ${houseX + houseSize * 0.95} ${houseY + houseSize * 0.45} Z`}
                    fill="#dc2626"
                    stroke="#991b1b"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={houseX + houseSize * 0.4}
                    y={houseY + houseSize * 0.6}
                    width={houseSize * 0.2}
                    height={houseSize * 0.3}
                    fill="#654321"
                    stroke="#4a3319"
                    strokeWidth="1"
                  />
                  <rect
                    x={houseX + houseSize * 0.2}
                    y={houseY + houseSize * 0.5}
                    width={houseSize * 0.15}
                    height={houseSize * 0.15}
                    fill="#87ceeb"
                    stroke="#4682b4"
                    strokeWidth="1"
                  />
                </g>
              );
            });
          })()}
          {towers.map(t => {
            if (t.type !== 'electricFlower' || !t.lockedTargetId) return null;
            const target = enemies.find(e => e.id === t.lockedTargetId && e.hp > 0);
            if (!target) return null;
            const from = worldToPx(t.pos);
            const to = worldToPx(target.pos);
            const charge = Math.max(0.01, Math.min(1, t.channelDamagePct ?? 0.01));
            return (
              <g key={`channel-${t.id}`} style={{ pointerEvents: 'none' }}>
                <line
                  x1={from.left}
                  y1={from.top}
                  x2={to.left}
                  y2={to.top}
                  stroke="#7c3aed"
                  strokeWidth={1.2 + charge * 1.6}
                  strokeOpacity={0.35 + charge * 0.25}
                  strokeLinecap="round"
                  strokeDasharray="3 5"
                />
                <circle
                  cx={to.left}
                  cy={to.top}
                  r={4 + charge * 3}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={1.2}
                  strokeOpacity={0.45}
                />
              </g>
            );
          })}
          {towers.map(t => {
            const elementInfo = t.element ? ELEMENT_PLANT_CONFIG[t.element.type] : null;
            const iconStroke = t.element ? (elementInfo?.color || t.color || DEFAULT_PLANT_COLOR) : (t.color || '#9ca3af');
            const lifetimeSec = getPlantRuntimeConfig(t.type, labOverrides)?.lifetimeSec;
            const lifetimePercent = t.expiresAt != null && lifetimeSec
              ? Math.max(0, Math.min(1, (t.expiresAt - gameTime) / lifetimeSec))
              : 1;
            const lifetimeOpacity = Math.max(0.25, Math.min(1, 0.25 + lifetimePercent * 0.7));
            const { left, top } = worldToPx(t.pos);
            const tileSize = CELL_SIZE * 0.9;
            const iconSize = CELL_SIZE * 0.78;
            return (
              <g
                key={t.id}
                onClick={(e) => handleTowerClick(t, e)}
                style={{
                  cursor: shovelActive || t.type === 'sunlightFlower' ? 'pointer' : 'default',
                  filter: t.element?.type === 'light' ? `drop-shadow(0 0 5px ${t.element.color})` : 'none',
                }}
              >
                {t.range > 0 && (
                  <circle
                    cx={left}
                    cy={top}
                    r={t.range * CELL_SIZE}
                    fill="none"
                    stroke="rgba(17,24,39,0.15)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    pointerEvents="none"
                  />
                )}
                <rect
                  x={left - tileSize / 2}
                  y={top - tileSize / 2}
                  width={tileSize}
                  height={tileSize}
                  rx={6}
                  ry={6}
                  fill="rgba(255,255,255,0.45)"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth={1}
                  opacity={lifetimeOpacity}
                />
                <g transform={`translate(${left - iconSize / 2} ${top - iconSize / 2})`} opacity={lifetimeOpacity}>
                  <PlantIcon type={t.type} color={iconStroke} size={iconSize} />
                </g>
                <text
                  x={left}
                  y={top + CELL_SIZE * 0.74}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#6b7280"
                  paintOrder="stroke"
                  stroke="rgba(255,255,255,0.86)"
                  strokeWidth={2}
                  pointerEvents="none"
                >
                  {`lv.${t.level ?? 1}`}
                </text>
              </g>
            );
          })}
 
          {singleUseCasts.map(cast => {
            const cfg = ELEMENT_PLANT_CONFIG[cast.element];
            const remaining = Math.max(0, cast.triggerTime - gameTime);
            const progress = Math.min(1, Math.max(0, 1 - remaining / 2));
            const size = CELL_SIZE * (0.7 + 0.3 * progress);
            const { left, top } = worldToPx(cast.pos);
            return (
              <g key={cast.id} transform={`translate(${left - size / 2} ${top - size / 2})`} pointerEvents="none">
                <ElementIcon element={cast.element} color={cfg.color} size={size} style={{ display:'block' }} />
                <text
                  x={size / 2}
                  y={size / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#0f172a"
                >
                  {remaining > 0.1 ? remaining.toFixed(1) : '0'}
                </text>
              </g>
            );
          })}
 
          {enemies.map(e => {
            const armorHp = Math.max(0, e.armorHp ?? 0);
            const maxArmorHp = Math.max(0, e.maxArmorHp ?? 0);
            const totalMaxHp = Math.max(1, e.maxHp + maxArmorHp);
            const hpPercent = Math.max(0, (Math.max(0, e.hp) + armorHp) / totalMaxHp);
            const armorPercent = maxArmorHp > 0 ? armorHp / maxArmorHp : 0;
            const bossSize = 10 + (totalMaxHp / 15);
            const alpha = Math.max(0.25, Math.min(1, 0.25 + hpPercent * 0.7));
            const grayValue = Math.round(31 + (1 - hpPercent) * 180);
            let enemyColor = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${alpha})`;
            if (e.burnUntil && typeof e.burnUntil === 'number' && gameTime < e.burnUntil) {
              enemyColor = `rgba(220,38,38,${alpha})`; // 红色
            } else if (e.armorBreakUntil && typeof e.armorBreakUntil === 'number' && gameTime < e.armorBreakUntil) {
              enemyColor = `rgba(217,119,6,${alpha})`; // 金色
            } else if (e.freezeUntil && typeof e.freezeUntil === 'number' && gameTime < e.freezeUntil) {
              enemyColor = `rgba(30,58,138,${alpha})`;
            } else if (e.slowUntil && typeof e.slowUntil === 'number' && gameTime < e.slowUntil) {
              enemyColor = `rgba(37,99,235,${alpha})`;
            }
            const shapeSize = e.isBoss ? Math.max(ENEMY_SHAPE_SIZE, bossSize) : ENEMY_SHAPE_SIZE;
            const strokeWidth = 2.2;
            const angryWriterStunned = e.shape === 'angryWriter' && !!e.newspaperStunUntil && gameTime < e.newspaperStunUntil;
            const angryWriterEnraged = e.shape === 'angryWriter' && !!e.newspaperEnraged && !angryWriterStunned;
            const shapeNode = (() => {
              switch (e.shape) {
                case 'triangle':
                case 'healer':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <polygon points="12 3 3 21 21 21" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                    </svg>
                  );
                case 'square':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} rx={3} ry={3} />
                    </svg>
                  );
                case 'armored':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <rect x="3.5" y="4.5" width="17" height="16" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} rx={3} ry={3} />
                      <path d="M7 8 H17 M7 12 H17 M7 16 H17" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.72} strokeLinecap="round" strokeOpacity={Math.max(0.28, armorPercent)} />
                      <path d="M12 4.5 V20.5" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.55} strokeLinecap="round" strokeOpacity={Math.max(0.28, armorPercent)} />
                    </svg>
                  );
                case 'evilSniper':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <polygon points="12 2 22 12 12 22 2 12" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
                      <line x1="12" y1="2" x2="12" y2="22" stroke={enemyColor} strokeWidth={strokeWidth * 0.6} />
                      <line x1="2" y1="12" x2="22" y2="12" stroke={enemyColor} strokeWidth={strokeWidth * 0.6} />
                    </svg>
                  );
                case 'rager':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} />
                      <circle cx="12" cy="12" r="4" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.8} />
                    </svg>
                  );
                case 'igniter':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} />
                      <path d="M12 5 C15.2 8.1 16.6 11.1 15.6 14.3 C14.9 16.5 13.3 18 12 18 C10.7 18 9.1 16.5 8.4 14.3 C7.4 11.1 8.8 8.1 12 5 Z" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.72} strokeLinejoin="round" />
                    </svg>
                  );
                case 'summoner':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} rx={2} ry={2} />
                      <circle cx="12" cy="12" r="7" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.8} />
                    </svg>
                  );
                case 'iceShell':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} />
                      <path d="M6 12 C8.2 8 15.8 8 18 12 C15.8 16 8.2 16 6 12 Z" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.75} strokeLinejoin="round" />
                      <path d="M12 3.5 V7 M12 17 V20.5 M3.5 12 H7 M17 12 H20.5" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.6} strokeLinecap="round" />
                    </svg>
                  );
                case 'purifier':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} />
                      <circle cx="12" cy="12" r="5.5" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.7} />
                      <path d="M12 7.5 V16.5 M7.5 12 H16.5" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.82} strokeLinecap="round" />
                    </svg>
                  );
                case 'angryWriter':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill={angryWriterEnraged ? '#ef4444' : 'none'}
                        fillOpacity={angryWriterEnraged ? 0.34 : 0}
                        stroke={enemyColor}
                        strokeWidth={strokeWidth}
                      />
                      {!e.newspaperEnraged && (
                        <polygon points="12 6 6.2 17.5 17.8 17.5" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.72} strokeLinejoin="round" />
                      )}
                      {angryWriterStunned && (
                        <text x="18.2" y="7.4" textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="900" fill="#111827">
                          ?
                        </text>
                      )}
                    </svg>
                  );
                default:
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} />
                    </svg>
                  );
              }
            })();
            const { left, top } = worldToPx(e.pos);
            return (
              <g key={e.id} pointerEvents="none">
                <g transform={`translate(${left - shapeSize / 2} ${top - shapeSize / 2})`}>
                  {shapeNode}
                </g>
                <text
                  x={left}
                  y={top + shapeSize / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill="#6b7280"
                  paintOrder="stroke"
                  stroke="rgba(255,255,255,0.86)"
                  strokeWidth={2}
                >
                  {`lv.${e.level ?? 1}`}
                </text>
              </g>
            );
          })}
 
          {projectiles.map(p => {
            const borderColor = p.color || DEFAULT_BULLET_COLOR;
            const textColor = borderColor;
            const sourceTower = towers.find(t => t.id === p.sourceTowerId);
            const isLightBullet = p.elementType === 'light' || sourceTower?.element?.type === 'light';
            const { left, top } = worldToPx(p.pos);
            const width = 30;
            const height = 18;
            return (
              <g key={p.id} pointerEvents="none">
                <rect
                  x={left - width / 2}
                  y={top - height / 2}
                  width={width}
                  height={height}
                  rx={6}
                  ry={6}
                  fill="rgba(255,255,255,0.9)"
                  stroke={borderColor}
                  strokeWidth={1}
                />
                <text
                  x={left}
                  y={top}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={800}
                  fill={textColor}
                  style={{ filter: isLightBullet ? `drop-shadow(0 0 4px ${p.color})` : 'none' }}
                >
                  {Math.round(p.damage)}
                </text>
              </g>
            );
          })}

          {sunPickups.map(sun => {
            const pos = getSunDisplayPos(sun);
            const { left, top } = worldToPx(pos);
            const size = CELL_SIZE * 0.95;
            const collectProgress = sun.collecting && sun.collectedAt != null
              ? Math.max(0, Math.min(1, (gameTime - sun.collectedAt) / SUN_COLLECT_ANIMATION_SEC))
              : 0;
            const opacity = sun.collecting ? Math.max(0, 1 - collectProgress) : 1;
            const scale = sun.collecting ? 1 + collectProgress * 0.18 : 1;
            return (
              <g
                key={sun.id}
                transform={`translate(${left} ${top}) scale(${scale}) translate(${-size / 2} ${-size / 2})`}
                opacity={opacity}
                onClick={(event) => {
                  event.stopPropagation();
                  collectSun(sun.id);
                }}
                style={{ cursor: sun.collecting ? 'default' : 'pointer', pointerEvents: sun.collecting ? 'none' : 'auto' }}
              >
                <title>{`阳光 +${sun.value}`}</title>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size * 0.58}
                  fill="transparent"
                  pointerEvents="all"
                />
                <SunIcon size={size} />
              </g>
            );
          })}
 
          {damagePopups.map(p => {
            const { left, top } = worldToPx(p.pos);
            const width = 30;
            const height = 20;
            return (
              <g key={p.id} pointerEvents="none">
                <rect
                  x={left - width / 2}
                  y={top - height * 0.6}
                  width={width}
                  height={height}
                  rx={6}
                  ry={6}
                  fill="rgba(255,255,255,0.92)"
                  stroke={p.color}
                  strokeWidth={1}
                />
                <text
                  x={left}
                  y={top - height * 0.1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={800}
                  fill={p.color}
                >
                  {p.damage}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      </div>

      {!isWaveActive && waveIndex >= waves.length && (
        <div style={{ padding:'12px 18px', color:'#059669', flexShrink:0, fontWeight:700 }}>全部波次完成！🎉</div>
      )}
      {showAbout && (
        <div className="modal-backdrop" style={{ zIndex: 100 }}>
          <div className="glass-panel modal-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2>关于</h2>
            <p>Tower Defence Version 0.0.5</p>
            <h2>鸣谢</h2>
            <p>总策划:hebscyf</p>
            <p>代码:6gdfg</p>
            <p>测试员&贡献者:hebscyf,windymu,mountain,even zao</p>
            <button onClick={() => setShowAbout(false)} className="action-button" style={{ alignSelf: 'flex-end' }}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
