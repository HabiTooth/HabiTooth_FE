'use client';

import { useEffect, useRef, useState } from 'react';

export default function SandRevealImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const filterId = useRef(`sand-${Math.random().toString(36).slice(2, 9)}`).current;
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const DURATION = 1300;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / DURATION, 1);
      setProg(1 - Math.pow(1 - t, 4));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className={className} style={{ position: 'relative', overflow: 'visible' }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={(1 - prog) * 130} xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feOffset in="displaced" dx={(1 - prog) * -25} dy={(1 - prog) * -70} result="shifted" />
            <feGaussianBlur in="shifted" stdDeviation={(1 - prog) * 6} result="blurred" />
            <feColorMatrix in="blurred" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${prog} 0`} />
          </filter>
        </defs>
      </svg>
      <img src={src} alt={alt} style={{ filter: `url(#${filterId})`, width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}
