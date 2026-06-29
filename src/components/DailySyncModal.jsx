import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, CheckCircle2 } from 'lucide-react';

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
        // If the session hasn't been marked synced yet, log its ID
        if (data.synced !== true) {
          pendingSyncIds.push(docSnap.id);
        }
      });

      // Aggregate the grand total for the day (to keep GitHub accurate)
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
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
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
    
    // Create a unique file for today (e.g., logs/2026-06-29.md)
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const path = `logs/${dateString}.md`; 
    
    try {
      // 1. Check if today's file already exists
      const getFileRes = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fileData = await getFileRes.json();
      const sha = fileData.sha ? fileData.sha : undefined;

      // 2. Generate the Grand Total Markdown
      let totalSeconds = 0;
      let breakdown = sessions.map(s => {
        totalSeconds += s.duration;
        return `- ${s.task}: ${formatTime(s.duration)}`;
      }).join('\n');

      // Notice we are NOT appending to old content anymore. We just overwrite with the accurate total.
      const logEntry = `### Daily Sync: ${now.toDateString()}\n**Total Focus: ${formatTime(totalSeconds)}**\n\n${breakdown}`;
      const newContentBase64 = btoa(logEntry);

      // 3. Push to GitHub
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

      // 4. Mark these specific sessions as synced in Firebase!
      const batch = writeBatch(db);
      unsyncedDocs.forEach(id => {
        const sessionRef = doc(db, "sessions", id);
        batch.update(sessionRef, { synced: true });
      });
      await batch.commit();

      setSyncComplete(true);
      setUnsyncedDocs([]); // Clear the pending list
    } catch (error) {
      console.error("GitHub Commit failed:", error);
      alert("Failed to sync to GitHub.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-[#0a0f16] border border-amber-500/30 w-full max-w-md rounded-2xl p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">End of Shift</h2>
        
        {/* Dynamic Subheading based on sync state */}
        <p className="text-slate-400 font-mono text-sm mb-6">
          {unsyncedDocs.length > 0 
            ? `You have ${unsyncedDocs.length} unsynced session(s) pending.` 
            : "All sessions are synced for today."}
        </p>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 mb-8 min-h-[120px]">
          <div className="text-xs text-slate-500 font-mono mb-3 uppercase tracking-widest border-b border-slate-800 pb-2">
            Today's Grand Total
          </div>
          {sessions.length === 0 ? (
            <div className="flex h-[80px] items-center justify-center text-slate-500 font-mono text-sm">
              No sessions logged today.
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-amber-400 font-mono">_{s.task}</span>
                  <span className="text-slate-300 font-bold">{formatTime(s.duration)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {syncComplete || unsyncedDocs.length === 0 ? (
          <div className="flex items-center justify-center space-x-2 bg-slate-900 text-slate-500 border border-slate-800 py-3 rounded-xl w-full cursor-not-allowed">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-mono font-bold text-emerald-500">ALL CAUGHT UP</span>
          </div>
        ) : (
          <button 
            onClick={pushDailyCommit}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 bg-amber-500 text-slate-950 py-3 rounded-xl font-bold w-full hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
          >
            <GithubIcon className="w-5 h-5" />
            <span>{isSyncing ? 'ENCRYPTING & SYNCING...' : `SYNC ${unsyncedDocs.length} NEW SESSION(S)`}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DailySyncModal;