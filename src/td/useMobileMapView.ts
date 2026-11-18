import { useEffect, useRef, useState, type RefObject } from 'react';

type MapView = { zoom: number; x: number; y: number };

export function clampMapView(view: MapView, width: number, height: number): MapView {
  const zoom = Math.max(1, Math.min(3, view.zoom));
  const halfWidth = width / zoom / 2;
  const halfHeight = height / zoom / 2;
  return { zoom, x: Math.max(halfWidth, Math.min(width - halfWidth, view.x)), y: Math.max(halfHeight, Math.min(height - halfHeight, view.y)) };
}

export function useMobileMapView(svgRef: RefObject<SVGSVGElement>, enabled: boolean, width: number, height: number) {
  const [view, setView] = useState<MapView>({ zoom: 1, x: width / 2, y: height / 2 });
  const current = clampMapView(view, width, height);
  const viewRef = useRef(current);
  viewRef.current = current;
  const reset = () => setView({ zoom: 1, x: width / 2, y: height / 2 });
  const changeZoom = (delta: number) => setView(previous => clampMapView({ ...previous, zoom: previous.zoom + delta }, width, height));

  useEffect(() => {
    const svg = svgRef.current;
    if (!enabled || !svg) return;
    let gesture: { view: MapView; anchorX: number; anchorY: number; midX: number; midY: number; distance: number; scaleX: number; scaleY: number } | null = null;
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      event.preventDefault();
      const [a, b] = [event.touches[0], event.touches[1]];
      const point = svg.createSVGPoint();
      point.x = (a.clientX + b.clientX) / 2;
      point.y = (a.clientY + b.clientY) / 2;
      const anchor = point.matrixTransform(matrix.inverse());
      gesture = { view: viewRef.current, anchorX: anchor.x, anchorY: anchor.y, midX: point.x, midY: point.y,
        distance: Math.max(1, Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY)), scaleX: matrix.a, scaleY: matrix.d };
    };
    const move = (event: TouchEvent) => {
      if (!gesture || event.touches.length !== 2) return;
      event.preventDefault();
      const [a, b] = [event.touches[0], event.touches[1]];
      const zoom = Math.max(1, Math.min(3, gesture.view.zoom * Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY) / gesture.distance));
      const ratio = gesture.view.zoom / zoom;
      setView(clampMapView({ zoom,
        x: gesture.anchorX + (gesture.view.x-gesture.anchorX) * ratio - ((a.clientX+b.clientX)/2-gesture.midX) * ratio / gesture.scaleX,
        y: gesture.anchorY + (gesture.view.y-gesture.anchorY) * ratio - ((a.clientY+b.clientY)/2-gesture.midY) * ratio / gesture.scaleY,
      }, width, height));
    };
    const end = (event: TouchEvent) => { if (event.touches.length < 2) gesture = null; };
    svg.addEventListener('touchstart', start, { passive: false });
    svg.addEventListener('touchmove', move, { passive: false });
    svg.addEventListener('touchend', end);
    svg.addEventListener('touchcancel', end);
    return () => {
      svg.removeEventListener('touchstart', start);
      svg.removeEventListener('touchmove', move);
      svg.removeEventListener('touchend', end);
      svg.removeEventListener('touchcancel', end);
    };
  }, [enabled, height, svgRef, width]);

  const mapView = enabled ? current : { zoom: 1, x: width / 2, y: height / 2 };
  const viewWidth = width / mapView.zoom;
  const viewHeight = height / mapView.zoom;
  return { zoom: mapView.zoom, changeZoom, reset,
    viewBox: `${mapView.x - viewWidth / 2} ${mapView.y - viewHeight / 2} ${viewWidth} ${viewHeight}` };
}
