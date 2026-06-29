import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, GithubAuthProvider } from "firebase/auth";
import { auth, provider } from "./firebase";
import Landing from "./components/Landing";
import Timer from "./components/Timer";
import Feed from "./components/Feed";   
import PlayerStats from "./components/PlayerStats";
import DailySyncModal from "./components/DailySyncModal";
import { DatabaseBackup } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

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
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("github_token"); 
  };

  if (loading) return <div className="min-h-screen bg-[#050505]" />;
  if (!user) return <Landing onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#050505] p-6 selection:bg-emerald-500/30">
      
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-wider">
          VERTO<span className="text-emerald-500">.</span>
        </h1>
        
        <div className="flex items-center space-x-6">
          {/* New End of Day Sync Button */}
          <button 
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors font-mono text-xs font-bold"
          >
            <DatabaseBackup className="w-4 h-4" />
            <span>DAILY SYNC</span>
          </button>

          <div className="flex items-center space-x-4 border-l border-slate-800 pl-6">
            <div className="text-right">
              <p className="text-white text-sm font-medium">
                {user.displayName ? user.displayName.split(" ")[0] : "Hacker"}
              </p>
              <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mt-1">
                Sign Out
              </button>
            </div>
            <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Profile" className="w-9 h-9 rounded-full border border-slate-700" />
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
    </div>
  );
}

export default App;