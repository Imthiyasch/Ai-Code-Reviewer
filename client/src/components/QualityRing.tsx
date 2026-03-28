import React, { useEffect, useRef, useState } from 'react';

interface QualityRingProps {
  score: number; // 1-10
  size?: number;
}

function scoreColor(score: number) {
  if (score <= 4) return '#ef4444';
  if (score <= 7) return '#f59e0b';
  return '#22c55e';
}

export function QualityRing({ score, size = 140 }: QualityRingProps) {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;
  const color = scoreColor(score);

  return (
    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--color-bg-3)" strokeWidth={10} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          style={{
            animation: `ringDraw 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards`,
            '--ring-total': circumference,
            '--ring-offset': offset,
          } as React.CSSProperties}
        />
      </svg>
      <div style={{ position:'absolute', textAlign:'center' }}>
        <div style={{ fontSize:size*0.26, fontWeight:800, color, lineHeight:1 }}>{displayed}</div>
        <div style={{ fontSize:size*0.1, color:'var(--color-text-3)', fontWeight:500 }}>/ 10</div>
      </div>
    </div>
  );
}

export default QualityRing;
