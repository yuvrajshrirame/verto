import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Play, Pause, Save, Zap, Plus, Settings, AlertTriangle, RotateCcw, ChevronDown, Activity } from 'lucide-react';
import ManageCategoriesModal, { ICON_MAP } from './ManageCategoriesModal';

const Timer = ({ user }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapped, setIsCapped] = useState(false);
  
  // Upgraded Category State 
  const [categories, setCategories] = useState([]);
  const [selectedTaskObj, setSelectedTaskObj] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchCategories = async () => {
    const q = query(collection(db, "categories"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const fetchedCats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCategories(fetchedCats);
    
    if (fetchedCats.length > 0) {
      // If we don't have a task selected, or the selected task was deleted, pick the first one
      if (!selectedTaskObj || !fetchedCats.find(c => c.id === selectedTaskObj.id)) {
        setSelectedTaskObj(fetchedCats[0]);
      }
    } else {
      setSelectedTaskObj(null);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user.uid]);

  // Click outside listener for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Stabilized Interval & 4-Hour Cap
  useEffect(() => {
    let interval = null;
    if (isActive) {
      if (seconds >= 14400) { 
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
    if (!selectedTaskObj) {
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
          task: selectedTaskObj.name,
          taskColor: selectedTaskObj.color || '#10b981',
          taskIcon: selectedTaskObj.icon || 'Activity',
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

  // Helper to safely render selected icon
  const SelectedIcon = selectedTaskObj && ICON_MAP[selectedTaskObj.icon] ? ICON_MAP[selectedTaskObj.icon] : Activity;

  return (
    <>
      <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-400 blur-sm opacity-50"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-emerald-900/30 pb-4 gap-4">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-emerald-700'}`} />
            <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono">Focus Node</h2>
          </div>
          
          <div className="flex items-center w-full sm:w-auto space-x-2">
            <div className="flex space-x-2 w-full sm:w-auto items-center relative">
              
              {/* --- CUSTOM DROPDOWN UI --- */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => !isActive && !isSaving && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isActive || isSaving}
                  className="flex items-center justify-between w-48 bg-[#030712]/80 border border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-400 font-mono text-sm hover:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {selectedTaskObj ? (
                    <div className="flex items-center gap-2 truncate">
                      <SelectedIcon className="w-4 h-4 shrink-0" style={{ color: selectedTaskObj.color || '#10b981' }} />
                      <span className="truncate uppercase">{selectedTaskObj.name}</span>
                    </div>
                  ) : (
                    <span className="text-emerald-700">NO TASK</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-[#030712] border border-emerald-900/50 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-fade-in">
                    {categories.map((cat) => {
                      const DropdownIcon = ICON_MAP[cat.icon] || Activity;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { setSelectedTaskObj(cat); setIsDropdownOpen(false); }}
                          className="flex items-center w-full gap-3 px-4 py-2 hover:bg-emerald-900/30 transition-colors cursor-pointer text-left"
                        >
                          <DropdownIcon className="w-4 h-4" style={{ color: cat.color || '#10b981' }} />
                          <span className="font-mono text-xs text-emerald-100 uppercase">{cat.name}</span>
                        </button>
                      );
                    })}
                    <div className="border-t border-emerald-900/30 mt-1 pt-1">
                      <button 
                        onClick={() => { setIsDropdownOpen(false); setIsManageModalOpen(true); }}
                        className="flex items-center w-full gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/20 transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-mono text-xs font-bold uppercase tracking-widest">Manage Engine</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* The Plus Button now perfectly maps to the master modal */}
              <button 
                onClick={() => setIsManageModalOpen(true)} 
                disabled={isActive} 
                className="text-emerald-700 hover:text-emerald-400 transition-colors p-2 bg-[#030712] rounded-lg border border-emerald-900/30 shadow-[0_0_10px_rgba(16,185,129,0.05)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Add Category"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
            isActive ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-105' : 'text-slate-300 scale-100'
          }`} style={{ color: isActive ? (selectedTaskObj?.color || '#10b981') : undefined }}>
            {formatTime(seconds)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || categories.length === 0 || isCapped}
            className={`flex-[3] flex items-center justify-center space-x-2 py-4 rounded-xl font-bold transition-all cursor-pointer ${
              isActive 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            } disabled:opacity-50`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            <span>{isActive ? 'PAUSE' : (seconds > 0 ? 'RESUME' : 'INITIALIZE')}</span>
          </button>
          
          <button
            onClick={handleReset}
            disabled={seconds === 0 || isSaving}
            className="flex-1 flex items-center justify-center py-4 rounded-xl border border-red-900/30 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            title="Reset Node"
          >
            <RotateCcw className={`w-5 h-5 ${isActive ? 'animate-spin [animation-duration:8s]' : ''}`} />
          </button>

          <button 
            onClick={finishSession}
            disabled={seconds === 0 || isSaving}
            className="flex-[3] flex items-center justify-center space-x-2 bg-emerald-500 text-[#030712] border border-emerald-400 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
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