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
import { DatabaseBackup, LogOut } from "lucide-react";

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
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        localStorage.setItem("github_token", credential.accessToken);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Failed to log in with GitHub.");
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
      
      <div className="min-h-screen relative p-6 selection:bg-emerald-500/30 z-10">
        <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto border-b border-emerald-900/30 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            VERTO<span className="text-emerald-500">.</span>
          </h1>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)] cursor-pointer"
            >
              <DatabaseBackup className="w-4 h-4" />
              <span>DAILY SYNC</span>
            </button>

            <div className="flex items-center space-x-4 border-l border-emerald-900/30 pl-6">
              <div className="text-right">
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
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="relative group focus:outline-none cursor-pointer"
                title="Account Settings"
              >
                <img 
                  src={user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker'} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border border-emerald-900/50 group-hover:border-emerald-400 transition-colors object-cover shrink-0" 
                />
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col">
            <PlayerStats uid={user.uid} />
            <Timer user={user} />
          </div>
          <div className="flex-1">
            <Feed user={user} />
          </div>
        </main>

        {isSyncModalOpen && (
          <DailySyncModal user={user} onClose={() => setIsSyncModalOpen(false)} />
        )}

        {isProfileModalOpen && (
          <ProfileSettingsModal user={user} onClose={() => setIsProfileModalOpen(false)} />
        )}

        {isSignOutModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setIsSignOutModalOpen(false)}
          >
            <div 
              className="bg-[#0f1117] border border-emerald-900/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 relative flex flex-col items-center text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                <LogOut className="w-6 h-6 text-emerald-400" />
              </div>
              
              <h2 className="text-lg font-bold text-white mb-2">Sign Out?</h2>
              <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
                You will need to sign back in with GitHub to access your focus logs and continue earning XP.
              </p>
              
              <div className="flex w-full space-x-3">
                <button
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold font-mono text-sm text-slate-400 bg-[#090a0f] border border-emerald-900/30 hover:bg-emerald-900/20 hover:text-white transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={executeSignOut}
                  className="flex-1 py-2.5 rounded-xl font-bold font-mono text-sm text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;