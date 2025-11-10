import React, { useMemo } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onAnimationComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onAnimationComplete }) => {
  const randomColor = useMemo(() => {
    const colors = ['#2563eb', '#db2777', '#c026d3', '#7c3aed', '#2563eb', '#059669', '#ea580c'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-text" style={{ color: randomColor }}>TOWER DEFENSE</div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ backgroundColor: randomColor }}
          onAnimationEnd={onAnimationComplete}
        ></div>
      </div>
    </div>
  );
};

export default LoadingScreen;