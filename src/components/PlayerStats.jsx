import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Zap, Terminal, Cpu, Hexagon, Crown, Info, ChevronsUp } from 'lucide-react';

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
  const [levelUpAlert, setLevelUpAlert] = useState(null);
  
  // Ref to track the user's previous badge to detect changes
  const prevBadgeRef = useRef(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!uid) return;

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

  // Determine current and next badge
  const currentBadgeIndex = [...BADGES].reverse().findIndex(b => totalXp >= b.threshold);
  const currentBadge = BADGES[BADGES.length - 1 - currentBadgeIndex];
  const nextBadge = BADGES[BADGES.length - currentBadgeIndex] || null;

  // 4. Feature: Level Up Dopamine Hit
  useEffect(() => {
    if (isInitialLoad.current) {
      if (totalXp > 0) {
        prevBadgeRef.current = currentBadge.name;
        isInitialLoad.current = false;
      }
      return;
    }

    if (prevBadgeRef.current && prevBadgeRef.current !== currentBadge.name) {
      const oldIdx = BADGES.findIndex(b => b.name === prevBadgeRef.current);
      const newIdx = BADGES.findIndex(b => b.name === currentBadge.name);
      
      if (newIdx > oldIdx) {
        setLevelUpAlert(currentBadge);
        setTimeout(() => setLevelUpAlert(null), 6000);
      }
    }
    prevBadgeRef.current = currentBadge.name;
  }, [currentBadge, totalXp]);

  let progress = 100;
  if (nextBadge) {
    const xpIntoCurrentTier = totalXp - currentBadge.threshold;
    const xpNeededForNextTier = nextBadge.threshold - currentBadge.threshold;
    progress = Math.min(100, Math.max(0, (xpIntoCurrentTier / xpNeededForNextTier) * 100));
  }

  const Icon = currentBadge.icon;

  return (
    <>
      {/* Level Up Full Screen Toast Overlay */}
      {levelUpAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className={`flex flex-col items-center bg-[#0f1117] border border-emerald-500/50 p-12 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.3)] transform scale-110 transition-transform duration-500`}>
            <ChevronsUp className="w-12 h-12 text-emerald-400 animate-bounce mb-4" />
            <h2 className="text-xl font-mono text-emerald-700 uppercase tracking-[0.3em] mb-2">System Upgrade</h2>
            <p className="text-4xl font-bold text-white mb-6">You are now a <span className={levelUpAlert.color}>{levelUpAlert.name}</span></p>
            <div className={`p-6 rounded-2xl bg-black/50 border ${levelUpAlert.border} shadow-[0_0_30px_rgba(inherit,0.3)]`}>
               <levelUpAlert.icon className={`w-16 h-16 ${levelUpAlert.color}`} />
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-50"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-widest mb-1">Lifetime XP</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-mono font-light text-white">{totalXp.toLocaleString()}</span>
              <span className="text-emerald-500 font-bold font-mono text-sm">XP</span>
            </div>
          </div>
          
          <button 
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            className="text-emerald-700 hover:text-amber-400 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {showInfo && (
          <div className="absolute top-16 right-6 bg-[#0f1117] border border-amber-500/30 p-5 rounded-xl shadow-2xl z-20 w-72 animate-fade-in">
            <h4 className="text-amber-400 font-bold text-sm mb-2 uppercase tracking-wider">XP Algorithm</h4>
            <p className="text-emerald-100/70 text-xs font-mono mb-4 border-b border-emerald-900/30 pb-4">
              Focus time is converted directly into experience points.
              <br />
              <span className="text-emerald-400 font-bold mt-2 inline-block px-2 py-1 bg-emerald-950/20 border border-emerald-900/30 rounded">
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
                  <span className="text-emerald-700">{badge.threshold.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`flex items-center space-x-4 p-4 rounded-xl bg-emerald-950/10 border ${currentBadge.border} mb-4`}>
          <div className={`p-3 rounded-lg bg-[#0f1117] border ${currentBadge.border} ${currentBadge.color} shadow-[0_0_15px_rgba(inherit,0.1)]`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-emerald-700 font-mono uppercase tracking-widest mb-1">Current Rank</div>
            <div className={`text-lg font-bold tracking-wider ${currentBadge.color}`}>
              {currentBadge.name}
            </div>
          </div>
        </div>

        {nextBadge ? (
          <div>
            <div className="flex justify-between text-[10px] font-mono font-bold text-emerald-700 mb-2 uppercase">
              <span>Progress to {nextBadge.name}</span>
              <span>{totalXp} / {nextBadge.threshold} XP</span>
            </div>
            <div className="w-full bg-[#0f1117] rounded-full h-2 border border-emerald-900/30 overflow-hidden">
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
    </>
  );
};

export default PlayerStats;