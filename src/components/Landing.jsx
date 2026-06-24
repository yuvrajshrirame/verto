import React, { useState } from 'react';
import { Terminal, Trophy, Zap, Shield, ChevronRight } from 'lucide-react';

const Landing = ({ onLogin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      
      <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="text-2xl font-bold text-white tracking-wider">
          VERTO<span className="text-emerald-500">.</span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-sm font-mono font-medium text-slate-300 hover:text-white transition-all duration-300 border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 px-4 py-2 rounded-lg"
        >
          Sign In
        </button>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-32 pb-40 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400 font-medium">Verto v1.0 is Live</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tight mb-8">
          Proof of Work {'>'} <br /> Proof of Presence.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-light leading-relaxed">
          Stop pretending to study. Track active focus blocks, battle your friends in DSA sprints, and level up your developer profile. The ultimate accountability engine.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center space-x-2 bg-emerald-500 text-slate-950 px-8 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]"
          >
            <span>Start Focusing Now</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
          
          <a href="#features" className="text-sm font-mono text-slate-400 hover:text-white transition-colors duration-300">
            Explore Features ↓
          </a>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-24 relative z-10 border-t border-slate-800/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for deep work.</h2>
          <p className="text-slate-400 font-mono">Not just a timer. A complete gamified workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<Terminal className="w-6 h-6 text-emerald-400" />}
            title="Task-Based Nodes"
            description="Log time specifically for DSA, Web Dev, or System Design. See where your hours actually go."
          />
          <FeatureCard 
            icon={<Trophy className="w-6 h-6 text-emerald-400" />}
            title="Study Battles"
            description="Challenge classmates to 7-day focus sprints. The leaderboard never lies."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-emerald-400" />}
            title="Developer XP"
            description="Turn hours into levels. Build an unshakeable focus reputation among your peers."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-400" />}
            title="Anti-Cheat Architecture"
            description="Server-side timestamps and focus validation ensure all logged hours are genuine."
          />
        </div>
      </section>

      <section className="border-t border-slate-800/50 bg-slate-900/20 backdrop-blur-sm pt-24 pb-12 mt-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to drop the distractions?</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-slate-950 px-8 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors duration-300 mb-16"
          >
            Join Verto Free
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-slate-800/50 pt-8 text-sm text-slate-500 font-mono">
            <p>© 2026 Verto. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors duration-300">Twitter</a>
              <a href="#" className="hover:text-white transition-colors duration-300">GitHub</a>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4">
          
          <div 
            className="absolute inset-0 bg-[#000000a6] animate-fade-in" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="relative z-10 w-full max-w-[340px] bg-[#0c0c0c] border border-white/[0.08] rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-modal-pop">
            
            <div className="w-11 h-11 bg-gradient-to-b from-[#4ade80] to-[#16a34a] rounded-[14px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] mb-6"></div>
            
            <p className="text-white font-semibold text-[15px] mb-4 tracking-wide">
              Verto Tracker
            </p>
            
            <h2 className="text-[32px] font-semibold text-white leading-[1.15] tracking-tight mb-8">
              An efficient tool to <span className="text-[#34d399]">track</span> and manage your <span className="text-[#34d399]">focus sessions</span>
            </h2>
            
            {/* Swapped to GitHub Icon & Text */}
            <button 
              onClick={onLogin}
              className="flex items-center justify-center space-x-2.5 bg-[#1a1a1a] hover:bg-[#262626] border border-white/[0.08] transition-all duration-300 rounded-full px-5 py-2.5 group w-fit"
            >
              <svg className="w-[18px] h-[18px] text-white opacity-90 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-[#e2e8f0] text-[13px] font-medium tracking-wide">Continue with GitHub</span>
            </button>

          </div>

          <p className="relative z-10 text-[#64748b] text-[12px] mt-6 animate-modal-pop" style={{animationDelay: '100ms'}}>
            Verto v1.0.0 - by Yuvraj 2026
          </p>
        </div>
      )}

    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl hover:bg-slate-800/40 transition-colors duration-300 group">
    <div className="bg-slate-950 border border-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default Landing;