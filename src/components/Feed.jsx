import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Edit2, Save, X, Trophy, Activity } from 'lucide-react';

const Feed = ({ user }) => {
  const [activeTab, setActiveTab] = useState('log');
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editMinutes, setEditMinutes] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "sessions"), 
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'leaderboard') return;

    const fetchLeaderboard = async () => {
      setIsLoadingBoard(true);
      try {
        const snapshot = await getDocs(collection(db, "sessions"));
        const usersMap = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!usersMap[data.uid]) {
            usersMap[data.uid] = {
              uid: data.uid,
              name: data.userName || "Hacker",
              photo: data.userPhoto || "https://via.placeholder.com/40",
              totalXp: 0,
            };
          }
          usersMap[data.uid].totalXp += (data.xp || 0);
        });

        const sorted = Object.values(usersMap).sort((a, b) => b.totalXp - a.totalXp);
        setLeaderboard(sorted);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoadingBoard(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this log?")) {
      await deleteDoc(doc(db, "sessions", id));
    }
  };

  const handleUpdate = async (id) => {
    const newSeconds = parseInt(editMinutes) * 60;
    if (isNaN(newSeconds) || newSeconds <= 0) return;

    const newXp = Math.floor((newSeconds / 60) * 10);

    await updateDoc(doc(db, "sessions", id), { 
      duration: newSeconds,
      xp: newXp,
      synced: false 
    });
    setEditingId(null);
  };

  return (
    <div className="bg-[#0c0c0c] border border-emerald-900/30 rounded-2xl p-6 h-full min-h-[500px] shadow-2xl relative overflow-hidden flex flex-col">
      {/* The Timer Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-50"></div>

      <div className="bg-emerald-950/20 rounded-xl p-1 mb-6 border border-emerald-900/30 shadow-inner">
        <div className="relative flex w-full">
          <div 
            className={`absolute top-0 bottom-0 w-1/2 bg-emerald-500 rounded-lg transition-all duration-300 ease-out ${
              activeTab === 'leaderboard' ? 'left-1/2' : 'left-0'
            }`}
          ></div>
          
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 flex items-center justify-center space-x-2 relative z-10 py-2.5 text-xs font-bold font-mono rounded-lg transition-colors duration-300 ${
              activeTab === 'log' ? 'text-slate-950' : 'text-emerald-700 hover:text-emerald-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>ACTIVITY LOG</span>
          </button>
          
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex items-center justify-center space-x-2 relative z-10 py-2.5 text-xs font-bold font-mono rounded-lg transition-colors duration-300 ${
              activeTab === 'leaderboard' ? 'text-slate-950' : 'text-emerald-700 hover:text-emerald-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>LEADERBOARD</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {activeTab === 'log' && (
          sessions.length === 0 ? (
            <div className="text-emerald-700 font-mono text-sm text-center mt-10">No focus sessions logged yet.</div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="group flex justify-between items-center bg-emerald-950/10 border border-emerald-900/30 hover:border-emerald-500/30 p-4 rounded-xl transition-all">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-emerald-400 font-mono text-sm uppercase">_{s.task}</span>
                    {s.synced && <span className="w-2 h-2 rounded-full bg-amber-500" title="Synced to GitHub"></span>}
                  </div>
                  <div className="text-xs text-emerald-700">
                    {s.timestamp ? new Date(s.timestamp.toDate()).toLocaleDateString() : 'Just now'} • {s.xp} XP
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {editingId === s.id ? (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        className="w-16 bg-[#0c0c0c] text-white font-mono text-sm border border-emerald-500 rounded px-2 py-1 outline-none text-center"
                        placeholder="Mins"
                      />
                      <button onClick={() => handleUpdate(s.id)} className="text-emerald-400 hover:text-emerald-300"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-emerald-700 hover:text-emerald-400"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-emerald-100/90 font-bold font-mono">{formatTime(s.duration)}</span>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingId(s.id); setEditMinutes(Math.floor(s.duration / 60)); }} 
                          className="text-emerald-700 hover:text-emerald-400"
                        ><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="text-emerald-700 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'leaderboard' && (
          isLoadingBoard ? (
            <div className="flex justify-center items-center mt-10 text-emerald-400 font-mono text-sm animate-pulse">
              AGGREGATING GLOBAL RANKS...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-emerald-700 font-mono text-sm text-center mt-10">No users found.</div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((player, idx) => (
                <div 
                  key={player.uid} 
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    player.uid === user.uid 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-emerald-950/10 border-emerald-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`font-mono font-bold w-6 text-center text-lg ${
                      idx === 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 
                      idx === 1 ? 'text-slate-300' : 
                      idx === 2 ? 'text-amber-700' : 
                      'text-emerald-700 text-sm'
                    }`}>
                      #{idx + 1}
                    </span>
                    <img 
                      src={player.photo} 
                      alt={player.name} 
                      className={`w-10 h-10 rounded-full border-2 ${player.uid === user.uid ? 'border-emerald-500' : 'border-emerald-900/50'}`} 
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-emerald-100/90">{player.name}</span>
                      {player.uid === user.uid && <span className="text-[10px] text-emerald-400 font-mono">YOU</span>}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{player.totalXp} XP</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Feed;