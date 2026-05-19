import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface CountdownProps {
  date: string;
}

export const Countdown: React.FC<CountdownProps> = ({ date }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const targetDate = new Date(date).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-4 justify-center py-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <motion.div 
          key={unit}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="bg-primary/10 text-primary rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-black border border-primary/20">
            {value.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1">{unit}</span>
        </motion.div>
      ))}
    </div>
  );
};
