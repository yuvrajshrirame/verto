import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Play, Pause, Save, Zap, Plus, Settings, AlertTriangle, RotateCcw, ChevronDown, Activity, GripVertical } from 'lucide-react';
import ManageCategoriesModal, { ICON_MAP } from './ManageCategoriesModal';

const Timer = ({ user, isBackground }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapped, setIsCapped] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [selectedTaskObj, setSelectedTaskObj] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- WIDGET DRAG STATE ---
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const fetchCategories = async () => {
    const q = query(collection(db, "categories"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const fetchedCats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCategories(fetchedCats);
    
    if (fetchedCats.length > 0) {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // --- DRAG PHYSICS LOGIC ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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

  const SelectedIcon = selectedTaskObj && ICON_MAP[selectedTaskObj.icon] ? ICON_MAP[selectedTaskObj.icon] : Activity;

  // --- RETURN 1: FLOATING MINI WIDGET (PORTAL DEPLOYED) ---
  if (isBackground) {
    if (!isActive && seconds === 0) return null;

    return createPortal(
      <div 
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[9999] bg-gradient-to-br from-[#1a1d24]/90 to-[#030712]/95 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/40 border-l-emerald-400/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] p-4 rounded-2xl flex items-center gap-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105 hover:border-emerald-400/70 transition-all duration-300'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="opacity-30 hover:opacity-100 transition-opacity flex items-center -ml-1 pr-1" title="Drag to move">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        <div className="p-2.5 rounded-xl bg-[#090a0f]/80 border border-emerald-900/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] text-emerald-400">
          <SelectedIcon className="w-5 h-5" />
        </div>
        
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[9px] text-emerald-500 font-mono uppercase tracking-widest leading-none mb-1.5 truncate max-w-[120px]">
            {selectedTaskObj?.name || 'NODE ACTIVE'}
          </span>
          <span className={`text-xl font-mono font-bold leading-none tracking-wider ${isActive ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)] scale-105 transition-all' : 'text-slate-400 scale-100'}`}>
            {formatTime(seconds)}
          </span>
        </div>

        <div className="flex items-center gap-2 border-l border-emerald-900/50 pl-4 ml-2" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || isCapped}
            className="text-emerald-400 bg-[#090a0f]/50 hover:bg-emerald-500/20 hover:border-emerald-500/50 border border-transparent p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
            title={isActive ? "Pause Node" : "Resume Node"}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          
          <button
            onClick={finishSession}
            disabled={seconds === 0 || isSaving}
            className="text-[#030712] bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_15px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]"
            title="Log Session"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // --- RETURN 2: FULL DASHBOARD TIMER ---
  return (
    <>
      <div className="flex-[1.5] w-full min-h-[500px] bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] relative overflow-hidden flex flex-col justify-between">
        
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-emerald-500 blur-xl opacity-20" />

        {/* ---> FIX: Boosted z-index to z-50 here so the dropdown escapes behind the timer <--- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-emerald-900/40 pb-5 gap-4 relative z-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#030712]/50 rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-emerald-900/30">
                <Zap className={`w-5 h-5 transition-colors duration-500 ${isActive ? 'animate-pulse text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'text-emerald-700'}`} />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest font-mono drop-shadow-md">Focus Node</h2>
          </div>
          
          <div className="flex items-center w-full sm:w-auto space-x-3 relative z-20">
            <div className="flex space-x-3 w-full sm:w-auto items-center relative">
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => !isActive && !isSaving && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isActive || isSaving}
                  className="flex items-center justify-between w-52 bg-[#090a0f]/60 backdrop-blur-md border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl px-4 py-2.5 text-emerald-300 font-mono text-sm hover:border-emerald-400/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {selectedTaskObj ? (
                    <div className="flex items-center gap-2 truncate">
                      <SelectedIcon className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="truncate uppercase font-bold tracking-wider">{selectedTaskObj.name}</span>
                    </div>
                  ) : (
                    <span className="text-emerald-700 font-bold tracking-wider">NO TASK</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-64 bg-[#0a0c14]/95 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] z-50 overflow-hidden py-2 animate-fade-in">
                    {categories.map((cat) => {
                      const DropdownIcon = ICON_MAP[cat.icon] || Activity;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { setSelectedTaskObj(cat); setIsDropdownOpen(false); }}
                          className="flex items-center w-full gap-3 px-5 py-3 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left group"
                        >
                          <DropdownIcon className="w-4 h-4 text-emerald-600 group-hover:text-emerald-400 transition-colors" />
                          <span className="font-mono text-xs text-emerald-100/70 group-hover:text-emerald-100 uppercase tracking-wider">{cat.name}</span>
                        </button>
                      );
                    })}
                    <div className="border-t border-emerald-900/30 mt-2 pt-2">
                      <button 
                        onClick={() => { setIsDropdownOpen(false); setIsManageModalOpen(true); }}
                        className="flex items-center w-full gap-3 px-5 py-3 text-emerald-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-mono text-xs font-bold uppercase tracking-widest">Manage Engine</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsManageModalOpen(true)} 
                disabled={isActive} 
                className="text-emerald-500 hover:text-emerald-300 transition-all p-2.5 bg-[#090a0f]/60 backdrop-blur-md rounded-xl border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer disabled:opacity-50 hover:scale-105" 
                title="Add Category"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {isCapped && (
          <div className="flex items-center justify-center space-x-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-5 py-2.5 rounded-xl mb-6 animate-pulse text-xs font-mono font-bold mx-auto w-fit shadow-[0_0_20px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <AlertTriangle className="w-4 h-4" />
            <span>4-HOUR LIMIT REACHED. SESSION PAUSED.</span>
          </div>
        )}

        <div className="flex justify-center mb-12 relative z-10">
          <div className={`text-7xl md:text-[7rem] lg:text-[8rem] font-mono font-light tracking-tighter transition-all duration-500 ${
            isActive ? 'drop-shadow-[0_0_40px_rgba(16,185,129,0.6)] text-white scale-105' : 'text-slate-300 drop-shadow-2xl scale-100'
          }`}>
            {formatTime(seconds)}
          </div>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6 relative z-10">
          <button 
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || categories.length === 0 || isCapped}
            className={`flex-[3] flex items-center justify-center space-x-3 py-5 rounded-2xl font-bold font-mono tracking-widest transition-all cursor-pointer disabled:opacity-50 ${
              isActive 
                ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/40 border-t-amber-400/40 text-amber-400 hover:from-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)]' 
                : 'bg-[#090a0f]/80 backdrop-blur-md border border-emerald-700/50 border-t-emerald-400/40 border-l-emerald-400/20 text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-400 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            <span>{isActive ? 'PAUSE' : (seconds > 0 ? 'RESUME' : 'INITIALIZE')}</span>
          </button>
          
          <button
            onClick={handleReset}
            disabled={seconds === 0 || isSaving}
            className="flex-1 flex items-center justify-center py-5 rounded-2xl bg-[#090a0f]/60 backdrop-blur-md border border-red-900/40 border-t-red-500/20 border-l-red-500/20 text-red-500/70 hover:text-red-400 hover:bg-red-900/20 hover:border-red-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            title="Reset Node"
          >
            <RotateCcw className={`w-5 h-5 ${isActive ? 'animate-spin [animation-duration:8s]' : ''}`} />
          </button>

          <button 
            onClick={finishSession}
            disabled={seconds === 0 || isSaving}
            className="flex-[3] flex items-center justify-center space-x-3 bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#030712] border border-emerald-400 border-t-emerald-300 py-5 rounded-2xl font-bold font-mono tracking-widest hover:from-emerald-300 hover:to-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(16,185,129,0.4),inset_0_2px_2px_rgba(255,255,255,0.5)] cursor-pointer"
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