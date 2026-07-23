import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Crosshair, LogIn, Trophy, Activity, ShieldAlert, Key, Edit3, Trash2, Check, LogOut, UserX } from 'lucide-react';

const GroupDashboard = ({ user }) => {
  const [userGroups, setUserGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  // Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');

  const [groupStats, setGroupStats] = useState({ leaderboard: [], categories: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // USING "guilds" COLLECTION FOR FIREBASE RULES
  useEffect(() => {
    const q = query(collection(db, "guilds"), where("members", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserGroups(groups);
      
      if (groups.length > 0) {
        if (!activeGroup) {
          setActiveGroup(groups[0]);
        } else {
          const updatedActive = groups.find(g => g.id === activeGroup.id);
          setActiveGroup(updatedActive || null);
        }
      } else {
        setActiveGroup(null);
      }
    });
    return () => unsubscribe();
  }, [user.uid, activeGroup?.id]);

  useEffect(() => {
    if (!activeGroup) return;

    const fetchGroupData = async () => {
      setIsLoading(true);
      try {
        const membersToFetch = activeGroup.members.slice(0, 10); 
        const sessionsQuery = query(collection(db, "sessions"), where("uid", "in", membersToFetch));
        const snapshot = await getDocs(sessionsQuery);
        
        const usersMap = {};
        const catMap = {};

        activeGroup.members.forEach(memberUid => {
            usersMap[memberUid] = { uid: memberUid, name: "Unknown Operator", photo: "https://via.placeholder.com/40", totalXp: 0 };
        });

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const uid = data.uid;
          const name = data.userName || "Operator";
          
          if (usersMap[uid]) {
            usersMap[uid].name = name;
            usersMap[uid].photo = data.userPhoto || usersMap[uid].photo;
            usersMap[uid].totalXp += (data.xp || 0);
          }

          if (!catMap[uid]) catMap[uid] = { name, tasks: {} };
          if (!catMap[uid].tasks[data.task]) catMap[uid].tasks[data.task] = 0;
          catMap[uid].tasks[data.task] += data.duration;
        });

        const sortedLeaderboard = Object.values(usersMap).sort((a, b) => b.totalXp - a.totalXp);
        setGroupStats({ leaderboard: sortedLeaderboard, categories: catMap });

      } catch (err) {
        console.error("Failed to aggregate network:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [activeGroup]);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setError('');
    
    const code = generateCode();
    try {
      await setDoc(doc(db, 'guilds', code), {
        name: newGroupName.trim(),
        admin: user.uid,
        members: [user.uid],
        createdAt: new Date()
      });
      setNewGroupName('');
    } catch (err) {
      setError('Failed to establish Group protocol. Check DB Permissions.');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (joinCode.length !== 6) return;
    setError('');

    try {
      const groupRef = doc(db, 'guilds', joinCode.toUpperCase());
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const data = groupSnap.data();
        if (data.members.length >= 10) {
          setError('Group is at maximum capacity (10 Operators).');
          return;
        }
        await updateDoc(groupRef, { members: arrayUnion(user.uid) });
        setJoinCode('');
      } else {
        setError('Invalid Group Access Code.');
      }
    } catch (err) {
      setError('Neural link to Group failed.');
    }
  };

  const handleUpdateGroupName = async () => {
    if (!editGroupName.trim() || !activeGroup) return;
    try {
      await updateDoc(doc(db, 'guilds', activeGroup.id), { name: editGroupName.trim() });
      setIsEditingName(false);
    } catch (err) {
      setError('Failed to update group name.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup) return;
    const confirmed = window.confirm("WARNING: Purge this entire Group? This is irreversible.");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'guilds', activeGroup.id));
      setActiveGroup(null);
    } catch (err) {
      setError('Failed to delete group.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeGroup) return;
    const confirmed = window.confirm("Are you sure you want to disconnect from this Group?");
    if (!confirmed) return;
    try {
      await updateDoc(doc(db, 'guilds', activeGroup.id), { members: arrayRemove(user.uid) });
      setActiveGroup(null);
    } catch (err) {
      setError('Failed to leave group.');
    }
  };

  const handleKickMember = async (memberUid) => {
    if (!activeGroup) return;
    const confirmed = window.confirm("Eject this Operator from the network?");
    if (!confirmed) return;
    try {
      await updateDoc(doc(db, 'guilds', activeGroup.id), { members: arrayRemove(memberUid) });
    } catch (err) {
      setError('Failed to kick member.');
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
      
      {/* HEADER ROW - METALLIC UPGRADE */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          
          <div className="flex items-center space-x-3 mb-6 border-b border-emerald-900/30 pb-4 relative z-10">
            <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
               <Users className="text-emerald-400 w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-widest drop-shadow-md">Active Networks</h2>
          </div>
          
          <div className="flex flex-wrap gap-3 relative z-10">
            {userGroups.length === 0 ? (
              <p className="text-emerald-700 font-mono text-xs w-full">No active networks. Join or establish a Group below.</p>
            ) : (
              userGroups.map(g => (
                <button 
                  key={g.id}
                  onClick={() => { setActiveGroup(g); setIsEditingName(false); }}
                  className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all border backdrop-blur-md ${
                    activeGroup?.id === g.id 
                      ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border-emerald-400 border-t-emerald-300 text-emerald-300 shadow-[0_4px_15px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] scale-105'
                      : 'bg-[#090a0f]/60 border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 text-emerald-600 hover:text-emerald-400 hover:border-emerald-400/50 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)]'
                  }`}
                >
                  {g.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-4 bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          
          <div className="flex-1 relative z-10">
             <h3 className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest mb-3 drop-shadow-sm">Join Network</h3>
             <form onSubmit={handleJoinGroup} className="flex flex-col gap-3">
                <input type="text" maxLength="6" placeholder="6-CHAR CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="bg-[#030712]/80 text-emerald-300 font-mono text-sm border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 uppercase tracking-widest text-center placeholder-emerald-900/60 transition-all" />
                <button type="submit" disabled={joinCode.length !== 6} className="bg-[#090a0f]/60 backdrop-blur-md text-emerald-400 border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] py-2.5 rounded-xl hover:border-emerald-500/60 hover:text-emerald-300 text-xs font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"><LogIn className="w-3 h-3"/> JOIN</button>
             </form>
          </div>
          <div className="hidden sm:block w-px bg-emerald-900/30 mx-2 relative z-10"></div>
          <div className="flex-1 relative z-10">
             <h3 className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest mb-3 drop-shadow-sm">Establish Group</h3>
             <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
                <input type="text" placeholder="GROUP NAME" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="bg-[#030712]/80 text-emerald-300 font-mono text-sm border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-4 py-3 outline-none focus:border-emerald-500 placeholder-emerald-900/60 transition-all" />
                <button type="submit" disabled={!newGroupName.trim()} className="bg-[#090a0f]/60 backdrop-blur-md text-emerald-400 border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] py-2.5 rounded-xl hover:border-emerald-500/60 hover:text-emerald-300 text-xs font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"><Crosshair className="w-3 h-3"/> CREATE</button>
             </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/40 border-t-red-400/40 text-red-400 px-4 py-3 rounded-xl text-xs font-mono flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(239,68,68,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <ShieldAlert className="w-4 h-4" /> {error}
        </div>
      )}

      {/* GROUP DATA VIEW - METALLIC UPGRADE */}
      {activeGroup && (
        <div className="bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-emerald-500 blur-xl opacity-20" />
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-emerald-900/40 gap-4 sm:gap-0 relative z-10">
            
            <div className="flex items-center gap-4">
                {isEditingName ? (
                    <div className="flex items-center gap-3">
                        <input 
                            type="text" 
                            value={editGroupName} 
                            onChange={(e) => setEditGroupName(e.target.value)}
                            className="bg-[#030712]/80 text-emerald-300 font-bold text-2xl tracking-widest uppercase border border-emerald-500/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-4 py-2 outline-none"
                            autoFocus
                        />
                        <button onClick={handleUpdateGroupName} className="p-2.5 bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 rounded-xl hover:bg-emerald-500/40 transition-colors shadow-[0_2px_10px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer">
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase text-center sm:text-left mb-0 drop-shadow-lg">
                        {activeGroup.name}
                    </h1>
                )}
                
                {!isEditingName && activeGroup.admin === user.uid && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setEditGroupName(activeGroup.name); setIsEditingName(true); }} className="p-2 bg-[#090a0f]/60 border border-emerald-900/50 rounded-xl text-emerald-600 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer" title="Edit Name">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={handleDeleteGroup} className="p-2 bg-[#090a0f]/60 border border-red-900/30 rounded-xl text-red-900/70 hover:text-red-500 hover:border-red-500/50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer" title="Delete Group">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!isEditingName && activeGroup.admin !== user.uid && (
                    <button onClick={handleLeaveGroup} className="p-2 bg-[#090a0f]/60 border border-red-900/30 rounded-xl text-red-900/70 hover:text-red-500 hover:border-red-500/50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] ml-2 cursor-pointer" title="Leave Group">
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="bg-[#090a0f]/60 backdrop-blur-md border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 px-5 py-2.5 rounded-xl flex items-center space-x-3 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                <Key className="w-3 h-3 text-emerald-500 drop-shadow-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-emerald-600 font-mono tracking-widest uppercase">Invite Code</span>
                <span className="text-emerald-300 font-mono font-bold tracking-[0.2em]">{activeGroup.id}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-emerald-600 font-mono animate-pulse tracking-widest relative z-10">AGGREGATING NETWORK TELEMETRY...</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-10 relative z-10">
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-[#030712]/50 rounded border border-amber-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                           <Trophy className="text-amber-400 w-4 h-4 drop-shadow-md" />
                        </div>
                        <h3 className="text-emerald-300 font-mono text-xs font-bold tracking-widest uppercase drop-shadow-sm">Group Leaderboard</h3>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-mono uppercase bg-[#030712]/50 px-2 py-1 rounded-md border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]">{activeGroup.members.length}/10 Operators</span>
                </div>
                <div className="space-y-3">
                  {groupStats.leaderboard.length === 0 ? (
                    <p className="text-emerald-700 font-mono text-xs">No telemetry recorded yet.</p>
                  ) : (
                    groupStats.leaderboard.map((member, idx) => (
                      <div key={member.uid} className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm ${member.uid === user.uid ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'bg-[#090a0f]/60 border-emerald-900/30 shadow-[0_2px_8px_rgba(0,0,0,0.2)]'}`}>
                        <div className="flex items-center space-x-4">
                          <span className={`font-mono font-bold w-6 text-center text-lg ${idx === 0 && member.totalXp > 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]' : idx === 1 && member.totalXp > 0 ? 'text-slate-300 drop-shadow-sm' : idx === 2 && member.totalXp > 0 ? 'text-amber-700 drop-shadow-sm' : 'text-emerald-800 text-sm'}`}>#{idx + 1}</span>
                          <img src={member.photo} alt="avatar" className="w-10 h-10 rounded-full border border-emerald-900/50 object-cover shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-emerald-100 truncate max-w-[120px] sm:max-w-[150px] drop-shadow-sm">
                                {member.uid === user.uid && user.displayName ? user.displayName.split(" ")[0] : member.name}
                            </span>
                            {member.uid === activeGroup.admin && <span className="text-[9px] text-amber-500/80 font-mono uppercase tracking-widest mt-0.5">Admin</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-emerald-300 text-lg tracking-wider drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">{member.totalXp} XP</span>
                            
                            {activeGroup.admin === user.uid && member.uid !== user.uid && (
                                <button 
                                    onClick={() => handleKickMember(member.uid)} 
                                    className="p-1.5 bg-[#030712]/50 rounded-lg border border-red-900/30 text-red-900/50 hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]"
                                    title="Eject Operator"
                                >
                                    <UserX className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 border-t md:border-t-0 md:border-l border-emerald-900/30 pt-8 md:pt-0 md:pl-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                    <Activity className="text-emerald-400 w-4 h-4 drop-shadow-md" />
                  </div>
                  <h3 className="text-emerald-300 font-mono text-xs font-bold tracking-widest uppercase drop-shadow-sm">Network Diagnostics</h3>
                </div>
                
                <div className="space-y-4">
                  {Object.keys(groupStats.categories).length === 0 ? (
                    <p className="text-emerald-700 font-mono text-xs">No category data available.</p>
                  ) : (
                    Object.entries(groupStats.categories).map(([uid, data]) => (
                      <div key={uid} className="bg-[#090a0f]/60 backdrop-blur-md border border-emerald-900/40 border-t-emerald-500/10 border-l-emerald-500/10 rounded-2xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <h4 className="text-xs font-bold text-emerald-100 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2 drop-shadow-sm">
                          {uid === user.uid && user.displayName ? user.displayName.split(" ")[0] : data.name} 
                          {uid === user.uid && <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">YOU</span>}
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(data.tasks)
                            .sort((a, b) => b[1] - a[1])
                            .map(([task, duration]) => (
                            <div key={task} className="flex justify-between items-center text-xs bg-[#030712]/40 p-2 rounded-lg border border-emerald-900/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                              <span className="text-slate-400 font-mono uppercase tracking-wider">_{task}</span>
                              <span className="text-emerald-400 font-mono font-bold drop-shadow-sm">{formatTime(duration)}</span>
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

export default GroupDashboard;