import React, { useState } from 'react';

const Landing = ({ onLogin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-mesh-gradient selection:bg-emerald-500/30 font-sans overflow-hidden">
      
      {/* Navigation */}
      <nav className="max-w-6xl w-full mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <div className="text-2xl font-bold text-white tracking-wider">
          VERTO<span className="text-emerald-500">.</span>
        </div>
        
        {/* Login Button moved to Nav */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-mono uppercase tracking-widest text-emerald-400 hover:text-slate-950 transition-all duration-300 border border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-400 px-6 py-2.5 rounded-lg cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
        >
          Initialize
        </button>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 pb-20">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400 font-medium tracking-widest uppercase">VERTO ONLINE // V1.0</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tight mb-8">
          Proof of Work.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-light leading-relaxed">
          Track active <span className="font-mono text-emerald-400/80 tracking-tight">focus_nodes</span>, battle your peers in deep-work sprints, and level up your <span className="font-mono text-emerald-400/80 tracking-tight">dev_profile</span>. The ultimate accountability engine.
        </p>
        
        <div className="flex items-center space-x-3 text-slate-600 font-mono text-sm mt-4">
           <span className="text-emerald-500">{'>'}</span>
           <span className="animate-pulse">Awaiting authentication sequence...</span>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="w-full text-center py-6 border-t border-white/5 relative z-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 font-mono">
          <p>© 2026 Verto. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0 uppercase tracking-widest text-xs">
            <a href="#" className="hover:text-white transition-colors duration-300">Documentation</a>
            <a href="#" className="hover:text-white transition-colors duration-300">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4">
          
          {/* Clickable Backdrop */}
          <div 
            className="absolute inset-0 bg-[#000000a6] animate-fade-in cursor-pointer" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Container */}
          <div 
            className="relative z-10 w-full max-w-[340px] bg-[#0c0c0c] border border-white/[0.08] rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            
            <img 
              src="/verto-logo.png" 
              alt="Verto Logo" 
              className="w-11 h-11 object-contain mb-6" 
            />
            
            <p className="text-white font-bold text-[15px] mb-4 tracking-wider">
              VERTO<span className="text-emerald-500">.</span>
            </p>
            
            <h2 className="text-[32px] font-semibold text-white leading-[1.15] tracking-tight mb-8">
              An efficient tool to <span className="text-[#34d399]">track</span> and manage your <span className="text-[#34d399]">focus sessions</span>
            </h2>
            
            <button 
              onClick={onLogin}
              className="flex items-center justify-center space-x-2.5 bg-[#1a1a1a] hover:bg-[#262626] border border-white/[0.08] transition-all duration-300 rounded-full px-5 py-2.5 group w-fit cursor-pointer"
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