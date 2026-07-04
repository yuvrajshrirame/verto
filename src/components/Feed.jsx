import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Edit2, Save, X, Trophy, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

const Feed = ({ user }) => {
  const [activeTab, setActiveTab] = useState('log');
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editMinutes, setEditMinutes] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  // Pagination States
  const [logPage, setLogPage] = useState(1);
  const [boardPage, setBoardPage] = useState(1);

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

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setLogPage(1);
    setBoardPage(1);
    setEditingId(null);
  };

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
      // Adjust page if we delete the last item on a page
      if (paginatedSessions.length === 1 && logPage > 1) {
        setLogPage(logPage - 1);
      }
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

  // Pagination Logic
  const totalLogPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = sessions.slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE);

  const totalBoardPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);
  const paginatedLeaderboard = leaderboard.slice((boardPage - 1) * ITEMS_PER_PAGE, boardPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl relative flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-50"></div>

      <div className="bg-emerald-950/20 rounded-xl p-1 mb-6 border border-emerald-900/30 shadow-inner shrink-0">
        <div className="relative flex w-full">
          <div 
            className={`absolute top-0 bottom-0 w-1/2 bg-emerald-500 rounded-lg transition-all duration-300 ease-out ${
              activeTab === 'leaderboard' ? 'left-1/2' : 'left-0'
            }`}
          ></div>
          
          <button
            onClick={() => handleTabSwitch('log')}
            className={`flex-1 flex items-center justify-center space-x-2 relative z-10 py-2.5 text-xs font-bold font-mono rounded-lg transition-colors duration-300 cursor-pointer ${
              activeTab === 'log' ? 'text-slate-950' : 'text-emerald-700 hover:text-emerald-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>ACTIVITY LOG</span>
          </button>
          
          <button
            onClick={() => handleTabSwitch('leaderboard')}
            className={`flex-1 flex items-center justify-center space-x-2 relative z-10 py-2.5 text-xs font-bold font-mono rounded-lg transition-colors duration-300 cursor-pointer ${
              activeTab === 'leaderboard' ? 'text-slate-950' : 'text-emerald-700 hover:text-emerald-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>LEADERBOARD</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (No overflow, flex-col with space-between) */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        
        {/* Render Lists */}
        <div className="space-y-3">
          {activeTab === 'log' && (
            sessions.length === 0 ? (
              <div className="text-emerald-700 font-mono text-sm text-center mt-10">No focus sessions logged yet.</div>
            ) : (
              paginatedSessions.map((s) => (
                <div key={s.id} className="group flex justify-between items-center bg-[#090a0f]/80 border border-emerald-900/20 hover:border-emerald-500/30 p-4 rounded-xl transition-all duration-300">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-mono text-sm tracking-widest uppercase">
                        {s.task}
                      </span>
                      {s.synced && (
                        <span className="text-slate-600 font-mono text-[10px] tracking-widest lowercase">
                          (synced)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-700/80 uppercase tracking-widest">
                      <span>{s.timestamp ? new Date(s.timestamp.toDate()).toLocaleDateString() : 'Just now'}</span>
                      <span className="text-emerald-900/50">•</span>
                      <span className="text-emerald-500/80">{s.xp} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {editingId === s.id ? (
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number"
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(e.target.value)}
                          className="w-16 bg-[#030712] text-emerald-100 font-mono text-sm border border-emerald-900/50 rounded-md px-2 py-1 outline-none text-center focus:border-emerald-500 transition-colors"
                          placeholder="Min"
                        />
                        <button onClick={() => handleUpdate(s.id)} className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-emerald-100/90 font-bold font-mono tracking-wider">{formatTime(s.duration)}</span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => { setEditingId(s.id); setEditMinutes(Math.floor(s.duration / 60)); }} 
                            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)} 
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              paginatedLeaderboard.map((player, idx) => {
                // Calculate absolute global rank instead of page rank
                const globalRank = (boardPage - 1) * ITEMS_PER_PAGE + idx + 1;
                return (
                  <div 
                    key={player.uid} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      player.uid === user.uid 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-[#090a0f]/80 border-emerald-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className={`font-mono font-bold w-6 text-center text-lg ${
                        globalRank === 1 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 
                        globalRank === 2 ? 'text-slate-300' : 
                        globalRank === 3 ? 'text-amber-700' : 
                        'text-emerald-700 text-sm'
                      }`}>
                        #{globalRank}
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
                    <span className="font-mono font-bold text-emerald-400 tracking-wider">{player.totalXp} XP</span>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Modular Pagination Footer */}
        {((activeTab === 'log' && totalLogPages > 1) || (activeTab === 'leaderboard' && totalBoardPages > 1)) && (
          <div className="pt-4 mt-4 flex items-center justify-between border-t border-emerald-900/30 shrink-0">
            <button 
              onClick={() => activeTab === 'log' ? setLogPage(p => Math.max(1, p - 1)) : setBoardPage(p => Math.max(1, p - 1))}
              disabled={activeTab === 'log' ? logPage === 1 : boardPage === 1}
              className="flex items-center space-x-1 p-2 rounded-lg text-emerald-600 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-mono font-bold tracking-widest">PREV</span>
            </button>

            <span className="text-[10px] font-mono text-emerald-700 tracking-[0.2em] uppercase">
              PAGE {activeTab === 'log' ? logPage : boardPage} / {activeTab === 'log' ? totalLogPages : totalBoardPages}
            </span>

            <button 
              onClick={() => activeTab === 'log' ? setLogPage(p => Math.min(totalLogPages, p + 1)) : setBoardPage(p => Math.min(totalBoardPages, p + 1))}
              disabled={activeTab === 'log' ? logPage === totalLogPages : boardPage === totalBoardPages}
              className="flex items-center space-x-1 p-2 rounded-lg text-emerald-600 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span className="text-xs font-mono font-bold tracking-widest">NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Feed;