import React, { useEffect, useRef, useState } from 'react';
import { useTDStore } from './store';
import { CELL_SIZE } from '../config/mapConfig';
import { Position } from '../types/game';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, DEFAULT_PLANT_COLOR, DEFAULT_BULLET_COLOR } from './plants';
import { PlantType, ElementType } from './types';
import { ELEMENT_SINGLE_USE_COOLDOWN } from './config';

function worldToPx(p: Position) { return { left: p.x * CELL_SIZE, top: p.y * CELL_SIZE }; }

type TDGameProps = {
  onWin?: () => void;
  onLose?: () => void;
  onExit?: () => void;
};

export default function TDGame({ onWin, onLose, onExit }: TDGameProps = {}) {
  const { gold, lives, enemies, towers, projectiles, singleUseCasts, damagePopups, elementCooldowns, plantCooldowns, paths, mapWidth, mapHeight, roadWidthCells, plantGrid, waves, isWaveActive, waveIndex, running, startWave, placeTower, applyElement, canPlaceTower, update, togglePause, gameTime, availablePlants, availableElements, manualFireTower, mode, lifeBonusPerWave } = useTDStore();
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false,
  );
  const [showAbout, setShowAbout] = useState(false);
  const announcedWinRef = useRef(false);
  const announcedLoseRef = useRef(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedPlantInfo = selectedPlant ? BASE_PLANTS_CONFIG[selectedPlant] : null;
  const selectedElementInfo = selectedElement ? ELEMENT_PLANT_CONFIG[selectedElement] : null;
  const plantChoices = availablePlants.map(id => BASE_PLANTS_CONFIG[id]).filter(Boolean);
  const elementChoices = availableElements.map(id => ELEMENT_PLANT_CONFIG[id]).filter(Boolean);
  const selectedElementCooldown = selectedElement ? ELEMENT_SINGLE_USE_COOLDOWN[selectedElement] : 0;
  const selectedPlantRemaining = selectedPlant ? Math.max(0, (plantCooldowns?.[selectedPlant] ?? 0) - gameTime) : 0;
  const waveNumberDisplay = waveIndex + (isWaveActive ? 1 : 0);
  const isFiniteMode = mode === 'campaign' || mode === 'random';
  const modeLabel = mode === 'endless'
    ? '无尽模式'
    : mode === 'endlessTest'
      ? '测试模式'
      : mode === 'random'
        ? '随机模式'
        : mode === 'campaign'
          ? '关卡模式'
          : null;

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
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const renderPlantIcon = (tower: typeof towers[number]) => {
    const stroke = tower.element ? (tower.color || '#f59e0b') : '#9ca3af';
    const strokeWidth = 2.2;
    switch (tower.type) {
      case 'sunflower':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="12" cy="12" r="3.5" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
          </svg>
        );
      case 'bottleGrass':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <rect x="5" y="5" width="14" height="14" rx="2" ry="2" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'puffShroom':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" ry="1.5" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'fourLeafClover':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <circle cx="9" cy="8" r="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="15" cy="8" r="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="9" cy="16" r="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="15" cy="16" r="4" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      case 'machineGun':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <polygon points="12 4 4 20 20 20" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          </svg>
        );
      case 'rocket':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <polygon points="12 3 21 12 12 21 3 12" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="8.5" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
            <line x1="12" y1="21" x2="12" y2="17" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
          </svg>
        );
      case 'sunlightFlower':
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" fill="none" stroke={stroke} strokeWidth={strokeWidth} rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.9} rx="1" ry="1" />
          </svg>
        );
      case 'sniper':
      default:
        return (
          <svg width={28} height={28} viewBox="0 0 24 24">
            <polygon points="12 4 20 12 12 20 4 12" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
            <line x1="12" y1="4" x2="12" y2="20" stroke={stroke} strokeWidth={strokeWidth * 0.6} />
            <line x1="4" y1="12" x2="20" y2="12" stroke={stroke} strokeWidth={strokeWidth * 0.6} />
          </svg>
        );
    }
  };

  const corridorPx = roadWidthCells * CELL_SIZE;
  const BORDER_PX = 0.6; // 路两侧边框粗细（像素）- 细灰线
  const outerWidth = corridorPx + BORDER_PX * 2;
  const baseMapWidth = mapWidth * CELL_SIZE;
  const baseMapHeight = mapHeight * CELL_SIZE;

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
    if (!selectedPlant && !selectedElement) return;
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
      if (selectedPlant) {
        if (canPlaceTower(nearestGrid)) {
          placeTower(selectedPlant, nearestGrid);
        }
      } else if (selectedElement) {
        applyElement(selectedElement, nearestGrid);
      }
    }
  };

  const handleTowerClick = (tower: typeof towers[number], e: React.MouseEvent) => {
    if (selectedPlant || selectedElement) {
      return;
    }
    e.stopPropagation();
    if (tower.type === 'sunlightFlower') {
      manualFireTower(tower.id);
    }
  };

  const handleExit = () => {
    if (!window.confirm('退出当前对局？本局进度不会保存。')) return;
    onExit?.();
  };


  return (
    <div className="game-shell">
      <header className="glass-panel game-topbar">
        <div className="game-stats">
          <div className="game-stat">金币: {gold}</div>
          <div className="game-stat">生命: {lives}</div>
          <div className="game-stat">波次: {isFiniteMode ? `${Math.min(waveNumberDisplay, waves.length)} / ${waves.length}` : `${waveNumberDisplay} / ∞`}</div>
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
            <button disabled={isWaveActive || waveIndex >= waves.length} onClick={startWave} className="action-button primary" style={{ opacity: isWaveActive || waveIndex >= waves.length ? 0.55 : 1 }}>开始/下一波</button>
          </div>
      </header>

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
                        <span style={{ fontSize:20 }}>{cfg.icon}</span>
                      ) : (
                        <>
                          <span style={{ fontSize:18, color: active ? '#111827' : '#6b7280' }}>{cfg.icon}</span>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                            <span>{cfg.name}</span>
                            <span style={{ fontSize:12, color:'#6b7280' }}>💰 {cfg.cost}{cfg.placementCooldown ? ` · ${cfg.placementCooldown}s` : ''}</span>
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
                        <span style={{ fontSize:18 }}>{cfg.name[0]}</span>
                      ) : (
                        <>
                          <span style={{ fontSize:18 }}>{cfg.name[0]}</span>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                            <span>{cfg.name}</span>
                            <span style={{ fontSize:12, color: active ? '#f9fafb' : '#6b7280' }}>💰 {cfg.cost}</span>
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
                当前操作：放置 {selectedPlantInfo.name}（消耗 {selectedPlantInfo.cost} 金币）
                {selectedPlantRemaining > 0.01 ? `，冷却中 ${Math.ceil(selectedPlantRemaining)} 秒` : selectedPlantInfo.placementCooldown ? `，冷却 ${selectedPlantInfo.placementCooldown} 秒` : ''}
              </div>
            )}
          {!selectedPlantInfo && selectedElementInfo && (
            <div style={{ fontSize:12, color:'#6b7280', padding:'4px 0' }}>
              当前操作：释放 {selectedElementInfo.name}（消耗 {selectedElementInfo.cost} 金币，单独释放冷却 {selectedElementCooldown} 秒，附加到植物时无冷却）
            </div>
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
            cursor: selectedPlant ? 'crosshair' : selectedElement ? 'cell' : 'default',
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
            const elementInfo = t.element ? ELEMENT_PLANT_CONFIG[t.element.type] : null;
            const iconStroke = t.element ? (elementInfo?.color || t.color || DEFAULT_PLANT_COLOR) : '#9ca3af';
            const { left, top } = worldToPx(t.pos);
            return (
              <foreignObject
                key={t.id}
                x={left - CELL_SIZE / 2}
                y={top - CELL_SIZE / 2}
                width={CELL_SIZE}
                height={CELL_SIZE}
                style={{
                  zIndex: 2,
                  cursor: t.type === 'sunlightFlower' ? 'pointer' : 'default',
                  filter: t.element?.type === 'light' ? `drop-shadow(0 0 5px ${t.element.color})` : 'none',
                  overflow: 'visible',
                }}
              >
                <div
                  onClick={(e) => handleTowerClick(t, e)}
                  style={{ width: '100%', height: '100%', pointerEvents: 'all' }}
                >
                  <div
                    style={{
                      width:'100%',
                      height:'100%',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      background:'rgba(255,255,255,0.45)',
                      borderRadius:6,
                      border:'1px solid rgba(148,163,184,0.25)',
                    }}
                  >
                    {renderPlantIcon({ ...t, color: iconStroke })}
                  </div>
                  <div
                    style={{
                      position:'absolute',
                      left:'50%',
                      top:'50%',
                      width: t.range * 2 * CELL_SIZE,
                      height: t.range * 2 * CELL_SIZE,
                      marginLeft: -t.range * CELL_SIZE,
                      marginTop: -t.range * CELL_SIZE,
                      border: `1px dashed rgba(17,24,39,0.15)`,
                      borderRadius: '50%',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ position:'absolute', left:'50%', top:'105%', transform:'translate(-50%, 0)', fontSize:10, color:'#6b7280', textAlign:'center', lineHeight:1.2 }}>
                    <div>lv.{t.level ?? 1}</div>
                  </div>
                </div>
              </foreignObject>
            );
          })}
 
          {singleUseCasts.map(cast => {
            const cfg = ELEMENT_PLANT_CONFIG[cast.element];
            const remaining = Math.max(0, cast.triggerTime - gameTime);
            const progress = Math.min(1, Math.max(0, 1 - remaining / 2));
            const size = CELL_SIZE * (0.7 + 0.3 * progress);
            const { left, top } = worldToPx(cast.pos);
            return (
              <foreignObject key={cast.id} x={left - size/2} y={top - size/2} width={size} height={size} style={{ pointerEvents:'none', zIndex:5 }}>
                <svg width={size} height={size} viewBox="0 0 24 24" style={{ display:'block' }}>
                  <polygon points="12 2 22 12 12 22 2 12" fill={`${cfg.color}33`} stroke={cfg.color} strokeWidth={2} />
                </svg>
                <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', fontSize:10, color:'#0f172a', fontWeight:600 }}>
                  {remaining > 0.1 ? remaining.toFixed(1) : '0'}
                </div>
              </foreignObject>
            );
          })}
 
          {enemies.map(e => {
            const size = 10 + (e.maxHp / 15);
            const hpPercent = e.hp / e.maxHp;
            const alpha = Math.max(0.25, Math.min(1, 0.25 + hpPercent * 0.7));
            const grayValue = Math.round(31 + (1 - hpPercent) * 180);
            let enemyColor = `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${alpha})`;
            if (e.burnUntil && typeof e.burnUntil === 'number' && gameTime < e.burnUntil) {
              enemyColor = `rgba(220,38,38,${alpha})`; // 红色
            } else if (e.armorBreakUntil && typeof e.armorBreakUntil === 'number' && gameTime < e.armorBreakUntil) {
              enemyColor = `rgba(217,119,6,${alpha})`; // 金色
            } else if (e.slowUntil && typeof e.slowUntil === 'number' && gameTime < e.slowUntil) {
              enemyColor = (e.slowPct || 0) >= 1 ? `rgba(30,58,138,${alpha})` : `rgba(37,99,235,${alpha})`;
            }
            const shapeSize = Math.max(18, size);
            const strokeWidth = 2.2;
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
                case 'summoner':
                  return (
                    <svg width={shapeSize} height={shapeSize} viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" fill="none" stroke={enemyColor} strokeWidth={strokeWidth} rx={2} ry={2} />
                      <circle cx="12" cy="12" r="7" fill="none" stroke={enemyColor} strokeWidth={strokeWidth * 0.8} />
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
              <foreignObject key={e.id} x={left - shapeSize/2} y={top - shapeSize/2} width={shapeSize} height={shapeSize + 15} style={{ zIndex:2, overflow:'visible' }}>
                <div style={{ width:shapeSize, height:shapeSize, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {shapeNode}
                </div>
                <div style={{ position:'absolute', left:'50%', top: shapeSize + 2, transform:'translate(-50%, 0)', fontSize:10, color:'#6b7280' }}>lv.{e.level ?? 1}</div>
              </foreignObject>
            );
          })}
 
          {projectiles.map(p => {
            const borderColor = p.color || DEFAULT_BULLET_COLOR;
            const textColor = borderColor;
            const sourceTower = towers.find(t => t.id === p.sourceTowerId);
            const isLightBullet = sourceTower?.element?.type === 'light';
            const { left, top } = worldToPx(p.pos);
            const width = 30;
            const height = 18;
            return (
              <foreignObject key={p.id} x={left - width/2} y={top - height/2} width={width} height={height} style={{ pointerEvents:'none', zIndex:10, overflow:'visible' }}>
                <div
                  style={{
                    minWidth: 20,
                    padding:'1px 4px',
                    fontSize:11,
                    fontWeight:700,
                    color: textColor,
                    background:'rgba(255,255,255,0.9)',
                    border:`1px solid ${borderColor}`,
                    borderRadius:6,
                    boxShadow:'0 1px 2px rgba(0,0,0,0.08)',
                    textAlign:'center',
                    textShadow: isLightBullet ? `0 0 4px ${p.color}` : 'none',
                  }}
                >
                  {Math.round(p.damage)}
                </div>
              </foreignObject>
            );
          })}
 
          {damagePopups.map(p => {
            const { left, top } = worldToPx(p.pos);
            const width = 30;
            const height = 20;
            return (
              <foreignObject key={p.id} x={left - width/2} y={top - height * 0.6} width={width} height={height} style={{ pointerEvents:'none', zIndex:25, overflow:'visible' }}>
                <div style={{ padding:'2px 6px', fontSize:12, fontWeight:700, color:p.color, background:'rgba(255,255,255,0.92)', border:`1px solid ${p.color}`, borderRadius:6, boxShadow:'0 1px 3px rgba(15,23,42,0.15)' }}>
                  {p.damage}
                </div>
              </foreignObject>
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
