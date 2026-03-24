import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

interface PatternLockProps {
  onPatternComplete: (pattern: number[]) => void;
  error?: boolean;
  disabled?: boolean;
}

const DOT_COUNT = 9;


const PatternLock = ({ onPatternComplete, error = false, disabled = false }: PatternLockProps) => {
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  // Countdown timer
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setCountdown(0);
        setFailedAttempts(0);
      } else {
        setCountdown(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const getDotCenter = useCallback((index: number) => {
    const dot = dotRefs.current[index];
    const container = containerRef.current;
    if (!dot || !container) return { x: 0, y: 0 };
    const containerRect = container.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    return {
      x: dotRect.left + dotRect.width / 2 - containerRect.left,
      y: dotRect.top + dotRect.height / 2 - containerRect.top,
    };
  }, []);

  const getDotAtPosition = useCallback((clientX: number, clientY: number): number | null => {
    for (let i = 0; i < DOT_COUNT; i++) {
      const dot = dotRefs.current[i];
      if (!dot) continue;
      const rect = dot.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((clientX - cx) ** 2 + (clientY - cy) ** 2);
      if (dist < 30) return i;
    }
    return null;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled || isLockedOut) return;
    const dot = getDotAtPosition(clientX, clientY);
    if (dot !== null) {
      setIsDrawing(true);
      setSelectedDots([dot]);
      setCurrentPos({ x: clientX, y: clientY });
    }
  }, [disabled, isLockedOut, getDotAtPosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || disabled) return;
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    setCurrentPos({
      x: clientX - containerRect.left,
      y: clientY - containerRect.top,
    });

    const dot = getDotAtPosition(clientX, clientY);
    if (dot !== null && !selectedDots.includes(dot)) {
      setSelectedDots(prev => [...prev, dot]);
    }
  }, [isDrawing, disabled, selectedDots, getDotAtPosition]);

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPos(null);
    if (selectedDots.length >= 3) {
      onPatternComplete(selectedDots);
    }
    setTimeout(() => setSelectedDots([]), 500);
  }, [isDrawing, selectedDots, onPatternComplete]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchEnd = () => handleEnd();

    if (isDrawing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, handleMove, handleEnd]);

  const getLineSegments = () => {
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < selectedDots.length - 1; i++) {
      const from = getDotCenter(selectedDots[i]);
      const to = getDotCenter(selectedDots[i + 1]);
      segments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
    }
    if (isDrawing && currentPos && selectedDots.length > 0) {
      const last = getDotCenter(selectedDots[selectedDots.length - 1]);
      segments.push({ x1: last.x, y1: last.y, x2: currentPos.x, y2: currentPos.y });
    }
    return segments;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-[240px] h-[240px] mx-auto select-none touch-none"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {getLineSegments().map((seg, i) => (
          <line
            key={i}
            x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
            stroke={error ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="grid grid-cols-3 gap-0 w-full h-full" dir="ltr">
        {Array.from({ length: DOT_COUNT }).map((_, i) => {
          const isSelected = selectedDots.includes(i);
          return (
            <div key={i} className="flex items-center justify-center">
              <div
                ref={(el) => { dotRefs.current[i] = el; }}
                className={cn(
                  "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                  isSelected
                    ? error
                      ? "border-destructive bg-destructive/10"
                      : "border-primary bg-primary/10"
                    : "border-muted-foreground/30 bg-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-150",
                    isSelected
                      ? error
                        ? "bg-destructive scale-100"
                        : "bg-primary scale-100"
                      : "bg-muted-foreground/40 scale-75"
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatternLock;
