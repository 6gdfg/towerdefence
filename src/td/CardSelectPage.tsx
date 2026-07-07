import { useMemo, useState } from 'react';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, DEFAULT_PLANT_COLOR } from './plants';
import { ElementIcon, PlantIcon } from './TowerIcons';
import type { ElementType, PlantType, TowerLevelMap } from './types';

type CardSelectPageProps = {
  title: string;
  plantOptions: PlantType[];
  elementOptions: ElementType[];
  maxPlants: number;
  maxElements: number;
  towerLevels?: TowerLevelMap;
  onBack: () => void;
  onConfirm: (plants: PlantType[], elements: ElementType[]) => void;
};

function getLevelLabel(key: PlantType | `element:${ElementType}`, towerLevels?: TowerLevelMap) {
  return `Lv.${Math.max(1, Math.floor(towerLevels?.[key] || 1))}`;
}

export default function CardSelectPage({
  title,
  plantOptions,
  elementOptions,
  maxPlants,
  maxElements,
  towerLevels,
  onBack,
  onConfirm,
}: CardSelectPageProps) {
  const defaultPlants = useMemo(() => plantOptions.slice(0, Math.max(1, maxPlants)), [maxPlants, plantOptions]);
  const defaultElements = useMemo(() => elementOptions.slice(0, Math.max(0, maxElements)), [elementOptions, maxElements]);
  const [selectedPlants, setSelectedPlants] = useState<PlantType[]>(defaultPlants);
  const [selectedElements, setSelectedElements] = useState<ElementType[]>(defaultElements);

  const togglePlant = (plant: PlantType) => {
    setSelectedPlants(current => {
      if (current.includes(plant)) return current.filter(item => item !== plant);
      if (current.length >= maxPlants) return current;
      return [...current, plant];
    });
  };

  const toggleElement = (element: ElementType) => {
    setSelectedElements(current => {
      if (current.includes(element)) return current.filter(item => item !== element);
      if (current.length >= maxElements) return current;
      return [...current, element];
    });
  };

  return (
    <main className="page-wrap card-select-page">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Card Select</div>
            <h1>{title}</h1>
          </div>
          <div className="button-row">
            <button onClick={onBack} className="action-button">返回</button>
            <button
              onClick={() => onConfirm(selectedPlants, selectedElements)}
              disabled={selectedPlants.length === 0}
              className="action-button primary"
            >
              开始
            </button>
          </div>
        </div>
      </section>

      <section className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.04s' }}>
        <div className="lab-panel-title">
          <span>植物 {selectedPlants.length} / {maxPlants}</span>
        </div>
        <div className="card-pick-grid">
          {plantOptions.map(plant => {
            const cfg = BASE_PLANTS_CONFIG[plant];
            const selected = selectedPlants.includes(plant);
            const disabled = !selected && selectedPlants.length >= maxPlants;
            return (
              <button
                key={plant}
                onClick={() => togglePlant(plant)}
                disabled={disabled}
                className={`card-pick-item ${selected ? 'is-selected' : ''}`}
              >
                <PlantIcon type={plant} color={selected ? '#111827' : DEFAULT_PLANT_COLOR} size={30} />
                <span>{cfg.name}</span>
                <small>{getLevelLabel(plant, towerLevels)}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.08s' }}>
        <div className="lab-panel-title">
          <span>元素 {selectedElements.length} / {maxElements}</span>
        </div>
        <div className="card-pick-grid">
          {elementOptions.map(element => {
            const cfg = ELEMENT_PLANT_CONFIG[element];
            const selected = selectedElements.includes(element);
            const disabled = !selected && selectedElements.length >= maxElements;
            const key = `element:${element}` as const;
            return (
              <button
                key={element}
                onClick={() => toggleElement(element)}
                disabled={disabled}
                className={`card-pick-item element ${selected ? 'is-selected' : ''}`}
              >
                <ElementIcon element={element} color={selected ? cfg.color : '#94a3b8'} size={30} />
                <span>{cfg.name}</span>
                <small>{getLevelLabel(key, towerLevels)}</small>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
