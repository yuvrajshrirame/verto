import React, { useState } from 'react';

const Landing = ({ onLogin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    // Locked to h-screen and overflow-hidden to prevent scrolling
    <div className="h-screen flex flex-col bg-[#030712] selection:bg-emerald-500/30 font-sans overflow-hidden relative">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation - Adjusted padding */}
      <nav className="max-w-6xl w-full mx-auto px-6 py-5 flex justify-between items-center relative z-10 shrink-0">
        <div className="text-2xl font-bold text-white tracking-wider drop-shadow-md">
          VERTO<span className="text-emerald-500">.</span>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-mono uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all duration-300 bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 hover:from-emerald-500/20 px-6 py-2.5 rounded-xl cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          Initialize
        </button>
      </nav>

      {/* Hero Section - Reduced margins to fit single viewport */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-[#090a0f]/60 backdrop-blur-sm border border-emerald-900/50 border-t-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-full px-4 py-1.5 mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase mt-0.5">VERTO ONLINE // V1.0</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tight mb-5 drop-shadow-lg">
          Proof of Work.
        </h1>
        
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mb-8 font-light leading-relaxed">
          Track active <span className="font-mono text-emerald-400/80 tracking-tight">focus_nodes</span>, battle your peers in deep-work sprints, and level up your <span className="font-mono text-emerald-400/80 tracking-tight">dev_profile</span>. The ultimate accountability engine.
        </p>

        {/* Wikipedia Meaning Card - Tightened padding */}
        <div className="text-left bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] max-w-lg w-full relative overflow-hidden animate-fade-in">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
           
           <div className="flex items-baseline gap-4 mb-3 border-b border-emerald-900/30 pb-2.5 relative z-10">
              <h3 className="text-2xl font-serif text-white tracking-wide drop-shadow-sm">verto</h3>
              <span className="font-mono text-emerald-500/80 text-xs tracking-wider">/ˈvɛr.toʊ/</span>
              <span className="font-mono text-slate-500 text-[10px] uppercase tracking-widest ml-auto italic">Latin</span>
           </div>
           
           <ol className="list-none space-y-2.5 text-slate-300 font-serif text-sm relative z-10">
              <li className="flex items-start gap-3">
                 <span className="text-emerald-600 font-mono text-xs mt-0.5">1.</span>
                 <div className="leading-relaxed"><span className="italic text-emerald-400/90 font-mono text-xs mr-2">verb</span> to turn, change, or transform.</div>
              </li>
              <li className="flex items-start gap-3">
                 <span className="text-emerald-600 font-mono text-xs mt-0.5">2.</span>
                 <div className="leading-relaxed"><span className="italic text-emerald-400/90 font-mono text-xs mr-2">verb</span> to exchange or translate into something new.</div>
              </li>
           </ol>
        </div>
        
        <div className="flex items-center space-x-3 text-slate-600 font-mono text-xs mt-8 tracking-widest uppercase">
           <span className="text-emerald-500/70">{'>'}</span>
           <span className="animate-pulse">Awaiting authentication sequence...</span>
        </div>
      </section>

      {/* Footer - Updated Links & Reduced padding */}
      <footer className="w-full text-center py-4 border-t border-white/5 relative z-10 shrink-0 bg-[#030712]/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 font-mono uppercase tracking-widest">
          <p>© 2026 Verto. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-3 md:mt-0">
            <a href="https://github.com/yuvrajshrirame/verto" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors duration-300">Documentation</a>
            <a href="https://github.com/yuvrajshrirame/verto" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors duration-300">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4">
          
          <div 
            className="absolute inset-0 bg-[#000000d9] backdrop-blur-sm animate-fade-in cursor-pointer" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Metallic Background applied to Modal Wrapper ONLY */}
          <div 
            className="relative z-10 w-full max-w-[340px] bg-gradient-to-br from-[#1a1d24]/95 to-[#090a0f]/95 backdrop-blur-3xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-[32px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] animate-modal-pop text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent z-50" />
            
            {/* Original Inner Components Untouched */}
            <img 
              src="/verto-logo.png" 
              alt="Verto Logo" 
              className="w-11 h-11 object-contain mb-6 relative z-10" 
            />
            
            <p className="text-white font-bold text-[15px] mb-4 tracking-wider relative z-10">
              VERTO<span className="text-emerald-500">.</span>
            </p>
            
            <h2 className="text-[32px] font-semibold text-white leading-[1.15] tracking-tight mb-8 relative z-10">
              An efficient tool to <span className="text-[#34d399]">track</span> and manage your <span className="text-[#34d399]">focus sessions</span>
            </h2>
            
            <button 
              onClick={onLogin}
              className="flex items-center justify-center space-x-2.5 bg-[#1a1a1a] hover:bg-[#262626] border border-white/[0.08] transition-all duration-300 rounded-full px-5 py-2.5 group w-fit cursor-pointer relative z-10"
            >
              <svg className="w-[18px] h-[18px] text-white opacity-90 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-[#e2e8f0] text-[13px] font-medium tracking-wide">Continue with GitHub</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;