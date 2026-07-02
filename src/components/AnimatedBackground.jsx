import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#030712] overflow-hidden">
      {/* Deep modern gradient base - keeps the background dark and cinematic */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-[#030712] to-black"></div>

      {/* Topographic Layer 1 - Ultra thin, widely spaced, parallel-ish lines */}
      <svg
        className="absolute w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] md:w-[120vw] md:h-[120vw] animate-[spin_240s_linear_infinite]"
        style={{ top: '-10%', left: '-10%' }}
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sweep 1 */}
        <path d="M -100 300 C 200 200, 300 400, 600 250 C 900 100, 1100 500, 1100 500" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
        <path d="M -100 350 C 250 280, 350 480, 650 330 C 850 180, 1100 580, 1100 580" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
        <path d="M -100 400 C 300 360, 400 560, 700 410 C 800 260, 1100 660, 1100 660" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
        
        {/* Sweep 2 */}
        <path d="M 100 -100 C 150 300, 400 200, 500 500 C 600 800, 300 900, 300 1100" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
        <path d="M 180 -100 C 230 380, 480 280, 580 580 C 680 880, 380 980, 380 1100" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
        
        {/* Organic Closed Contour */}
        <path d="M 600 700 C 500 600, 700 500, 800 600 C 900 700, 700 800, 600 700 Z" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
        <path d="M 570 710 C 450 580, 720 450, 840 580 C 950 710, 720 850, 570 710 Z" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.5" />
      </svg>

      {/* Topographic Layer 2 - Very faint gold/emerald mix, counter-rotating slowly */}
      <svg
        className="absolute w-[250vw] h-[250vw] sm:w-[180vw] sm:h-[180vw] md:w-[130vw] md:h-[130vw] animate-[spin_360s_linear_infinite_reverse]"
        style={{ bottom: '-30%', right: '-20%' }}
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 200 1100 C 300 800, 100 600, 400 400 C 700 200, 900 300, 1100 100" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="0.5" />
        <path d="M 280 1100 C 380 880, 180 680, 480 480 C 780 280, 980 380, 1100 180" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="0.5" />
        
        <path d="M -100 700 C 300 800, 500 600, 700 700 C 900 800, 800 1100, 1100 1100" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="0.5" />
        
        {/* Subtle wide gold contour loop */}
        <path d="M 400 500 C 200 300, 600 100, 800 300 C 1000 500, 600 700, 400 500 Z" fill="none" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="0.5" />
        <path d="M 370 510 C 140 280, 620 50, 850 280 C 1080 510, 620 760, 370 510 Z" fill="none" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="0.5" />
      </svg>
    </div>
  );
};

export default AnimatedBackground;