import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 
// 1. We import icons from Lucide
import { Play, Pause, Save, Zap } from 'lucide-react';

const Timer = ({ user }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState('DSA');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
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

  const toggleTimer = () => setIsActive(!isActive);

  const finishSession = async () => {
    setIsActive(false);
    if (seconds > 0) {
      setIsSaving(true);
      try {
        await addDoc(collection(db, "sessions"), {
          uid: user.uid,
          userName: user.displayName,
          userPhoto: user.photoURL,
          task: task,
          duration: seconds,
          timestamp: serverTimestamp()
        });
        setSeconds(0);
      } catch (error) {
        console.error("Error saving session: ", error);
        alert("Failed to save session.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-400 blur-sm opacity-50"></div>

      <div className="flex justify-between items-center mb-10 border-b border-slate-800/50 pb-4">
        <div className="flex items-center space-x-2">
          <Zap className={`w-5 h-5 ${isActive ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
          <h2 className="text-lg font-bold text-white uppercase tracking-widest">Focus Node</h2>
        </div>
        
        <select 
          value={task} 
          onChange={(e) => setTask(e.target.value)}
          disabled={isActive || isSaving}
          className="bg-slate-950 text-amber-400 font-mono text-sm border border-slate-800 rounded px-4 py-2 outline-none cursor-pointer disabled:opacity-50 appearance-none"
        >
          <option value="DSA">_DSA</option>
          <option value="Web Dev">_Web_Dev</option>
          <option value="GATE Prep">_GATE_Prep</option>
          <option value="Reading">_Reading</option>
        </select>
      </div>

      {/* The Clock - with conditional glowing effect */}
      <div className="flex justify-center mb-12">
        <div className={`text-7xl font-mono font-light tracking-tighter transition-all duration-500 ${
          isActive 
            ? 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-105' 
            : 'text-slate-300 drop-shadow-none scale-100'
        }`}>
          {formatTime(seconds)}
        </div>
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={toggleTimer}
          disabled={isSaving}
          className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold transition-all ${
            isActive 
              ? 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800' 
              : 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]'
          } disabled:opacity-50`}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          <span>{isActive ? 'PAUSE' : 'INITIALIZE'}</span>
        </button>
        
        <button 
          onClick={finishSession}
          disabled={seconds === 0 || isSaving}
          className="flex-1 flex items-center justify-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-4 rounded-xl font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'SYNCING...' : 'COMMIT WORK'}</span>
        </button>
      </div>
    </div>
  );
};

export default Timer;