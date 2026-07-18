import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#030712] overflow-hidden">
      {/* Void Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/10 via-[#030712] to-black"></div>

      {/* Topographic Layer 1 */}
      <svg
        className="absolute w-[200vw] h-[200vw] sm:w-[150vw] sm:h-[150vw] md:w-[120vw] md:h-[120vw] animate-[spin_240s_linear_infinite]"
        style={{ top: '-10%', left: '-10%' }}
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M -100 300 C 200 200, 300 400, 600 250 C 900 100, 1100 500, 1100 500" fill="none" stroke="rgba(16, 185, 129, 0.07)" strokeWidth="0.5" />
        <path d="M 0 400 C 300 300, 400 500, 700 350 C 1000 200, 1200 600, 1200 600" fill="none" stroke="rgba(16, 185, 129, 0.07)" strokeWidth="0.5" />
        <path d="M 100 500 C 400 400, 500 600, 800 450 C 1100 300, 1300 700, 1300 700" fill="none" stroke="rgba(16, 185, 129, 0.07)" strokeWidth="0.5" />
      </svg>

      {/* Topographic Layer 2 */}
      <svg
        className="absolute w-[250vw] h-[250vw] sm:w-[180vw] sm:h-[180vw] md:w-[130vw] md:h-[130vw] animate-[spin_360s_linear_infinite_reverse]"
        style={{ bottom: '-30%', right: '-20%' }}
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 200 1100 C 100 800, 400 700, 500 900 C 600 1100, 800 1000, 900 1100" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="0.5" />
        <path d="M 300 1200 C 200 900, 500 800, 600 1000 C 700 1200, 900 1100, 1000 1200" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="0.5" />
      </svg>

      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};

export default AnimatedBackground;