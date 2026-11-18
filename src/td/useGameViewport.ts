import { useEffect, useState } from 'react';

type ViewportInput = { width: number; height: number; coarsePointer: boolean; userAgent?: string; mobileHint?: boolean };

export function classifyGameViewport({ width, height, coarsePointer, userAgent = '', mobileHint = false }: ViewportInput) {
  const phoneAgent = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(userAgent);
  const isPhone = mobileHint || phoneAgent || (coarsePointer && Math.min(width, height) <= 600);
  return { isPhone, isCompact: width <= 900, isPortrait: height > width };
}

function readViewport() {
  if (typeof window === 'undefined') return classifyGameViewport({ width: 1280, height: 720, coarsePointer: false });
  const mobileHint = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile;
  return classifyGameViewport({ width: window.innerWidth, height: window.innerHeight,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches, userAgent: navigator.userAgent, mobileHint });
}

export function useGameViewport() {
  const [viewport, setViewport] = useState(readViewport);
  useEffect(() => {
    const pointer = window.matchMedia('(pointer: coarse)');
    const update = () => setViewport(current => {
      const next = readViewport();
      return current.isPhone === next.isPhone && current.isCompact === next.isCompact && current.isPortrait === next.isPortrait ? current : next;
    });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    pointer.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
      pointer.removeEventListener('change', update);
    };
  }, []);
  return viewport;
}
