import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateLevel } from '../utils/leveling';
import { Trophy } from 'lucide-react';

const PlayerStats = ({ uid }) => {
  const [stats, setStats] = useState({ level: 1, progress: 0 });
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    const fetchXp = async () => {
      if (!uid) return;
      const q = query(collection(db, "sessions"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      let xp = 0;
      querySnapshot.forEach((doc) => {
        xp += doc.data().xp || 0;
      });
      setTotalXp(xp);
      setStats(calculateLevel(xp));
    };
    fetchXp();
  }, [uid]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Level {stats.level}</h3>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">{totalXp} Total XP</p>
          </div>
        </div>
        <span className="text-emerald-400 text-sm font-mono">{Math.round(stats.progress)}% to next level</span>
      </div>
      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
        <div 
          className="bg-emerald-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
          style={{ width: `${stats.progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PlayerStats;