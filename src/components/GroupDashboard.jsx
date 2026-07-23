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

  // 1. Fetch Groups the user belongs to (USING "guilds" COLLECTION FOR FIREBASE RULES)
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

  // 2. Fetch Stats for the Active Group
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

  // --- CRUD & MODERATION LOGIC (USING "guilds" FOR DB INTEGRITY) ---

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
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
            <Users className="text-emerald-400 w-5 h-5" />
            <h2 className="text-lg font-bold text-white uppercase tracking-widest">Active Networks</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {userGroups.length === 0 ? (
              <p className="text-emerald-700 font-mono text-xs w-full">No active networks. Join or establish a Group below.</p>
            ) : (
              userGroups.map(g => (
                <button 
                  key={g.id}
                  onClick={() => { setActiveGroup(g); setIsEditingName(false); }}
                  className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all border ${
                    activeGroup?.id === g.id 
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

        <div className="flex-1 flex flex-col sm:flex-row gap-4 bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex-1">
             <h3 className="text-emerald-700 font-mono text-[10px] uppercase tracking-widest mb-3">Join Network</h3>
             <form onSubmit={handleJoinGroup} className="flex flex-col gap-2">
                <input type="text" maxLength="6" placeholder="6-CHAR CODE" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="bg-[#030712]/50 text-emerald-400 font-mono text-sm border border-emerald-900/50 rounded px-3 py-2 outline-none focus:border-emerald-500 uppercase tracking-widest text-center" />
                <button type="submit" disabled={joinCode.length !== 6} className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 py-2 rounded hover:bg-emerald-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><LogIn className="w-3 h-3"/> JOIN</button>
             </form>
          </div>
          <div className="hidden sm:block w-px bg-emerald-900/30 mx-2"></div>
          <div className="flex-1">
             <h3 className="text-emerald-700 font-mono text-[10px] uppercase tracking-widest mb-3">Establish Group</h3>
             <form onSubmit={handleCreateGroup} className="flex flex-col gap-2">
                <input type="text" placeholder="GROUP NAME" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="bg-[#030712]/50 text-emerald-400 font-mono text-sm border border-emerald-900/50 rounded px-3 py-2 outline-none focus:border-emerald-500" />
                <button type="submit" disabled={!newGroupName.trim()} className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 py-2 rounded hover:bg-emerald-900/50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><Crosshair className="w-3 h-3"/> CREATE</button>
             </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4" /> {error}
        </div>
      )}

      {/* GROUP DATA VIEW */}
      {activeGroup && (
        <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-emerald-400 blur-sm opacity-50"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-emerald-900/30 gap-4 sm:gap-0">
            
            <div className="flex items-center gap-4">
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={editGroupName} 
                            onChange={(e) => setEditGroupName(e.target.value)}
                            className="bg-[#030712]/50 text-white font-bold text-2xl tracking-widest uppercase border border-emerald-500/50 rounded px-3 py-1 outline-none"
                            autoFocus
                        />
                        <button onClick={handleUpdateGroupName} className="p-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/40 transition-colors">
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase text-center sm:text-left mb-0">
                        {activeGroup.name}
                    </h1>
                )}
                
                {!isEditingName && activeGroup.admin === user.uid && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setEditGroupName(activeGroup.name); setIsEditingName(true); }} className="p-1.5 text-emerald-700 hover:text-emerald-400 transition-colors" title="Edit Name">
                            <Edit3 className="w-5 h-5" />
                        </button>
                        <button onClick={handleDeleteGroup} className="p-1.5 text-red-900/70 hover:text-red-500 transition-colors" title="Delete Group">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {!isEditingName && activeGroup.admin !== user.uid && (
                    <button onClick={handleLeaveGroup} className="p-1.5 text-red-900/70 hover:text-red-500 transition-colors ml-2" title="Leave Group">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="bg-[#030712]/80 border border-emerald-500/30 px-4 py-2 rounded-lg flex items-center space-x-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Key className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[9px] text-emerald-700 font-mono tracking-widest uppercase">Invite Code</span>
                <span className="text-emerald-400 font-mono font-bold tracking-[0.2em]">{activeGroup.id}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-emerald-500 font-mono animate-pulse">AGGREGATING NETWORK TELEMETRY...</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-10">
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <Trophy className="text-amber-400 w-5 h-5" />
                        <h3 className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">Group Leaderboard</h3>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono uppercase">{activeGroup.members.length}/10 Operators</span>
                </div>
                <div className="space-y-3">
                  {groupStats.leaderboard.length === 0 ? (
                    <p className="text-emerald-700 font-mono text-xs">No telemetry recorded yet.</p>
                  ) : (
                    groupStats.leaderboard.map((member, idx) => (
                      <div key={member.uid} className={`flex items-center justify-between p-4 rounded-xl border ${member.uid === user.uid ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-[#090a0f]/80 border-emerald-900/20'}`}>
                        <div className="flex items-center space-x-4">
                          <span className={`font-mono font-bold w-6 text-center text-lg ${idx === 0 && member.totalXp > 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : idx === 1 && member.totalXp > 0 ? 'text-slate-300' : idx === 2 && member.totalXp > 0 ? 'text-amber-700' : 'text-emerald-700 text-sm'}`}>#{idx + 1}</span>
                          <img src={member.photo} alt="avatar" className="w-10 h-10 rounded-full border border-emerald-900/50 object-cover" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-emerald-100 truncate max-w-[120px] sm:max-w-[150px]">
                                {member.uid === user.uid && user.displayName ? user.displayName.split(" ")[0] : member.name}
                            </span>
                            {member.uid === activeGroup.admin && <span className="text-[9px] text-amber-500 font-mono uppercase tracking-widest">Admin</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-emerald-400 text-lg tracking-wider">{member.totalXp} XP</span>
                            
                            {activeGroup.admin === user.uid && member.uid !== user.uid && (
                                <button 
                                    onClick={() => handleKickMember(member.uid)} 
                                    className="text-red-900/50 hover:text-red-400 transition-colors"
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
                <div className="flex items-center space-x-2 mb-6">
                  <Activity className="text-emerald-400 w-5 h-5" />
                  <h3 className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">Network Diagnostics</h3>
                </div>
                
                <div className="space-y-6">
                  {Object.keys(groupStats.categories).length === 0 ? (
                    <p className="text-emerald-700 font-mono text-xs">No category data available.</p>
                  ) : (
                    Object.entries(groupStats.categories).map(([uid, data]) => (
                      <div key={uid} className="bg-[#030712]/50 border border-emerald-900/30 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-100 mb-3 flex items-center gap-2">
                          {uid === user.uid && user.displayName ? user.displayName.split(" ")[0] : data.name} 
                          {uid === user.uid && <span className="text-[9px] text-emerald-500 font-mono border border-emerald-500/30 px-1.5 rounded">YOU</span>}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(data.tasks)
                            .sort((a, b) => b[1] - a[1])
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

export default GroupDashboard;