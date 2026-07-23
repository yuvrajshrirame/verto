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
  const [levelUpAlert, setLevelUpAlert] = useState(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const infoContainerRef = useRef(null);
  
  const prevBadgeRef = useRef(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoContainerRef.current && !infoContainerRef.current.contains(event.target)) {
        setIsClicked(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "sessions"), where("uid", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let xpSum = 0;
      snapshot.forEach((doc) => { xpSum += doc.data().xp || 0; });
      setTotalXp(xpSum);
    });
    return () => unsubscribe();
  }, [uid]);

  const currentBadgeIndex = [...BADGES].reverse().findIndex(b => totalXp >= b.threshold);
  const currentBadge = BADGES[BADGES.length - 1 - currentBadgeIndex];
  const nextBadge = BADGES[BADGES.length - currentBadgeIndex] || null;

  useEffect(() => {
    if (isInitialLoad.current) {
      if (totalXp > 0) { prevBadgeRef.current = currentBadge.name; isInitialLoad.current = false; }
      return;
    }
    if (prevBadgeRef.current && prevBadgeRef.current !== currentBadge.name) {
      const oldIdx = BADGES.findIndex(b => b.name === prevBadgeRef.current);
      const newIdx = BADGES.findIndex(b => b.name === currentBadge.name);
      if (newIdx > oldIdx) { setLevelUpAlert(currentBadge); setTimeout(() => setLevelUpAlert(null), 6000); }
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
  const showInfo = isHovered || isClicked;

  return (
    <>
      {levelUpAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className="flex flex-col items-center bg-[#090a0f]/90 backdrop-blur-2xl border border-emerald-500/50 border-t-emerald-400/40 p-12 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)] transform scale-110 transition-transform duration-500">
            <ChevronsUp className="w-12 h-12 text-emerald-400 animate-bounce mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <h2 className="text-xl font-mono text-emerald-500 uppercase tracking-[0.3em] mb-2 drop-shadow-md">System Upgrade</h2>
            <p className="text-4xl font-bold text-white mb-6 drop-shadow-lg">You are now a <span className={`${levelUpAlert.color} drop-shadow-md`}>{levelUpAlert.name}</span></p>
            <div className={`p-6 rounded-2xl bg-[#030712]/80 border ${levelUpAlert.border} shadow-[0_0_30px_rgba(inherit,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]`}>
               <levelUpAlert.icon className={`w-16 h-16 ${levelUpAlert.color} drop-shadow-md`} />
            </div>
          </div>
        </div>
      )}

      {/* METALLIC GLASS UPGRADE */}
      <div className="bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] relative shrink-0 z-50 overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-30 pointer-events-none z-0"></div>

        <div className="flex justify-between items-start mb-5 relative z-50">
          <div>
            <h2 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 drop-shadow-sm">Lifetime XP</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-light text-white drop-shadow-md">{totalXp.toLocaleString()}</span>
              <span className="text-emerald-400 font-bold font-mono text-xs drop-shadow-sm">XP</span>
            </div>
          </div>
          
          <div className="relative" ref={infoContainerRef}>
            <button 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setIsClicked(!isClicked)}
              className={`transition-all cursor-pointer p-1.5 rounded-lg border relative z-50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
                showInfo 
                  ? 'text-amber-400 bg-amber-500/20 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105' 
                  : 'text-emerald-600 border-emerald-900/50 bg-[#090a0f]/60 hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>

            {showInfo && (
              <div className="absolute top-full mt-3 right-0 bg-gradient-to-br from-[#1a1d24]/95 to-[#050608]/95 backdrop-blur-3xl border border-amber-500/40 border-t-amber-400/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)] z-[100] w-64 animate-fade-in pointer-events-auto">
                <h4 className="text-amber-400 font-bold text-[10px] mb-2 uppercase tracking-wider drop-shadow-sm">XP Algorithm</h4>
                <p className="text-emerald-100/80 text-[10px] font-mono mb-4 border-b border-emerald-900/40 pb-3">
                  1 MINUTE = 10 XP
                </p>
                <div className="space-y-2">
                  {BADGES.map((badge, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-mono bg-[#030712]/40 p-1.5 rounded shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center space-x-2">
                        <badge.icon className={`w-3.5 h-3.5 ${badge.color} drop-shadow-sm`} />
                        <span className={`${badge.color} font-bold tracking-wider`}>{badge.name}</span>
                      </div>
                      <span className="text-emerald-500">{badge.threshold.toLocaleString()} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`flex items-center space-x-4 p-3 rounded-2xl bg-[#090a0f]/60 backdrop-blur-md border ${currentBadge.border} border-t-emerald-500/10 border-l-emerald-500/10 shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] mb-5 relative z-10`}>
          <div className={`p-2.5 rounded-xl bg-[#030712]/80 border ${currentBadge.border} ${currentBadge.color} shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]`}>
            <Icon className="w-6 h-6 drop-shadow-md" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-emerald-600 font-mono uppercase tracking-widest mb-0.5">Current Rank</div>
            <div className={`text-base font-bold tracking-widest drop-shadow-md ${currentBadge.color}`}>{currentBadge.name}</div>
          </div>
        </div>

        {nextBadge ? (
          <div className="relative z-10 bg-[#030712]/40 p-3 rounded-xl border border-emerald-900/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between text-[9px] font-mono font-bold text-emerald-500 mb-2 uppercase tracking-widest">
              <span>Progress to {nextBadge.name}</span>
              <span className="text-emerald-300">{totalXp} / {nextBadge.threshold} XP</span>
            </div>
            <div className="w-full bg-[#030712] rounded-full h-1.5 border border-emerald-900/50 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-amber-400 text-[10px] font-mono font-bold bg-amber-500/10 py-2.5 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-10 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 drop-shadow-md" /><span>MAXIMUM RANK</span>
          </div>
        )}
      </div>
    </>
  );
};

export default PlayerStats;