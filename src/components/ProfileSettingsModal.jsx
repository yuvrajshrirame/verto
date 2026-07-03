import React, { useState, useEffect } from 'react';
import { updateProfile, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { X, User, Database, AlertOctagon, Save, Download, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

const ProfileSettingsModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('identity');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Auto-dismiss the toast after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Clear message instantly when switching tabs
  useEffect(() => {
    setMessage(null);
  }, [activeTab]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || "Hacker",
        photoURL: photoURL.trim() || "https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker"
      });
      setMessage({ type: 'success', text: 'Identity updated. Refresh to sync globally.' });
    } catch (error) {
      console.error("Update error:", error);
      setMessage({ type: 'error', text: 'Failed to update identity.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsSaving(true);
    try {
      const q = query(collection(db, "sessions"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verto_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({ type: 'success', text: 'Telemetry data exported successfully.' });
    } catch (error) {
      console.error("Export error:", error);
      setMessage({ type: 'error', text: 'Failed to export data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete your account, all categories, and all focus sessions. This cannot be undone. Proceed?")) {
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      const sessionsQ = query(collection(db, "sessions"), where("uid", "==", user.uid));
      const sessionsSnap = await getDocs(sessionsQ);
      sessionsSnap.forEach(doc => batch.delete(doc.ref));

      const categoriesQ = query(collection(db, "categories"), where("uid", "==", user.uid));
      const categoriesSnap = await getDocs(categoriesQ);
      categoriesSnap.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error("Delete error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Security requirement: Sign in again before deleting.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account.' });
      }
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f1117]/95 border border-emerald-900/50 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-[#090a0f] border-b md:border-b-0 md:border-r border-emerald-900/30 p-4 flex flex-col space-y-2">
          <h3 className="text-emerald-700 font-mono text-xs font-bold uppercase tracking-widest mb-4 px-2">Settings</h3>
          
          <button onClick={() => setActiveTab('identity')} className={`cursor-pointer flex items-center space-x-2 w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all ${activeTab === 'identity' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
            <User className="w-4 h-4" />
            <span>Identity</span>
          </button>
          
          <button onClick={() => setActiveTab('data')} className={`cursor-pointer flex items-center space-x-2 w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all ${activeTab === 'data' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
            <Database className="w-4 h-4" />
            <span>Data Export</span>
          </button>

          <button onClick={() => setActiveTab('danger')} className={`cursor-pointer flex items-center space-x-2 w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
            <AlertOctagon className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 relative flex flex-col min-h-[350px]">
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {activeTab === 'identity' && (
            <div className="space-y-6 animate-fade-in flex-1">
              <div> 
                <h2 className="text-lg font-bold text-white mb-1">Network Identity</h2>
                <p className="text-xs text-slate-400 font-mono">Customize how you appear on the leaderboard.</p>
              </div>

              <div className="flex items-center space-x-4">
                <img 
                  src={photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker'} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full border border-emerald-500/50 bg-[#090a0f] object-cover shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-mono text-emerald-700 uppercase mb-1">Avatar URL</label>
                  <input 
                    type="text" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#030712]/50 text-emerald-100 font-mono text-sm border border-emerald-900/50 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 transition-colors truncate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-emerald-700 uppercase mb-1">Codename (Nickname)</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Hacker"
                  className="w-full bg-[#030712]/50 text-emerald-100 font-mono text-sm border border-emerald-900/50 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-3 rounded-xl font-bold font-mono transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'UPDATING...' : 'SAVE IDENTITY'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in flex-1">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Data Vault</h2>
                <p className="text-xs text-slate-400 font-mono">Download a local backup of your telemetry.</p>
              </div>

              <div className="bg-[#030712]/50 border border-blue-900/30 p-5 rounded-xl">
                <p className="text-sm text-blue-200/70 font-mono mb-6 leading-relaxed">Export all logged focus sessions as a raw JSON file. This includes task names, durations, timestamps, and earned XP.</p>
                <button 
                  onClick={handleExportData}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-xl font-bold font-mono transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSaving ? 'PACKAGING...' : 'DOWNLOAD JSON'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6 animate-fade-in flex-1">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 text-red-400">Danger Zone</h2>
                <p className="text-xs text-slate-400 font-mono">Irreversible system actions.</p>
              </div>

              <div className="bg-red-950/10 border border-red-900/30 p-5 rounded-xl">
                <p className="text-sm text-red-200/70 font-mono mb-6 leading-relaxed">Permanently delete your Verto account. This will wipe all categories, telemetry, and leaderboard rankings from the Firebase database.</p>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-bold font-mono transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isSaving ? 'PURGING...' : 'TERMINATE ACCOUNT'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Toast Notification */}
          {message && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] border backdrop-blur-md animate-fade-in whitespace-nowrap ${
              message.type === 'error' 
                ? 'bg-red-950/80 border-red-500/50 text-red-400' 
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-xs font-mono font-bold">{message.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;