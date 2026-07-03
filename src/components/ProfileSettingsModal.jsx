import React, { useState } from 'react';
import { updateProfile, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { X, User, Database, AlertOctagon, Save, Download, Trash2 } from 'lucide-react';

const ProfileSettingsModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('identity');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || "Hacker",
        photoURL: photoURL.trim() || "https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker"
      });
      setMessage({ type: 'success', text: 'Identity updated successfully. (Refresh to see changes globally)' });
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
      
      setMessage({ type: 'success', text: 'Data exported successfully.' });
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
      
      // 1. Delete Sessions
      const sessionsQ = query(collection(db, "sessions"), where("uid", "==", user.uid));
      const sessionsSnap = await getDocs(sessionsQ);
      sessionsSnap.forEach(doc => batch.delete(doc.ref));

      // 2. Delete Categories
      const categoriesQ = query(collection(db, "categories"), where("uid", "==", user.uid));
      const categoriesSnap = await getDocs(categoriesQ);
      categoriesSnap.forEach(doc => batch.delete(doc.ref));

      // Commit DB Deletions
      await batch.commit();

      // 3. Delete Auth User
      await deleteUser(auth.currentUser);
      // User will be automatically signed out and redirected by onAuthStateChanged in App.jsx
    } catch (error) {
      console.error("Delete error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Security requirement: Please sign out and sign back in before deleting your account.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account.' });
      }
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0f1117]/95 border border-emerald-900/50 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-[#090a0f] border-b md:border-b-0 md:border-r border-emerald-900/30 p-4 flex flex-col space-y-2">
          <h3 className="text-emerald-700 font-mono text-xs font-bold uppercase tracking-widest mb-4 px-2">Settings</h3>
          
          <button onClick={() => setActiveTab('identity')} className={`flex items-center space-x-2 w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all ${activeTab === 'identity' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
            <User className="w-4 h-4" />
            <span>Identity</span>
          </button>
          
          <button onClick={() => setActiveTab('data')} className={`flex items-center space-x-2 w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all ${activeTab === 'data' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
            <Database className="w-4 h-4" />
            <span>Data Export</span>
          </button>

          <button onClick={() => setActiveTab('danger')} className={`flex items-center space-x-2 w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
            <AlertOctagon className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-emerald-400 transition-colors">
            <X className="w-5 h-5" />
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-mono mb-6 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Network Identity</h2>
                <p className="text-xs text-slate-400 font-mono mb-4">Customize how you appear on the leaderboard.</p>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <img src={photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker'} alt="Preview" className="w-16 h-16 rounded-full border border-emerald-500/50 bg-[#090a0f]" />
                <div className="flex-1">
                  <label className="block text-xs font-mono text-emerald-700 uppercase mb-1">Avatar URL</label>
                  <input 
                    type="text" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#030712]/50 text-emerald-100 font-mono text-sm border border-emerald-900/50 rounded px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full bg-[#030712]/50 text-emerald-100 font-mono text-sm border border-emerald-900/50 rounded px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl font-bold font-mono transition-all mt-4 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'UPDATING...' : 'SAVE IDENTITY'}</span>
              </button>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Data Vault</h2>
                <p className="text-xs text-slate-400 font-mono mb-4">Download a local backup of your telemetry.</p>
              </div>

              <div className="bg-[#030712]/50 border border-blue-900/30 p-4 rounded-xl">
                <p className="text-xs text-blue-200/70 font-mono mb-4">Export all logged focus sessions as a raw JSON file. This includes task names, durations, timestamps, and earned XP.</p>
                <button 
                  onClick={handleExportData}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2.5 rounded-xl font-bold font-mono transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSaving ? 'PACKAGING...' : 'DOWNLOAD JSON'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 text-red-400">Danger Zone</h2>
                <p className="text-xs text-slate-400 font-mono mb-4">Irreversible system actions.</p>
              </div>

              <div className="bg-red-950/10 border border-red-900/30 p-4 rounded-xl">
                <p className="text-xs text-red-200/70 font-mono mb-4">Permanently delete your Verto account. This will wipe all categories, telemetry, and leaderboard rankings from the Firebase database.</p>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded-xl font-bold font-mono transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isSaving ? 'PURGING...' : 'TERMINATE ACCOUNT'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;