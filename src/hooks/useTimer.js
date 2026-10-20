// Active gameplay timer hook.

import { useState, useEffect, useRef } from 'react';

/**
 * Tracks active elapsed seconds and milliseconds.
 * @param {boolean} running
 * @param {string} gameId
 * @returns {{ seconds: number, ms: number }}
 */
export function useTimer(running, gameId) {
  const [elapsed, setElapsed] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const timerRef = useRef({ acc: 0, start: null });

  // Reset on restart
  useEffect(() => {
    timerRef.current = { acc: 0, start: null };
    setElapsed(0);
    setElapsedMs(0);
  }, [gameId]);

  // Visibility and interval timer
  useEffect(() => {
    if (!running) return;

    const s = timerRef.current;
    if (typeof document !== 'undefined' && !document.hidden) {
      s.start = Date.now();
    }

    function pause() {
      if (s.start !== null) {
        s.acc += Date.now() - s.start;
        s.start = null;
        setElapsed(Math.floor(s.acc / 1000));
        setElapsedMs(s.acc);
      }
    }

    function resume() {
      if (typeof document !== 'undefined' && !document.hidden && s.start === null) {
        s.start = Date.now();
      }
    }

    function onVisibilityChange() {
      if (typeof document === 'undefined') return;
      document.hidden ? pause() : resume();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    // Tick every 250ms
    const intervalId = setInterval(() => {
      const total =
        s.start !== null
          ? s.acc + (Date.now() - s.start)
          : s.acc;
      setElapsed(Math.floor(total / 1000));
      setElapsedMs(total);
    }, 250);

    return () => {
      pause();
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [running, gameId]);

  return { seconds: elapsed, ms: elapsedMs };
}
