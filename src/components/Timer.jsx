import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Play, Pause, Save, Zap, Plus, Settings, AlertTriangle, RotateCcw } from 'lucide-react'; // Added RotateCcw
import ManageCategoriesModal from './ManageCategoriesModal';

const Timer = ({ user }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapped, setIsCapped] = useState(false);
  
  // Zero Hardcoded Values
  const [categories, setCategories] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const fetchCategories = async () => {
    const q = query(collection(db, "categories"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const fetchedCats = querySnapshot.docs.map(doc => doc.data().name);
    
    setCategories(fetchedCats);
    
    if (fetchedCats.length > 0) {
      if (!fetchedCats.includes(selectedTask)) {
        setSelectedTask(fetchedCats[0]);
      }
      setIsCreatingNew(false);
    } else {
      setSelectedTask('');
      setIsCreatingNew(true); 
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user.uid]);

  // Stabilized Interval & 4-Hour Cap
  useEffect(() => {
    let interval = null;
    if (isActive) {
      if (seconds >= 14400) { // 4 hours limit
        setIsActive(false);
        setIsCapped(true);
      } else {
        interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  // Reload Protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive || seconds > 0) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds) => {
    const getSeconds = `0${(totalSeconds % 60)}`.slice(-2);
    const minutes = `${Math.floor(totalSeconds / 60)}`;
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(totalSeconds / 3600)}`.slice(-2);
    return `${getHours}:${getMinutes}:${getSeconds}`;
  };

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim() === '') return;
    const catName = newCategoryName.trim();
    
    try {
      await addDoc(collection(db, "categories"), {
        uid: user.uid,
        name: catName,
        createdAt: serverTimestamp()
      });
      await fetchCategories(); 
      setSelectedTask(catName);
      setNewCategoryName('');
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  // Safe Reset Protocol
  const handleReset = () => {
    if (seconds === 0) return;
    
    const confirmReset = window.confirm("ABORT FOCUS SESSION? All accumulated time for this node will be purged.");
    if (confirmReset) {
      setIsActive(false);
      setSeconds(0);
      setIsCapped(false);
    }
  };

  const finishSession = async () => {
    if (!selectedTask) {
      alert("Please create a category first!");
      return;
    }
    
    setIsActive(false);
    if (seconds > 0) {
      setIsSaving(true);
      const xpEarned = Math.floor((seconds / 60) * 10);
      
      try {
        await addDoc(collection(db, "sessions"), {
          uid: user.uid,
          userName: user.displayName || user.reloadUserInfo.screenName,
          userPhoto: user.photoURL,
          task: selectedTask,
          duration: seconds,
          xp: xpEarned,
          synced: false, 
          timestamp: serverTimestamp()
        });
        setSeconds(0);
        setIsCapped(false);
      } catch (error) {
        console.error("Error saving session: ", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-50"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-emerald-900/30 pb-4 gap-4">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-emerald-700'}`} />
            <h2 className="text-lg font-bold text-white uppercase tracking-widest">Focus Node</h2>
          </div>
          
          <div className="flex items-center w-full sm:w-auto space-x-2">
            {isCreatingNew ? (
              <div className="flex w-full sm:w-auto space-x-2">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="New Category..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                  className="bg-[#030712]/50 text-emerald-400 font-mono text-sm border border-emerald-900/50 rounded px-3 py-1.5 outline-none w-full sm:w-32 focus:border-emerald-500 transition-colors"
                />
                <button onClick={handleAddNewCategory} className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-3 py-1.5 rounded hover:bg-emerald-900/50 text-sm font-bold transition-colors">Add</button>
                {categories.length > 0 && (
                  <button onClick={() => setIsCreatingNew(false)} className="text-emerald-700 hover:text-white transition-colors">✕</button>
                )}
              </div>
            ) : (
              <div className="flex space-x-2 w-full sm:w-auto items-center">
                <select 
                  value={selectedTask} 
                  onChange={(e) => setSelectedTask(e.target.value)}
                  disabled={isActive || isSaving}
                  className="bg-[#030712]/50 text-emerald-400 font-mono text-sm border border-emerald-900/50 rounded px-4 py-2 outline-none cursor-pointer disabled:opacity-50 appearance-none w-full sm:w-auto focus:border-emerald-500 transition-colors"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>_{cat}</option>
                  ))}
                </select>
                <button onClick={() => setIsCreatingNew(true)} disabled={isActive} className="text-emerald-700 hover:text-emerald-400 transition-colors p-1" title="New Category">
                  <Plus className="w-5 h-5" />
                </button>
                <button onClick={() => setIsManageModalOpen(true)} disabled={isActive} className="text-emerald-700 hover:text-white transition-colors p-1" title="Manage Categories">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isCapped && (
          <div className="flex items-center justify-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg mb-6 animate-pulse text-xs font-mono font-bold mx-auto w-fit">
            <AlertTriangle className="w-4 h-4" />
            <span>4-HOUR LIMIT REACHED. SESSION PAUSED.</span>
          </div>
        )}

        <div className="flex justify-center mb-12">
          <div className={`text-7xl md:text-8xl font-mono font-light tracking-tighter transition-all duration-500 ${
            isActive ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] scale-105' : 'text-slate-300 scale-100'
          }`}>
            {formatTime(seconds)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Action Trigger Block */}
          <button 
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || categories.length === 0 || isCapped}
            className={`flex-[3] flex items-center justify-center space-x-2 py-4 rounded-xl font-bold transition-all ${
              isActive 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            } disabled:opacity-50`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            <span>{isActive ? 'PAUSE' : (seconds > 0 ? 'RESUME' : 'INITIALIZE')}</span>
          </button>
          
          {/* Reset Terminal Node */}
          <button
            onClick={handleReset}
            disabled={seconds === 0 || isSaving}
            className="flex-1 flex items-center justify-center py-4 rounded-xl border border-red-900/30 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="Reset Node"
          >
            <RotateCcw className={`w-5 h-5 ${isActive ? 'animate-spin [animation-duration:8s]' : ''}`} />
          </button>

          {/* Persistent Sync Block */}
          <button 
            onClick={finishSession}
            disabled={seconds === 0 || isSaving}
            className="flex-[3] flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 border border-emerald-400 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'SYNCING...' : 'LOG SESSION'}</span>
          </button>
        </div>
      </div>

      {isManageModalOpen && (
        <ManageCategoriesModal 
          user={user} 
          onClose={() => setIsManageModalOpen(false)} 
          onUpdate={fetchCategories} 
        />
      )}
    </>
  );
};

export default Timer;