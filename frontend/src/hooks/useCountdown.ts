import { useState, useEffect } from 'react';

export interface UseCountdownReturn {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
  isExpired: boolean;
}

export function useCountdown(targetDate?: string | Date | null): UseCountdownReturn {
  const calculateRemaining = () => {
    if (!targetDate) {
      return {
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        formatted: '00:00',
        isExpired: true,
      };
    }

    const targetTime = typeof targetDate === 'string' ? new Date(targetDate).getTime() : targetDate.getTime();
    if (isNaN(targetTime)) {
      return {
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        formatted: '00:00',
        isExpired: true,
      };
    }

    const now = Date.now();
    const remainingMs = Math.max(0, targetTime - now);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const isExpired = totalSeconds <= 0;

    return {
      minutes,
      seconds,
      totalSeconds,
      formatted,
      isExpired,
    };
  };

  const [countdown, setCountdown] = useState<UseCountdownReturn>(calculateRemaining);

  useEffect(() => {
    // Initial calculate on date change
    setCountdown(calculateRemaining());

    if (!targetDate) return;

    const timer = setInterval(() => {
      const updated = calculateRemaining();
      setCountdown(updated);
      if (updated.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return countdown;
}
