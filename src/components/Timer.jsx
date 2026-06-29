import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Play, Pause, Save, Zap, Plus, Settings } from 'lucide-react';
import ManageCategoriesModal from './ManageCategoriesModal';

const Timer = ({ user }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
      // Keep selected task if it exists, otherwise default to first
      if (!fetchedCats.includes(selectedTask)) {
        setSelectedTask(fetchedCats[0]);
      }
      setIsCreatingNew(false);
    } else {
      setSelectedTask('');
      setIsCreatingNew(true); // Force open if they have no categories
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user.uid]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
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
      await fetchCategories(); // Refresh list
      setSelectedTask(catName);
      setNewCategoryName('');
    } catch (error) {
      console.error("Failed to add category:", error);
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
          synced: false, // Explicitly mark for Daily Sync
          timestamp: serverTimestamp()
        });
        setSeconds(0);
      } catch (error) {
        console.error("Error saving session: ", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <div className="bg-[#0c0c0c] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-50"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-slate-800/50 pb-4 gap-4">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
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
                  className="bg-slate-950 text-emerald-400 font-mono text-sm border border-slate-700 rounded px-3 py-1.5 outline-none w-full sm:w-32 focus:border-emerald-500"
                />
                <button onClick={handleAddNewCategory} className="bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 text-sm font-bold">Add</button>
                {categories.length > 0 && (
                  <button onClick={() => setIsCreatingNew(false)} className="text-slate-500 hover:text-white">✕</button>
                )}
              </div>
            ) : (
              <div className="flex space-x-2 w-full sm:w-auto items-center">
                <select 
                  value={selectedTask} 
                  onChange={(e) => setSelectedTask(e.target.value)}
                  disabled={isActive || isSaving}
                  className="bg-slate-950 text-emerald-400 font-mono text-sm border border-slate-800 rounded px-4 py-2 outline-none cursor-pointer disabled:opacity-50 appearance-none w-full sm:w-auto"
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>_{cat}</option>
                  ))}
                </select>
                <button onClick={() => setIsCreatingNew(true)} disabled={isActive} className="text-slate-500 hover:text-emerald-400 transition-colors p-1" title="New Category">
                  <Plus className="w-5 h-5" />
                </button>
                <button onClick={() => setIsManageModalOpen(true)} disabled={isActive} className="text-slate-500 hover:text-white transition-colors p-1" title="Manage Categories">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-12">
          <div className={`text-7xl font-mono font-light tracking-tighter transition-all duration-500 ${
            isActive ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.6)] scale-105' : 'text-slate-300 scale-100'
          }`}>
            {formatTime(seconds)}
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || categories.length === 0}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold transition-all ${
              isActive 
                ? 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900' 
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            } disabled:opacity-50`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            <span>{isActive ? 'PAUSE' : 'INITIALIZE'}</span>
          </button>
          
          <button 
            onClick={finishSession}
            disabled={seconds === 0 || isSaving}
            className="flex-1 flex items-center justify-center space-x-2 bg-slate-800 text-slate-300 border border-slate-700 py-4 rounded-xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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