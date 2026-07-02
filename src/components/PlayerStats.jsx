import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Zap, Terminal, Cpu, Hexagon, Crown, Info } from 'lucide-react';

// The Badge Progression System (Simple & Cool)
const BADGES = [
  { name: "GHOST", threshold: 0, icon: Shield, color: "text-slate-400", border: "border-slate-800" },
  { name: "RUNNER", threshold: 1000, icon: Terminal, color: "text-emerald-400", border: "border-emerald-500/30" }, 
  { name: "HACKER", threshold: 5000, icon: Cpu, color: "text-blue-400", border: "border-blue-500/30" }, 
  { name: "ADMIN", threshold: 15000, icon: Hexagon, color: "text-purple-400", border: "border-purple-500/30" }, 
  { name: "PRIME", threshold: 50000, icon: Crown, color: "text-amber-400", border: "border-amber-500/50" } 
];

const PlayerStats = ({ uid }) => {
  const [totalXp, setTotalXp] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!uid) return;

    // Real-time listener for ALL user sessions to calculate lifetime XP
    const q = query(collection(db, "sessions"), where("uid", "==", uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let xpSum = 0;
      snapshot.forEach((doc) => {
        xpSum += doc.data().xp || 0;
      });
      setTotalXp(xpSum);
    });

    return () => unsubscribe();
  }, [uid]);

  // Determine current badge and next badge
  const currentBadgeIndex = [...BADGES].reverse().findIndex(b => totalXp >= b.threshold);
  const currentBadge = BADGES[BADGES.length - 1 - currentBadgeIndex];
  const nextBadge = BADGES[BADGES.length - currentBadgeIndex] || null;

  // Calculate progress percentage
  let progress = 100;
  if (nextBadge) {
    const xpIntoCurrentTier = totalXp - currentBadge.threshold;
    const xpNeededForNextTier = nextBadge.threshold - currentBadge.threshold;
    progress = Math.min(100, Math.max(0, (xpIntoCurrentTier / xpNeededForNextTier) * 100));
  }

  const Icon = currentBadge.icon;

  return (
    <div className="bg-[#0c0c0c] border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Lifetime XP</h2>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-mono font-light text-white">{totalXp.toLocaleString()}</span>
            <span className="text-emerald-500 font-bold font-mono text-sm">XP</span>
          </div>
        </div>
        
        {/* How it Works Toggle */}
        <button 
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
          className="text-slate-600 hover:text-amber-400 transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Info Tooltip (Expanded with Rank List) */}
      {showInfo && (
        <div className="absolute top-16 right-6 bg-slate-900 border border-amber-500/30 p-5 rounded-xl shadow-2xl z-20 w-72 animate-fade-in">
          <h4 className="text-amber-400 font-bold text-sm mb-2 uppercase tracking-wider">XP Algorithm</h4>
          <p className="text-slate-300 text-xs font-mono mb-4 border-b border-slate-800 pb-4">
            Focus time is converted directly into experience points.
            <br />
            <span className="text-emerald-400 font-bold mt-2 inline-block px-2 py-1 bg-black/50 border border-slate-800 rounded">
              1 MINUTE = 10 XP
            </span>
          </p>
          
          <h4 className="text-amber-400 font-bold text-sm mb-3 uppercase tracking-wider">Rank Tiers</h4>
          <div className="space-y-2">
            {BADGES.map((badge, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <badge.icon className={`w-3 h-3 ${badge.color}`} />
                  <span className={`${badge.color} font-bold`}>{badge.name}</span>
                </div>
                <span className="text-slate-500">{badge.threshold.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge Display Area */}
      <div className={`flex items-center space-x-4 p-4 rounded-xl bg-black/40 border ${currentBadge.border} mb-4`}>
        <div className={`p-3 rounded-lg bg-slate-950 border ${currentBadge.border} ${currentBadge.color} shadow-[0_0_15px_rgba(inherit,0.2)]`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Current Rank</div>
          <div className={`text-lg font-bold tracking-wider ${currentBadge.color}`}>
            {currentBadge.name}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {nextBadge ? (
        <div>
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase">
            <span>Progress to {nextBadge.name}</span>
            <span>{totalXp} / {nextBadge.threshold} XP</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2 text-amber-400 text-xs font-mono font-bold bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
          <Zap className="w-4 h-4" />
          <span>MAXIMUM RANK ACHIEVED</span>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;