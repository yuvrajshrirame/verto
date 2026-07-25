import React, { useState, useEffect } from 'react';
import { updateProfile, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { X, User, Database, AlertOctagon, Save, Download, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, AtSign, Bug } from 'lucide-react';

const ProfileSettingsModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('identity');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  const safeUserPhoto = String(user?.photoURL || "");
  const initialPhoto = safeUserPhoto.includes('dicebear') ? '' : safeUserPhoto;
  
  const [photoURL, setPhotoURL] = useState(initialPhoto);
  const [username, setUsername] = useState(''); 
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchUserDoc = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.isPublic !== undefined) setIsPublic(data.isPublic);
        if (data.username) setUsername(data.username);
      } else {
        setUsername(`operator_${Math.floor(Math.random() * 9000) + 1000}`);
      }
    };
    fetchUserDoc();
  }, [user.uid]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    setMessage(null);
  }, [activeTab]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const finalName = displayName.trim() || "Hacker";
      const finalPhoto = photoURL.trim() || ""; 
      const finalUsername = username.trim().toLowerCase().replace(/\s+/g, '') || `operator_${Math.floor(Math.random() * 9000) + 1000}`;

      await updateProfile(auth.currentUser, {
        displayName: finalName,
        photoURL: finalPhoto
      });

      await setDoc(doc(db, 'users', user.uid), {
        displayName: finalName,
        photoURL: finalPhoto,
        username: finalUsername,
        isPublic: isPublic
      }, { merge: true });

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

  const currentPhoto = String(photoURL || "");
  const isPlaceholder = !currentPhoto || currentPhoto.includes('dicebear');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-[#1a1d24]/95 to-[#090a0f]/95 backdrop-blur-3xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-[2rem] w-full max-w-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent z-50" />

        <div className="w-full md:w-1/3 bg-[#030712]/40 backdrop-blur-md border-b md:border-b-0 md:border-r border-emerald-900/40 p-6 flex flex-col space-y-3 relative z-10">
          <h3 className="text-emerald-500 font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-2 drop-shadow-sm">System Settings</h3>
          
          <button onClick={() => setActiveTab('identity')} className={`cursor-pointer flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${activeTab === 'identity' ? 'bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/40 border-t-emerald-400/30 text-emerald-300' : 'bg-[#090a0f]/50 border border-transparent text-slate-400 hover:text-emerald-300 hover:bg-[#090a0f]/80 hover:border-emerald-900/50'}`}>
            <User className="w-4 h-4 drop-shadow-sm" />
            <span>Identity</span>
          </button>
          
          <button onClick={() => setActiveTab('data')} className={`cursor-pointer flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${activeTab === 'data' ? 'bg-gradient-to-r from-blue-500/20 to-transparent border border-blue-500/40 border-t-blue-400/30 text-blue-300' : 'bg-[#090a0f]/50 border border-transparent text-slate-400 hover:text-blue-300 hover:bg-[#090a0f]/80 hover:border-blue-900/50'}`}>
            <Database className="w-4 h-4 drop-shadow-sm" />
            <span>Data Export</span>
          </button>

          <button onClick={() => setActiveTab('danger')} className={`cursor-pointer flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${activeTab === 'danger' ? 'bg-gradient-to-r from-red-500/20 to-transparent border border-red-500/40 border-t-red-400/30 text-red-400' : 'bg-[#090a0f]/50 border border-transparent text-slate-400 hover:text-red-400 hover:bg-[#090a0f]/80 hover:border-red-900/50'}`}>
            <AlertOctagon className="w-4 h-4 drop-shadow-sm" />
            <span>Danger Zone</span>
          </button>
        </div>

        <div className="flex-1 p-8 relative flex flex-col min-h-[450px] z-10">
          
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 z-20 p-2 rounded-xl bg-[#090a0f]/50 border border-emerald-900/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {activeTab === 'identity' && (
            <div className="space-y-4 animate-fade-in flex-1 flex flex-col">
              <div className="border-b border-emerald-900/30 pb-4 mb-2"> 
                <h2 className="text-xl font-bold text-white mb-1 tracking-widest uppercase drop-shadow-md">Network Identity</h2>
                <p className="text-xs text-emerald-600 font-mono tracking-widest uppercase">Customize how you appear on the ledger.</p>
              </div>

              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20 rounded-full" />
                  {isPlaceholder ? (
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-emerald-500/40 bg-[#090a0f] flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                          <Bug className="w-8 h-8 text-emerald-500 drop-shadow-md" />
                      </div>
                  ) : (
                      <img 
                        src={currentPhoto} 
                        alt="Preview" 
                        className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-emerald-500/40 bg-[#090a0f] object-cover shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)]" 
                      />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1.5 drop-shadow-sm">Avatar URL</label>
                  <input 
                    type="text" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="Leave empty for Bug icon..."
                    className="w-full bg-[#030712]/80 text-emerald-300 font-mono text-sm border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/80 transition-colors truncate placeholder-emerald-900/60"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1.5 drop-shadow-sm">Codename</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Hacker"
                    className="w-full bg-[#030712]/80 text-emerald-300 font-mono text-sm border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/80 transition-colors placeholder-emerald-900/60"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1.5 drop-shadow-sm">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="operator"
                      className="w-full bg-[#030712]/80 text-emerald-300 font-mono text-sm border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-emerald-500/80 transition-colors placeholder-emerald-900/60"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 bg-[#030712]/40 border border-emerald-900/30 p-4 rounded-xl flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    {isPublic ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                    <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest font-bold">Public Telemetry</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider max-w-[200px]">
                    {isPublic ? "Your stats and rank are visible to other operators." : "Your profile is hidden from leaderboards."}
                  </span>
                </div>
                
                <button 
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${isPublic ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-[#030712] rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="mt-auto pt-4">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 border-t-emerald-400/40 hover:from-emerald-500/30 text-emerald-300 py-3.5 rounded-xl font-bold font-mono tracking-widest uppercase transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                >
                  <Save className="w-4 h-4 drop-shadow-sm" />
                  <span>{isSaving ? 'UPDATING...' : 'SAVE IDENTITY'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in flex-1 flex flex-col">
              <div className="border-b border-blue-900/30 pb-4 mb-2">
                <h2 className="text-xl font-bold text-white mb-1 tracking-widest uppercase drop-shadow-md">Data Vault</h2>
                <p className="text-xs text-blue-500/70 font-mono tracking-widest uppercase">Extract local telemetry backups.</p>
              </div>

              <div className="bg-[#030712]/50 border border-blue-900/30 p-6 rounded-2xl mt-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                <p className="text-sm text-blue-200/70 font-mono leading-relaxed">Export all logged focus sessions as a raw JSON matrix. Includes designation, chronological timestamps, durations, and accumulated XP values.</p>
              </div>
              
              <div className="mt-auto pt-6">
                <button 
                  onClick={handleExportData}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-b from-blue-500/20 to-blue-600/10 border border-blue-500/40 border-t-blue-400/40 hover:from-blue-500/30 text-blue-300 py-3.5 rounded-xl font-bold font-mono tracking-widest uppercase transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(59,130,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                >
                  <Download className="w-4 h-4 drop-shadow-sm" />
                  <span>{isSaving ? 'PACKAGING...' : 'DOWNLOAD JSON'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6 animate-fade-in flex-1 flex flex-col">
              <div className="border-b border-red-900/30 pb-4 mb-2">
                <h2 className="text-xl font-bold text-red-400 mb-1 tracking-widest uppercase drop-shadow-md">Danger Zone</h2>
                <p className="text-xs text-red-600/70 font-mono tracking-widest uppercase">Irreversible system actions.</p>
              </div>

              <div className="bg-[#030712]/50 border border-red-900/30 p-6 rounded-2xl mt-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                <p className="text-sm text-red-300/70 font-mono leading-relaxed">Permanently purge your Verto account from the mainframe. This will obliterate all categories, telemetry, and leaderboard rankings from the Firebase database forever.</p>
              </div>
              
              <div className="mt-auto pt-6">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-b from-red-500/20 to-red-600/10 border border-red-500/40 border-t-red-400/40 hover:from-red-500/30 text-red-400 py-3.5 rounded-xl font-bold font-mono tracking-widest uppercase transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                >
                  <Trash2 className="w-4 h-4 drop-shadow-sm" />
                  <span>{isSaving ? 'PURGING...' : 'TERMINATE ACCOUNT'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex items-center space-x-3 px-6 py-3.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] border backdrop-blur-2xl animate-fade-in whitespace-nowrap ${
          message.type === 'error' 
            ? 'bg-gradient-to-br from-red-950/90 to-red-900/90 border-red-500/50 border-t-red-400/50 text-red-200' 
            : 'bg-gradient-to-br from-emerald-950/90 to-emerald-900/90 border-emerald-500/50 border-t-emerald-400/50 text-emerald-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 drop-shadow-md" /> : <AlertCircle className="w-4 h-4 drop-shadow-md" />}
          <span className="text-xs font-mono font-bold tracking-widest uppercase drop-shadow-sm">{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsModal;