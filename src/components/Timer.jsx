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

  // Handle clicking outside custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Timer Interval
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
          // We STILL save the specific color to Firestore here so Analytics works, 
          // even though the UI stays Emerald!
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
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[9999] bg-[#030712]/95 backdrop-blur-xl border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] p-4 rounded-2xl flex items-center gap-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105 hover:border-emerald-400 transition-shadow transition-colors duration-300'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="opacity-30 hover:opacity-100 transition-opacity flex items-center -ml-1 pr-1" title="Drag to move">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        {/* Hardcoded Emerald Icon Box */}
        <div className="p-2.5 rounded-lg bg-[#0f1117] border border-emerald-900/50 text-emerald-400">
          <SelectedIcon className="w-5 h-5" />
        </div>
        
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[9px] text-emerald-600 font-mono uppercase tracking-widest leading-none mb-1.5 truncate max-w-[120px]">
            {selectedTaskObj?.name || 'NODE ACTIVE'}
          </span>
          <span className={`text-xl font-mono font-bold leading-none tracking-wider ${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-105 transition-all' : 'text-slate-500 scale-100'}`}>
            {formatTime(seconds)}
          </span>
        </div>

        <div className="flex items-center gap-2 border-l border-emerald-900/50 pl-4 ml-2" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || isCapped}
            className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:scale-110 p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title={isActive ? "Pause Node" : "Resume Node"}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          
          <button
            onClick={finishSession}
            disabled={seconds === 0 || isSaving}
            className="text-[#030712] bg-emerald-500 hover:bg-emerald-400 hover:scale-110 p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
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
      <div className="flex-[1.5] w-full min-h-[500px] bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        
        {/* Hardcoded Emerald Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-emerald-400 blur-sm opacity-50" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-emerald-900/30 pb-4 gap-4">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 transition-colors duration-500 ${isActive ? 'animate-pulse text-emerald-400' : 'text-emerald-700'}`} />
            <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono">Focus Node</h2>
          </div>
          
          <div className="flex items-center w-full sm:w-auto space-x-2">
            <div className="flex space-x-2 w-full sm:w-auto items-center relative">
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => !isActive && !isSaving && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isActive || isSaving}
                  className="flex items-center justify-between w-48 bg-[#030712]/80 border border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-400 font-mono text-sm hover:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {selectedTaskObj ? (
                    <div className="flex items-center gap-2 truncate">
                      {/* Dropdown Display Icon - Emerald */}
                      <SelectedIcon className="w-4 h-4 shrink-0 text-emerald-400" />
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
                          <DropdownIcon className="w-4 h-4 text-emerald-400" />
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
          {/* Reverted back to the Emerald drop shadow */}
          <div className={`text-7xl md:text-8xl font-mono font-light tracking-tighter transition-all duration-500 ${
            isActive ? 'drop-shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-105' : 'text-slate-300 scale-100'
          }`}>
            {formatTime(seconds)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            disabled={isSaving || categories.length === 0 || isCapped}
            className={`flex-[3] flex items-center justify-center space-x-2 py-4 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 ${
              isActive 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
            }`}
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