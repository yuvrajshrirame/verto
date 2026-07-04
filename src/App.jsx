import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, GithubAuthProvider } from "firebase/auth";
import { auth, provider } from "./firebase";
import Landing from "./components/Landing";
import Timer from "./components/Timer";
import Feed from "./components/Feed";   
import PlayerStats from "./components/PlayerStats";
import DailySyncModal from "./components/DailySyncModal";
import AnimatedBackground from "./components/AnimatedBackground";
import ProfileSettingsModal from "./components/ProfileSettingsModal";
import { DatabaseBackup, LogOut, X } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) localStorage.setItem("github_token", result.user.accessToken);
    } catch (error) { 
      console.error("Login Error:", error); 
    }
  };

  const executeSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem("github_token"); 
    setIsSignOutModalOpen(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0f1117]" />;
  if (!user) return <Landing onLogin={handleLogin} />;

  return (
    <>
      <AnimatedBackground />
      
      <div className="min-h-screen relative p-6 selection:bg-emerald-500/30 z-10 overflow-x-hidden md:overflow-hidden">
        
        <header className="flex justify-between items-center mb-6 max-w-5xl mx-auto border-b border-emerald-900/30 pb-4 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            VERTO<span className="text-emerald-500">.</span>
          </h1>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsSyncModalOpen(true)} 
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 rounded-lg font-mono text-xs font-bold cursor-pointer transition-colors"
            >
              <DatabaseBackup className="w-4 h-4 hidden sm:block" />
              <span>DAILY SYNC</span>
            </button>
            
            <div className="flex items-center space-x-4 border-l border-emerald-900/30 pl-4 sm:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-medium">
                  {user.displayName ? user.displayName.split(" ")[0] : "Hacker"}
                </p>
                <button 
                  onClick={() => setIsSignOutModalOpen(true)} 
                  className="text-emerald-700 hover:text-emerald-400 transition-colors text-[10px] font-mono uppercase tracking-widest mt-1 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
              <img 
                onClick={() => setIsProfileModalOpen(true)} 
                src={user.photoURL} 
                alt="Profile"
                className="w-9 h-9 rounded-full border border-emerald-900/50 cursor-pointer object-cover hover:border-emerald-400 transition-colors" 
              />
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto flex flex-col md:flex-row gap-5 md:h-[calc(100vh-120px)] md:min-h-[550px] pb-4">
          
          <div className="flex-1 w-full flex flex-col gap-5 md:h-full">
            <PlayerStats uid={user.uid} />
            <div className="flex-1 min-h-[400px] md:min-h-0 [&>div]:h-full">
              <Timer user={user} />
            </div>
          </div>

          <div className="flex-1 w-full md:h-full">
            <Feed user={user} />
          </div>
          
        </main>

        {isSyncModalOpen && <DailySyncModal user={user} onClose={() => setIsSyncModalOpen(false)} />}
        {isProfileModalOpen && <ProfileSettingsModal user={user} onClose={() => setIsProfileModalOpen(false)} />}
        
        {isSignOutModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4"
            onClick={() => setIsSignOutModalOpen(false)}
          >
            <div 
              className="bg-[#0f1117] border border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] w-full max-w-sm relative transform scale-100 transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsSignOutModalOpen(false)} 
                className="absolute top-4 right-4 text-emerald-700 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
      
              <div className="flex flex-col items-center text-center mt-2">
                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <LogOut className="w-8 h-8 text-emerald-400" />
                </div>
                
                <h2 className="text-xl font-mono font-bold text-white tracking-widest mb-2 uppercase">
                  Sign Out
                </h2>
                
                <p className="text-emerald-700/80 text-xs font-mono mb-8">
                  Are you sure you want to sign out?
                </p>
                
                <div className="flex w-full space-x-3">
                  <button 
                    onClick={() => setIsSignOutModalOpen(false)} 
                    className="flex-1 py-2.5 rounded-lg border border-emerald-900/50 text-emerald-400 font-mono font-bold text-xs tracking-wider hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={executeSignOut} 
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs tracking-wider hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
                  >
                    SIGN OUT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;