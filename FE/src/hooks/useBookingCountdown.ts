import { useState, useEffect } from 'react';

export function useBookingCountdown(holdExpireAt: string | null) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!holdExpireAt) {
      setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
      return;
    }

    const calculateTime = () => {
      const expirationTime = new Date(holdExpireAt).getTime();
      const now = new Date().getTime();
      const difference = expirationTime - now;

      if (difference <= 0) {
        return { minutes: 0, seconds: 0, isExpired: true };
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { minutes, seconds, isExpired: false };
    };

    const initial = calculateTime();
    setTimeLeft(initial);

    if (initial.isExpired) return;

    const intervalId = setInterval(() => {
      const updated = calculateTime();
      setTimeLeft(updated);
      if (updated.isExpired) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [holdExpireAt]);

  return timeLeft;
}
export default useBookingCountdown;
