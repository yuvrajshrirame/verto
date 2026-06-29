import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Edit2, Save, X } from 'lucide-react';

const Feed = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editMinutes, setEditMinutes] = useState("");

  useEffect(() => {
    if (!user) return;
    
    // Real-time listener for this user's sessions, newest first
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

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this log?")) {
      await deleteDoc(doc(db, "sessions", id));
    }
  };

  const handleUpdate = async (id) => {
    const newSeconds = parseInt(editMinutes) * 60;
    if (isNaN(newSeconds) || newSeconds <= 0) return;

    // Recalculate XP based on the new time
    const newXp = Math.floor((newSeconds / 60) * 10);

    await updateDoc(doc(db, "sessions", id), { 
      duration: newSeconds,
      xp: newXp,
      synced: false // Flag as unsynced so the Daily Sync catches the correction!
    });
    setEditingId(null);
  };

  return (
    <div className="bg-[#0c0c0c] border border-slate-800 rounded-2xl p-6 h-full min-h-[500px] shadow-xl flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-widest">Activity Log</h2>
        <span className="bg-slate-900 text-slate-400 text-xs font-mono px-3 py-1 rounded-full border border-slate-800">
          {sessions.length} Logs
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="text-slate-500 font-mono text-sm text-center mt-10">No focus sessions logged yet.</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="group flex justify-between items-center bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all">
              
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-emerald-400 font-mono text-sm uppercase">_{s.task}</span>
                  {s.synced && <span className="w-2 h-2 rounded-full bg-amber-500" title="Synced to GitHub"></span>}
                </div>
                <div className="text-xs text-slate-500">
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
                      className="w-16 bg-slate-950 text-white font-mono text-sm border border-emerald-500 rounded px-2 py-1 outline-none text-center"
                      placeholder="Mins"
                    />
                    <button onClick={() => handleUpdate(s.id)} className="text-emerald-400 hover:text-emerald-300"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-200 font-bold font-mono">{formatTime(s.duration)}</span>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(s.id); setEditMinutes(Math.floor(s.duration / 60)); }} 
                        className="text-slate-500 hover:text-white"
                      ><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;