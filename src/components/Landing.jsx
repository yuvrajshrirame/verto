import React, { useState } from 'react';
import { Terminal, Trophy, Zap, Shield, ChevronRight } from 'lucide-react';

const Landing = ({ onLogin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      
      {/* Navigation */}
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

      {/* Hero Section */}
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

      {/* Features Grid */}
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

      {/* CTA & Footer */}
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

      {/* --- THE REFINED AUTH MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4">
          
          {/* Animated Dark Overlay */}
          <div 
            className="absolute inset-0 bg-[#000000a6] animate-fade-in" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Animated Modal Container */}
          <div className="relative z-10 w-full max-w-[340px] bg-[#0c0c0c] border border-white/[0.08] rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-modal-pop">
            
            {/* The Green App Icon (with inner highlight for depth) */}
            <div className="w-11 h-11 bg-gradient-to-b from-[#4ade80] to-[#16a34a] rounded-[14px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] mb-6"></div>
            
            <p className="text-white font-semibold text-[15px] mb-4 tracking-wide">
              Verto Tracker
            </p>
            
            {/* Perfected Typography */}
            <h2 className="text-[32px] font-semibold text-white leading-[1.15] tracking-tight mb-8">
              An efficient tool to <span className="text-[#34d399]">track</span> and manage your <span className="text-[#34d399]">focus sessions</span>
            </h2>
            
            {/* Minimalist Google Auth Button */}
            <button 
              onClick={onLogin}
              className="flex items-center justify-center space-x-2.5 bg-[#1a1a1a] hover:bg-[#262626] border border-white/[0.08] transition-all duration-300 rounded-full px-5 py-2.5 group w-fit"
            >
              <svg className="w-[18px] h-[18px] text-white opacity-90 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-[#e2e8f0] text-[13px] font-medium tracking-wide">Continue with Google</span>
            </button>

          </div>

          {/* Centered Footer below modal */}
          <p className="relative z-10 text-[#64748b] text-[12px] mt-6 animate-modal-pop" style={{animationDelay: '100ms'}}>
            Verto v1.0.0 - by Yuvraj 2026
          </p>
        </div>
      )}

    </div>
  );
};

// Sub-component
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