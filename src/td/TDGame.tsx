import React, { useEffect, useRef, useState } from 'react';
import { useTDStore } from './store';
import { CELL_SIZE } from '../config/mapConfig';
import { Position } from '../types/game';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, DEFAULT_PLANT_COLOR, DEFAULT_BULLET_COLOR } from './plants';
import { PlantType, ElementType } from './types';

function worldToPx(p: Position) { return { left: p.x * CELL_SIZE, top: p.y * CELL_SIZE }; }

const ELEMENT_SINGLE_USE_COOLDOWN: Record<ElementType, number> = {
  ice: 20,
  fire: 30,
  wind: 20,
  gold: 20,
  electric: 30,
};

export default function TDGame({ onWin, onLose }: { onWin?: () => void; onLose?: () => void } = {}) {
  const { gold, lives, enemies, towers, projectiles, singleUseCasts, damagePopups, elementCooldowns, paths, mapWidth, mapHeight, roadWidthCells, plantGrid, waves, isWaveActive, waveIndex, running, startWave, placeTower, applyElement, canPlaceTower, update, togglePause, gameTime, availablePlants, availableElements, manualFireTower } = useTDStore();
  const [selectedPlant, setSelectedPlant] = useState<PlantType | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const announcedWinRef = useRef(false);
  const announcedLoseRef = useRef(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [mapScale, setMapScale] = useState(1);
  const selectedPlantInfo = selectedPlant ? BASE_PLANTS_CONFIG[selectedPlant] : null;
  const selectedElementInfo = selectedElement ? ELEMENT_PLANT_CONFIG[selectedElement] : null;
  const plantChoices = availablePlants.map(id => BASE_PLANTS_CONFIG[id]).filter(Boolean);
  const elementChoices = availableElements.map(id => ELEMENT_PLANT_CONFIG[id]).filter(Boolean);
  const selectedElementCooldown = selectedElement ? ELEMENT_SINGLE_USE_COOLDOWN[selectedElement] : 0;

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
    const updateScale = () => {
      const container = mapWrapperRef.current;
      if (!container) return;
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      if (baseMapWidth <= 0 || baseMapHeight <= 0) return;
      const widthRatio = availableWidth / baseMapWidth;
      const heightRatio = availableHeight / baseMapHeight;
      const nextScale = Math.min(widthRatio, heightRatio);
      setMapScale(prev => (Math.abs(prev - nextScale) > 0.001 ? nextScale : prev));
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && mapWrapperRef.current) {
      resizeObserver = new ResizeObserver(() => updateScale());
      resizeObserver.observe(mapWrapperRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver?.disconnect();
    };
  }, [baseMapWidth, baseMapHeight]);

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
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const scaledCell = CELL_SIZE * mapScale;
    if (scaledCell <= 0) return;
    const clickX = (e.clientX - rect.left) / scaledCell;
    const clickY = (e.clientY - rect.top) / scaledCell;

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
    e.stopPropagation();
    if (selectedPlant || selectedElement) return;
    if (tower.type === 'sunlightFlower') {
      manualFireTower(tower.id);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'stretch', padding:0, color:'#111827', background:'#f3f4f6', height:'100vh', width:'100%', overflow:'hidden' }}>
      <div style={{ padding:'16px 24px 12px 24px', display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>
        <header style={{ width:'100%', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div>🪙 金币: {gold}</div>
          <div>❤️ 生命: {lives}</div>
          <div>🌊 波次: {Math.min(waveIndex + (isWaveActive ? 1 : 0), waves.length)} / {waves.length}</div>
          <div style={{ fontSize:12, color:'#6b7280' }}>提示：塔和怪物已显示 lv. 等级</div>
          <div style={{ display:'flex', gap:8, alignItems: 'center' }}>
            <a href="https://github.com/6gdfg/towerdefence" target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: '#111827', display: 'flex', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
            <button onClick={() => setShowAbout(true)} className="btn-hover" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#111827', cursor:'pointer' }}>
              关于
            </button>
            <button onClick={togglePause} className="btn-hover" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#111827', cursor:'pointer' }}>
              {running ? '⏸️ 暂停' : '▶️ 继续'}
            </button>
            <button disabled={isWaveActive || waveIndex >= waves.length} onClick={startWave} className="btn-hover" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#111827', cursor:'pointer' }}>开始/下一波</button>
          </div>
        </header>
      </div>

      <div style={{ display:'flex', flex:'1 1 auto', minHeight:0 }}>
        <aside style={{ width:280, padding:'12px 16px 20px 24px', borderRight:'1px solid #e5e7eb', background:'#f8fafc', overflowY:'auto', flexShrink:0 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>基础植物</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {plantChoices.length === 0 && (
                  <div style={{ fontSize:12, color:'#9ca3af' }}>暂无可用植物</div>
                )}
                {plantChoices.map(cfg => {
                  const active = selectedPlant === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      onClick={() => { setSelectedPlant(active ? null : cfg.id); setSelectedElement(null); }}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'space-between',
                        padding:'8px 10px',
                        borderRadius:8,
                        border: active ? '2px solid #111827' : '1px solid #d1d5db',
                        background:'#ffffff',
                        color:'#111827',
                        cursor:'pointer',
                        boxShadow: active ? '0 2px 6px rgba(17,24,39,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <span style={{ fontSize:18, color: active ? '#111827' : '#6b7280' }}>{cfg.icon}</span>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                        <span>{cfg.name}</span>
                        <span style={{ fontSize:12, color:'#6b7280' }}>💰 {cfg.cost}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>元素增幅</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
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
                      onClick={handleSelect}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'space-between',
                        padding:'8px 10px',
                        borderRadius:8,
                        border: active ? `2px solid ${cfg.color}` : '1px solid #d1d5db',
                        background: active ? cfg.color : '#ffffff',
                        color: active ? '#ffffff' : '#111827',
                        cursor: active ? 'pointer' : onCooldown ? 'not-allowed' : 'pointer',
                        boxShadow: active ? `0 2px 6px ${cfg.color}55` : '0 1px 2px rgba(0,0,0,0.05)',
                        position:'relative',
                        overflow:'hidden',
                        opacity: onCooldown ? 0.7 : 1,
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
                      <span style={{ fontSize:18 }}>{cfg.name[0]}</span>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.2 }}>
                        <span>{cfg.name}</span>
                        <span style={{ fontSize:12, color: active ? '#f9fafb' : '#6b7280' }}>💰 {cfg.cost}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlantInfo && (
              <div style={{ fontSize:12, color:'#6b7280', padding:'4px 0' }}>
                当前操作：放置 {selectedPlantInfo.name}（消耗 {selectedPlantInfo.cost} 金币）
              </div>
            )}
          {!selectedPlantInfo && selectedElementInfo && (
            <div style={{ fontSize:12, color:'#6b7280', padding:'4px 0' }}>
              当前操作：释放 {selectedElementInfo.name}（消耗 {selectedElementInfo.cost} 金币，单独释放冷却 {selectedElementCooldown} 秒，附加到植物时无冷却）
            </div>
          )}
            <div style={{ fontSize:12, color:'#9ca3af' }}>提示：向日葵只能产金，无法附加元素；日光花需点击消耗10金币发动攻击；所有数值可在 src/td/plants.ts 中调整。</div>
          </div>
        </aside>

        <div
          ref={mapWrapperRef}
          style={{
            flex: '1 1 0%',
            width: '100%',
            position: 'relative',
            alignSelf: 'stretch',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
        <div
          onClick={handlePlace}
          style={{
            position: 'relative',
            width: baseMapWidth,
            height: baseMapHeight,
            background: '#F8FAFC',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            transform: `scale(${mapScale})`,
            transformOrigin: 'center center',
            cursor: selectedPlant ? 'crosshair' : selectedElement ? 'cell' : 'default',
          }}
        >
        <svg
          style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:1 }}
          width="100%"
          height="100%"
          viewBox={`0 0 ${baseMapWidth} ${baseMapHeight}`}
          preserveAspectRatio="none"
        >
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
        </svg>

        {towers.map(t => {
          const elementInfo = t.element ? ELEMENT_PLANT_CONFIG[t.element.type] : null;
          const iconStroke = t.element ? (elementInfo?.color || t.color || DEFAULT_PLANT_COLOR) : '#9ca3af';
          return (
            <div
              key={t.id}
              onClick={(e) => handleTowerClick(t, e)}
              style={{ position:'absolute', ...worldToPx(t.pos), width:CELL_SIZE, height:CELL_SIZE, transform:'translate(-50%, -50%)', zIndex:2, cursor: t.type === 'sunlightFlower' ? 'pointer' : 'default' }}
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
              <div style={{ position:'absolute', left:'50%', top:'50%', width: t.range*2*CELL_SIZE, height: t.range*2*CELL_SIZE, marginLeft: -t.range*CELL_SIZE, marginTop:-t.range*CELL_SIZE, border:`1px dashed rgba(17,24,39,0.15)`, borderRadius:'50%' }} />
              <div style={{ position:'absolute', left:'50%', top:'105%', transform:'translate(-50%, 0)', fontSize:10, color:'#6b7280', textAlign:'center', lineHeight:1.2 }}>
                <div>lv.{t.level ?? 1}</div>
              </div>
            </div>
          );
        })}

        {singleUseCasts.map(cast => {
          const cfg = ELEMENT_PLANT_CONFIG[cast.element];
          const remaining = Math.max(0, cast.triggerTime - gameTime);
          const progress = Math.min(1, Math.max(0, 1 - remaining / 2));
          const size = CELL_SIZE * (0.7 + 0.3 * progress);
          return (
            <div key={cast.id} style={{ position:'absolute', ...worldToPx(cast.pos), transform:'translate(-50%, -50%)', pointerEvents:'none', zIndex:5 }}>
              <svg width={size} height={size} viewBox="0 0 24 24" style={{ display:'block' }}>
                <polygon points="12 2 22 12 12 22 2 12" fill={`${cfg.color}33`} stroke={cfg.color} strokeWidth={2} />
              </svg>
              <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', fontSize:10, color:'#0f172a', fontWeight:600 }}>
                {remaining > 0.1 ? remaining.toFixed(1) : '0'}
              </div>
            </div>
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
          return (
            <div key={e.id} style={{ position:'absolute', ...worldToPx(e.pos), transform:'translate(-50%, -50%)', zIndex:2 }}>
              <div style={{ width:shapeSize, height:shapeSize, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {shapeNode}
              </div>
              <div style={{ position:'absolute', left:'50%', top:'100%', transform:'translate(-50%, 2px)', fontSize:10, color:'#6b7280' }}>lv.{(e as any).level ?? 1}</div>
            </div>
          );
        })}

        {projectiles.map(p => {
          const borderColor = p.color || DEFAULT_BULLET_COLOR;
          const textColor = borderColor;
              return (
                <div key={p.id} style={{ position:'absolute', ...worldToPx(p.pos), transform:'translate(-50%, -50%)', pointerEvents:'none', zIndex:10 }}>
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
                }}
              >
                {Math.round(p.damage)}
                  </div>
                </div>
              );
            })}

        {damagePopups.map(p => (
          <div key={p.id} style={{ position:'absolute', ...worldToPx(p.pos), transform:'translate(-50%, -60%)', pointerEvents:'none', zIndex:25 }}>
            <div style={{ padding:'2px 6px', fontSize:12, fontWeight:700, color:p.color, background:'rgba(255,255,255,0.92)', border:`1px solid ${p.color}`, borderRadius:6, boxShadow:'0 1px 3px rgba(15,23,42,0.15)' }}>
              {p.damage}
            </div>
          </div>
        ))}
        </div>
        </div>
      </div>

      {!isWaveActive && waveIndex >= waves.length && (
        <div style={{ padding:'16px 24px', color:'#a3e635', flexShrink:0 }}>全部波次完成！🎉</div>
      )}
      {showAbout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2>关于</h2>
            <p>Tower Defence Version 0.0.5</p>
            <h2>鸣谢</h2>
            <p>总策划:hebscyf</p>
            <p>代码:6gdfg</p>
            <p>测试员&贡献者:hebscyf,windymu,mountain,even zao</p>
            <button onClick={() => setShowAbout(false)} className="btn-hover" style={{ alignSelf: 'flex-end', padding:'6px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#111827', cursor:'pointer' }}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
