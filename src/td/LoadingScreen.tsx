import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onAnimationComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onAnimationComplete }) => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const dotTimer = window.setInterval(() => {
      setDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    const completeTimer = window.setTimeout(onAnimationComplete, 1000);

    return () => {
      window.clearInterval(dotTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        <div className="loading-title">TOWER DEFENCE</div>
        <div className="loading-status">Loading{'.'.repeat(dotCount)}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
