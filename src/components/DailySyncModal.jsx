import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, CheckCircle2, DatabaseBackup, RefreshCw } from 'lucide-react';

const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const DailySyncModal = ({ user, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [unsyncedDocs, setUnsyncedDocs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    const fetchTodaySessions = async () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "sessions"),
        where("uid", "==", user.uid),
        where("timestamp", ">=", startOfToday)
      );

      const querySnapshot = await getDocs(q);
      const allSessions = [];
      const pendingSyncIds = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allSessions.push(data);
        if (data.synced !== true) {
          pendingSyncIds.push(docSnap.id);
        }
      });

      const aggregated = allSessions.reduce((acc, curr) => {
        if (!acc[curr.task]) acc[curr.task] = 0;
        acc[curr.task] += curr.duration;
        return acc;
      }, {});

      setSessions(Object.entries(aggregated).map(([task, duration]) => ({ task, duration })));
      setUnsyncedDocs(pendingSyncIds);
    };

    fetchTodaySessions();
  }, [user.uid]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const pushDailyCommit = async () => {
    if (unsyncedDocs.length === 0) return;
    setIsSyncing(true);

    const token = localStorage.getItem("github_token");
    if (!token) {
      alert("GitHub token missing. Please log in again.");
      setIsSyncing(false);
      return;
    }

    const repoName = "verto-activity"; 
    const githubUsername = user.reloadUserInfo.screenName; 
    
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const path = `logs/${dateString}.md`; 
    
    try {
      const getFileRes = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fileData = await getFileRes.json();
      const sha = fileData.sha ? fileData.sha : undefined;

      let totalSeconds = 0;
      let breakdown = sessions.map(s => {
        totalSeconds += s.duration;
        return `- ${s.task}: ${formatTime(s.duration)}`;
      }).join('\n');

      const logEntry = `### Daily Sync: ${now.toDateString()}\n**Total Focus: ${formatTime(totalSeconds)}**\n\n${breakdown}`;
      const newContentBase64 = btoa(logEntry);

      await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Verto Sync: Updated totals for ${dateString}`,
          content: newContentBase64,
          sha: sha 
        })
      });

      const batch = writeBatch(db);
      unsyncedDocs.forEach(id => {
        const sessionRef = doc(db, "sessions", id);
        batch.update(sessionRef, { synced: true });
      });
      await batch.commit();

      setSyncComplete(true);
      setUnsyncedDocs([]); 
    } catch (error) {
      console.error("GitHub Commit failed:", error);
      alert("Failed to sync to GitHub.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f1117] border border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] w-full max-w-sm relative transform scale-100 transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          disabled={isSyncing}
          className="absolute top-4 right-4 text-emerald-700 hover:text-emerald-400 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="p-4 rounded-full mb-4 transition-colors duration-300 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            {syncComplete || (unsyncedDocs.length === 0 && !isSyncing) ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <DatabaseBackup className={`w-8 h-8 text-emerald-400 ${isSyncing ? 'animate-pulse' : ''}`} />
            )}
          </div>
          
          <h2 className="text-xl font-mono font-bold text-white tracking-widest mb-2 uppercase">
            {syncComplete || (unsyncedDocs.length === 0 && !isSyncing) ? 'Sync Complete' : 'Daily Sync'}
          </h2>
          
          <p className="text-emerald-700/80 text-xs font-mono mb-6">
            {unsyncedDocs.length > 0 
              ? `You have ${unsyncedDocs.length} unsynced session(s) pending.` 
              : "All sessions are synced for today."}
          </p>

          <div className="bg-[#090a0f]/80 w-full border border-emerald-900/20 rounded-xl p-4 mb-6 min-h-[100px]">
            <div className="text-[10px] text-emerald-700 font-mono mb-3 uppercase tracking-widest border-b border-emerald-900/30 pb-2 text-left">
              Today's Grand Total
            </div>
            {sessions.length === 0 ? (
              <div className="flex h-[50px] items-center justify-center text-emerald-700 font-mono text-xs">
                No sessions logged today.
              </div>
            ) : (
              <ul className="space-y-2 text-left">
                {sessions.map((s, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-mono">_{s.task}</span>
                    <span className="text-emerald-100/90 font-bold font-mono">{formatTime(s.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex w-full space-x-3">
            <button 
              onClick={onClose} 
              disabled={isSyncing}
              className="flex-1 py-2.5 rounded-lg border border-emerald-900/50 text-emerald-400 font-mono font-bold text-xs tracking-wider hover:bg-emerald-500/10 disabled:opacity-50 transition-colors cursor-pointer"
            >
              CANCEL
            </button>

            {syncComplete || unsyncedDocs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs tracking-wider cursor-not-allowed">
                <span>ALL SYNCED</span>
              </div>
            ) : (
              <button 
                onClick={pushDailyCommit} 
                disabled={isSyncing}
                className="flex-[1.5] flex items-center justify-center space-x-2 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs tracking-wider hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ENCRYPTING...</span>
                  </>
                ) : (
                  <>
                    <GithubIcon className="w-4 h-4" />
                    <span>SYNC {unsyncedDocs.length} LOG(S)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySyncModal;