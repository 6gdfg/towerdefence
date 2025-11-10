import React, { useEffect, useMemo, useState } from 'react';
import './TransitionScreen.css';

interface TransitionScreenProps {
  onTransitionComplete: () => void;
}

const TransitionScreen: React.FC<TransitionScreenProps> = ({ onTransitionComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const randomColor = useMemo(() => {
    const colors = ['#2563eb', '#db2777', '#c026d3', '#7c3aed', '#2563eb', '#059669', '#ea580c'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1000); // Start fading out after 1s

    const completeTimer = setTimeout(() => {
      onTransitionComplete();
    }, 1500); // Complete transition after 1.5s

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onTransitionComplete]);

  return (
    <div className={`transition-screen ${fadingOut ? 'fading-out' : ''}`}>
      <div style={{ marginBottom: '20px', fontSize: '1.2rem', color: randomColor }}>Loading...</div>
      <div className="transition-progress-bar-container">
        <div className="transition-progress-bar" style={{ backgroundColor: randomColor, animationDuration: '1s' }}></div>
      </div>
    </div>
  );
};

export default TransitionScreen;