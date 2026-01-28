'use client';

import { useEffect, useState } from 'react';

export function HeroBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
      {/* 1. Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,33,68,1),transparent_90%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.5),transparent_50%)]" />

      {/* 2. Abstract 3D Grid (Floor) */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(1000px) rotateX(60deg) translateY(-200px) scale(2.5)',
          transformOrigin: 'top center',
          maskImage: 'linear-gradient(to bottom, transparent 5%, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 5%, black 40%, transparent 95%)',
        }}
      />

      {/* 3. Detailed Financial Charts (SVG) */}
      <svg 
        className="absolute inset-0 h-full w-full opacity-80" 
        preserveAspectRatio="xMidYMax slice" 
        viewBox="0 0 1920 1080"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
          <linearGradient id="chartGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.5)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Primary Chart (Bullish Trend) - Area Chart style */}
        <path
          d="M0,800 L200,650 L350,700 L500,450 L700,550 L900,300 L1100,350 L1300,150 L1500,250 L1700,100 L1920,200 L1920,1080 L0,1080 Z"
          fill="url(#chartGradient)"
          className="animate-in slide-in-from-bottom duration-1000"
          style={{ transformOrigin: 'bottom' }}
        />
        <path
          d="M0,800 L200,650 L350,700 L500,450 L700,550 L900,300 L1100,350 L1300,150 L1500,250 L1700,100 L1920,200"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          filter="url(#glow)"
          className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
        />

        {/* Secondary Chart (Comparison) */}
        <path
          d="M0,900 L250,800 L450,850 L650,600 L850,700 L1050,500 L1250,550 L1500,350 L1700,450 L1920,250 L1920,1080 L0,1080 Z"
          fill="url(#chartGradient2)"
          className="opacity-40"
        />
        <path
          d="M0,900 L250,800 L450,850 L650,600 L850,700 L1050,500 L1250,550 L1500,350 L1700,450 L1920,250"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          className="opacity-60 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
        />

        {/* Candlestick-like bars (Abstract) */}
        {[...Array(15)].map((_, i) => {
          const x = 150 + i * 120;
          const height = Math.random() * 200 + 50;
          const y = 600 - Math.random() * 300;
          const isGreen = Math.random() > 0.4;
          return (
            <g key={i} className="opacity-30">
              <rect
                x={x}
                y={y}
                width="6"
                height={height}
                fill={isGreen ? '#10b981' : '#ef4444'}
                rx="2"
              />
              <rect
                x={x + 2}
                y={y - 20}
                width="2"
                height={height + 40}
                fill={isGreen ? '#10b981' : '#ef4444'}
              />
            </g>
          );
        })}
      </svg>
      
      {/* 4. Floating UI Elements (3D Effect) */}
      <div className="absolute right-[5%] top-[10%] sm:top-[15%] opacity-80 sm:opacity-100 scale-75 sm:scale-100 animate-float-delayed">
        <div className="glass p-3 sm:p-4 rounded-xl border-l-4 border-l-green-500 w-40 sm:w-48 shadow-2xl bg-slate-900/80 transform rotate-[-5deg]">
          <div className="text-[10px] sm:text-xs text-slate-400">Total Profit</div>
          <div className="text-xl sm:text-2xl font-bold text-green-400">+$12,450</div>
          <div className="text-[10px] sm:text-xs text-green-500 mt-1 flex items-center">
             ▲ 14.2% increased
          </div>
        </div>
      </div>
      
      <div className="absolute left-[5%] bottom-[15%] sm:bottom-[20%] opacity-80 sm:opacity-100 scale-75 sm:scale-100 animate-float">
         <div className="glass p-3 sm:p-4 rounded-xl border-l-4 border-l-blue-500 w-40 sm:w-48 shadow-2xl bg-slate-900/80 transform rotate-[5deg]">
          <div className="text-[10px] sm:text-xs text-slate-400">Monthly Savings</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-400">+$2,800</div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 w-[75%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
