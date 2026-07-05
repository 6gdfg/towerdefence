import React, { useEffect, useState } from 'react';
import './TransitionScreen.css';

interface TransitionScreenProps {
  onTransitionComplete: () => void;
}

const TransitionScreen: React.FC<TransitionScreenProps> = ({ onTransitionComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const dotTimer = window.setInterval(() => {
      setDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 1000); // Start fading out after 1s

    const completeTimer = window.setTimeout(() => {
      onTransitionComplete();
    }, 1500); // Complete transition after 1.5s

    return () => {
      window.clearInterval(dotTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onTransitionComplete]);

  return (
    <div className={`transition-screen ${fadingOut ? 'fading-out' : ''}`}>
      <div className="transition-screen-content">
        <div className="transition-title">TOWER DEFENCE</div>
        <div className="transition-status">Loading{'.'.repeat(dotCount)}</div>
      </div>
    </div>
  );
};

export default TransitionScreen;
