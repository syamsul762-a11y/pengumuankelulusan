import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(prev => ({ ...prev, isExpired: true }));
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isExpired: false
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-center p-6 bg-primary/10 rounded-2xl border border-primary/20">
        <h2 className="text-2xl font-bold text-primary animate-pulse">PENGUMUMAN TELAH DIBUKA!</h2>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto">
      {[
        { label: 'Hari', value: timeLeft.days },
        { label: 'Jam', value: timeLeft.hours },
        { label: 'Menit', value: timeLeft.minutes },
        { label: 'Detik', value: timeLeft.seconds }
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center justify-center p-3 md:p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-border">
          <span className="text-xl md:text-4xl font-bold tracking-tighter text-primary">{item.value.toString().padStart(2, '0')}</span>
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground font-medium mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
