import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Trophy, Users, Zap, Activity, EyeOff } from 'lucide-react';

const UserProfileModal = ({ profileContext, onClose, currentUser }) => {
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ totalXp: 0, focusTier: 'Initiate', groupRank: '-', topNodes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  // Helper to determine rank based on total XP
  const getFocusTier = (xp) => {
    if (xp < 100) return 'Initiate';
    if (xp < 500) return 'Novice';
    if (xp < 1500) return 'Adept';
    if (xp < 4000) return 'Elite';
    return 'Master';
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const uid = profileContext?.uid;
        const groupId = profileContext?.groupId;

        if (!uid) {
          setIsLoading(false); return;
        }

        // 1. Fetch User Identity & Privacy
        const userDoc = await getDoc(doc(db, "users", uid));
        let userData = { 
          displayName: uid === currentUser.uid ? (currentUser.displayName || "Operator") : "Unknown Operator", 
          photoURL: uid === currentUser.uid ? (currentUser.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker") : "https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker", 
          username: `operator_${uid.substring(0,4)}`,
          isPublic: true 
        };
        
        if (userDoc.exists()) {
          userData = { ...userData, ...userDoc.data() };
        }

        setProfileData({ uid, ...userData });

        if (!userData.isPublic && uid !== currentUser.uid) {
          setIsPrivate(true);
          setIsLoading(false);
          return;
        }

        // 2. Fetch ONLY this specific user's sessions to bypass Firebase Security blocks
        const userSessionsQuery = query(collection(db, "sessions"), where("uid", "==", uid));
        const userSessionsSnap = await getDocs(userSessionsQuery);
        
        let userTotalXp = 0;
        const nodeMap = {}; 
        
        userSessionsSnap.forEach(docSnap => {
          const data = docSnap.data();
          
          const rawXp = parseInt(data.xp, 10);
          userTotalXp += isNaN(rawXp) ? 0 : rawXp;

          const task = data.task || 'Unknown';
          const rawDur = parseInt(data.duration, 10);
          nodeMap[task] = (nodeMap[task] || 0) + (isNaN(rawDur) ? 0 : rawDur);
        });

        // 3. Calculate Group Rank dynamically
        let groupRank = '-';
        if (groupId) {
          const groupDoc = await getDoc(doc(db, "guilds", groupId));
          if (groupDoc.exists()) {
            const members = groupDoc.data().members || [];
            
            // Fetch sessions just for group members (safely limited by "in" query size)
            if (members.length > 0 && members.includes(uid)) {
               const membersQuery = query(collection(db, "sessions"), where("uid", "in", members.slice(0, 10)));
               const membersSnap = await getDocs(membersQuery);
               
               const groupXpMap = {};
               membersSnap.forEach(d => {
                 const mUid = d.data().uid;
                 const mXp = parseInt(d.data().xp, 10);
                 groupXpMap[mUid] = (groupXpMap[mUid] || 0) + (isNaN(mXp) ? 0 : mXp);
               });

               // Ensure our target user is mapped even if they have 0 sessions
               groupXpMap[uid] = userTotalXp;

               const groupXpList = Object.entries(groupXpMap).map(([mUid, mXp]) => ({ uid: mUid, xp: mXp })).sort((a, b) => b.xp - a.xp);
               const groupIndex = groupXpList.findIndex(x => x.uid === uid);
               if (groupIndex !== -1) groupRank = groupIndex + 1;
            }
          }
        }

        // 4. Calculate Top Nodes
        const topNodes = Object.entries(nodeMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, duration]) => ({ name, duration }));

        setStats({ totalXp: userTotalXp, focusTier: getFocusTier(userTotalXp), groupRank, topNodes });

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [profileContext, currentUser]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-[#1a1d24]/95 to-[#090a0f]/95 backdrop-blur-3xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full max-w-md relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent z-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-emerald-500 blur-xl opacity-20" />

        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 rounded-xl bg-[#030712]/50 border border-emerald-900/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {isLoading ? (
          <div className="h-80 flex flex-col items-center justify-center text-emerald-600 font-mono animate-pulse tracking-widest gap-4">
            <Activity className="w-8 h-8" />
            <p>QUERYING LEDGER...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8 relative z-10">
              <img 
                src={profileData?.photoURL} 
                alt="Avatar" 
                className="w-24 h-24 rounded-2xl border-2 border-emerald-500/40 object-cover shadow-[0_0_20px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] mb-4 bg-[#090a0f]"
              />
              <h2 className="text-2xl font-bold text-white tracking-widest uppercase drop-shadow-md">
                {profileData?.displayName}
              </h2>
              {/* BRAND NEW USERNAME BADGE */}
              <span className="text-xs text-emerald-400 font-mono tracking-widest lowercase bg-[#030712]/60 px-3 py-1.5 rounded-lg border border-emerald-900/50 mt-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                @{profileData?.username || `operator_${profileData?.uid?.substring(0,4)}`}
              </span>
            </div>

            {isPrivate ? (
              <div className="bg-[#030712]/60 backdrop-blur-md border border-red-900/40 border-t-red-500/20 rounded-2xl p-8 flex flex-col items-center text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <EyeOff className="w-10 h-10 text-red-500/50 mb-3 drop-shadow-sm" />
                <h3 className="text-red-400 font-mono font-bold tracking-widest uppercase text-sm mb-2">Telemetry Hidden</h3>
                <p className="text-slate-400 font-mono text-[10px] leading-relaxed uppercase tracking-wider">
                  This operator has engaged privacy protocols. Their output matrix is hidden from the public ledger.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Ranks & XP */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-900/50 border-t-emerald-500/30 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-emerald-500/50 transition-colors">
                    <Trophy className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-[9px] text-emerald-600 font-mono uppercase tracking-widest mb-1">Focus Tier</span>
                    <span className="text-xl font-bold text-emerald-300 font-mono drop-shadow-md uppercase tracking-wider">{stats.focusTier}</span>
                  </div>
                  
                  {profileContext?.groupId && (
                    <div className="flex-1 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-900/50 border-t-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-amber-500/50 transition-colors">
                      <Users className="w-4 h-4 text-amber-500 mb-1" />
                      <span className="text-[9px] text-amber-600 font-mono uppercase tracking-widest mb-1">Group Rank</span>
                      <span className="text-2xl font-bold text-amber-300 font-mono drop-shadow-md">#{stats.groupRank}</span>
                    </div>
                  )}
                </div>

                {/* Top Nodes */}
                <div className="bg-[#030712]/60 border border-emerald-900/40 border-t-emerald-500/10 rounded-2xl p-5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2 mb-4 border-b border-emerald-900/30 pb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Top Focus Nodes</h3>
                    <span className="ml-auto text-[10px] text-emerald-600 font-mono font-bold">{stats.totalXp} Total XP</span>
                  </div>

                  {stats.topNodes.length === 0 ? (
                    <p className="text-center text-[10px] text-emerald-700 font-mono uppercase tracking-widest py-3 border border-emerald-900/30 border-dashed rounded-xl">No telemetry recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topNodes.map((node, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-[#090a0f]/50 p-2 rounded-lg border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                          <span className="text-slate-300 font-mono uppercase tracking-wider truncate mr-4">_{node.name}</span>
                          <span className="text-emerald-500 font-mono font-bold shrink-0 drop-shadow-sm">{formatTime(node.duration)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;