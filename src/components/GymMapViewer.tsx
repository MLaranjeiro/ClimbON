import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface GymMapViewerProps {
  imageUrl: string;
  children?: ReactNode;
}

export function GymMapViewer({ imageUrl, children }: GymMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  function clampScale(next: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
  }

  function reset() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function zoomBy(delta: number) {
    setScale((s) => clampScale(s + delta));
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const nextScale = clampScale(scale - e.deltaY * 0.0015 * scale);
    if (nextScale === scale) return;

    const ratio = nextScale / scale;
    setPan((p) => ({
      x: cursorX - ratio * (cursorX - p.x),
      y: cursorY - ratio * (cursorY - p.y),
    }));
    setScale(nextScale);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (scale <= 1) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const { startX, startY, panX, panY } = dragState.current;
    setPan({ x: panX + (e.clientX - startX), y: panY + (e.clientY - startY) });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="relative w-full origin-top-left"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          <img src={imageUrl} alt="" className="w-full select-none pointer-events-none" draggable={false} />
          {children}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 border border-gray-200 shadow-lg px-1.5 py-1">
        <button
          type="button"
          onClick={() => zoomBy(-0.25)}
          className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-gray-600 w-10 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(0.25)}
          className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
