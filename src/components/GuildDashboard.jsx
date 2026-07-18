import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Crosshair, LogIn, Trophy, Activity, ShieldAlert, Key } from 'lucide-react';

const GuildDashboard = ({ user }) => {
  const [userGuilds, setUserGuilds] = useState([]);
  const [activeGuild, setActiveGuild] = useState(null);
  
  const [joinCode, setJoinCode] = useState('');
  const [newGuildName, setNewGuildName] = useState('');
  
  const [guildStats, setGuildStats] = useState({ leaderboard: [], categories: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch Guilds the user belongs to
  useEffect(() => {
    const q = query(collection(db, "guilds"), where("members", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const guilds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserGuilds(guilds);
      
      // Auto-select first guild if none active
      if (guilds.length > 0 && !activeGuild) {
        setActiveGuild(guilds[0]);
      } else if (guilds.length === 0) {
        setActiveGuild(null);
      }
    });
    return () => unsubscribe();
  }, [user.uid]);

  // 2. Fetch Stats for the Active Guild
  useEffect(() => {
    if (!activeGuild) return;

    const fetchGuildData = async () => {
      setIsLoading(true);
      try {
        // Fetch users in guild (Limit 10 per Firestore rules for 'in' queries)
        const membersToFetch = activeGuild.members.slice(0, 10); 
        
        const sessionsQuery = query(
          collection(db, "sessions"), 
          where("uid", "in", membersToFetch)
        );
        
        const snapshot = await getDocs(sessionsQuery);
        
        const usersMap = {};
        const catMap = {};

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const uid = data.uid;
          const name = data.userName || "Operator";
          
          // Leaderboard Aggregation
          if (!usersMap[uid]) {
            usersMap[uid] = { uid, name, photo: data.userPhoto, totalXp: 0 };
          }
          usersMap[uid].totalXp += (data.xp || 0);

          // Category Aggregation
          if (!catMap[uid]) catMap[uid] = { name, tasks: {} };
          if (!catMap[uid].tasks[data.task]) catMap[uid].tasks[data.task] = 0;
          catMap[uid].tasks[data.task] += data.duration;
        });

        const sortedLeaderboard = Object.values(usersMap).sort((a, b) => b.totalXp - a.totalXp);
        setGuildStats({ leaderboard: sortedLeaderboard, categories: catMap });

      } catch (err) {
        console.error("Failed to aggregate network:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuildData();
  }, [activeGuild]);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    if (!newGuildName.trim()) return;
    setError('');
    
    const code = generateCode();
    try {
      await setDoc(doc(db, 'guilds', code), {
        name: newGuildName.trim(),
        admin: user.uid,
        members: [user.uid],
        createdAt: new Date()
      });
      setNewGuildName('');
    } catch (err) {
      setError('Failed to establish Guild protocol.');
    }
  };

  const handleJoinGuild = async (e) => {
    e.preventDefault();
    if (joinCode.length !== 6) return;
    setError('');

    try {
      const guildRef = doc(db, 'guilds', joinCode.toUpperCase());
      const guildSnap = await getDoc(guildRef);

      if (guildSnap.exists()) {
        const data = guildSnap.data();
        if (data.members.length >= 10) {
          setError('Guild is at maximum capacity (10 Operators).');
          return;
        }
        await updateDoc(guildRef, { members: arrayUnion(user.uid) });
        setJoinCode('');
      } else {
        setError('Invalid Guild Access Code.');
      }
    } catch (err) {
      setError('Neural link to Guild failed.');
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Network Hub Selection */}
        <div className="flex-1 bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
            <Users className="text-emerald-400 w-5 h-5" />
            <h2 className="text-lg font-bold text-white uppercase tracking-widest">Active Networks</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {userGuilds.length === 0 ? (
              <p className="text-emerald-700 font-mono text-xs w-full">No active networks. Join or establish a Guild below.</p>
            ) : (
              userGuilds.map(g => (
                <button 
                  key={g.id}
                  onClick={() => setActiveGuild(g)}
                  className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all border ${
                    activeGuild?.id === g.id 
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-[#030712]/50 border-emerald-900/50 text-emerald-700 hover:text-emerald-400 hover:border-emerald-500/50'
                  }`}
                >
                  {g.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Join / Create Forms */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4 bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex-1">
             <h3 className="text-emerald-700 font-mono text-[10px] uppercase tracking-widest mb-3">Join Network</h3>
             <form onSubmit={handleJoinGuild} className="flex flex-col gap-2">
                <input type="text" maxLength="6" placeholder="6-CHAR CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="bg-[#030712]/50 text-emerald-400 font-mono text-sm border border-emerald-900/50 rounded px-3 py-2 outline-none focus:border-emerald-500 uppercase tracking-widest text-center" />
                <button type="submit" disabled={joinCode.length !== 6} className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 py-2 rounded hover:bg-emerald-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><LogIn className="w-3 h-3"/> JOIN</button>
             </form>
          </div>
          <div className="hidden sm:block w-px bg-emerald-900/30 mx-2"></div>
          <div className="flex-1">
             <h3 className="text-emerald-700 font-mono text-[10px] uppercase tracking-widest mb-3">Establish Guild</h3>
             <form onSubmit={handleCreateGuild} className="flex flex-col gap-2">
                <input type="text" placeholder="GUILD NAME" value={newGuildName} onChange={(e) => setNewGuildName(e.target.value)} className="bg-[#030712]/50 text-emerald-400 font-mono text-sm border border-emerald-900/50 rounded px-3 py-2 outline-none focus:border-emerald-500" />
                <button type="submit" disabled={!newGuildName.trim()} className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 py-2 rounded hover:bg-emerald-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><Crosshair className="w-3 h-3"/> CREATE</button>
             </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4" /> {error}
        </div>
      )}

      {/* GUILD DATA VIEW */}
      {activeGuild && (
        <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-emerald-400 blur-sm opacity-50"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-emerald-900/30">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase text-center sm:text-left mb-4 sm:mb-0">
              {activeGuild.name}
            </h1>
            <div className="bg-[#030712]/80 border border-emerald-500/30 px-4 py-2 rounded-lg flex items-center space-x-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Key className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[9px] text-emerald-700 font-mono tracking-widest uppercase">Invite Code</span>
                <span className="text-emerald-400 font-mono font-bold tracking-[0.2em]">{activeGuild.id}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-emerald-500 font-mono animate-pulse">AGGREGATING NETWORK TELEMETRY...</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-10">
              
              {/* Leaderboard Column */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-6">
                  <Trophy className="text-amber-400 w-5 h-5" />
                  <h3 className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">Guild Leaderboard</h3>
                </div>
                <div className="space-y-3">
                  {guildStats.leaderboard.length === 0 ? (
                    <p className="text-emerald-700 font-mono text-xs">No telemetry recorded yet.</p>
                  ) : (
                    guildStats.leaderboard.map((member, idx) => (
                      <div key={member.uid} className={`flex items-center justify-between p-4 rounded-xl border ${member.uid === user.uid ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-[#090a0f]/80 border-emerald-900/20'}`}>
                        <div className="flex items-center space-x-4">
                          <span className={`font-mono font-bold w-6 text-center text-lg ${idx === 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-emerald-700 text-sm'}`}>#{idx + 1}</span>
                          <img src={member.photo || "https://via.placeholder.com/40"} alt="avatar" className="w-10 h-10 rounded-full border border-emerald-900/50" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-emerald-100">{member.uid === user.uid && user.displayName ? user.displayName.split(" ")[0] : member.name}</span>
                            {member.uid === activeGuild.admin && <span className="text-[9px] text-amber-500 font-mono uppercase tracking-widest">Admin</span>}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-lg tracking-wider">{member.totalXp} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category Breakdown Column */}
              <div className="flex-1 border-t md:border-t-0 md:border-l border-emerald-900/30 pt-8 md:pt-0 md:pl-10">
                <div className="flex items-center space-x-2 mb-6">
                  <Activity className="text-emerald-400 w-5 h-5" />
                  <h3 className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">Network Diagnostics</h3>
                </div>
                
                <div className="space-y-6">
                  {Object.keys(guildStats.categories).length === 0 ? (
                    <p className="text-emerald-700 font-mono text-xs">No category data available.</p>
                  ) : (
                    Object.entries(guildStats.categories).map(([uid, data]) => (
                      <div key={uid} className="bg-[#030712]/50 border border-emerald-900/30 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-100 mb-3 flex items-center gap-2">
                          {uid === user.uid && user.displayName ? user.displayName.split(" ")[0] : data.name} 
                          {uid === user.uid && <span className="text-[9px] text-emerald-500 font-mono border border-emerald-500/30 px-1.5 rounded">YOU</span>}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(data.tasks)
                            .sort((a, b) => b[1] - a[1]) // Sort by duration highest first
                            .map(([task, duration]) => (
                            <div key={task} className="flex justify-between items-center text-xs">
                              <span className="text-emerald-700 font-mono uppercase">_{task}</span>
                              <span className="text-emerald-400 font-mono">{formatTime(duration)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuildDashboard;