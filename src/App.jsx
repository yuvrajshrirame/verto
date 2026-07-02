import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, GithubAuthProvider } from "firebase/auth";
import { auth, provider } from "./firebase";
import Landing from "./components/Landing";
import Timer from "./components/Timer";
import Feed from "./components/Feed";   
import PlayerStats from "./components/PlayerStats";
import DailySyncModal from "./components/DailySyncModal";
import AnimatedBackground from "./components/AnimatedBackground"; // 1. Import it
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
      alert("Failed to log in with GitHub.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("github_token"); 
  };

  // 2. Remove the old background color class from the loading screen
  if (loading) return <div className="min-h-screen bg-[#030712]" />;
  if (!user) return <Landing onLogin={handleLogin} />;

  return (
    <>
      {/* 3. Mount the animated background */}
      <AnimatedBackground />
      
      {/* 4. Remove bg-[#050505] from the main wrapper so it becomes transparent */}
      <div className="min-h-screen relative p-6 selection:bg-emerald-500/30 z-10">
        <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto border-b border-emerald-900/30 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            VERTO<span className="text-emerald-500">.</span>
          </h1>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            >
              <DatabaseBackup className="w-4 h-4" />
              <span>DAILY SYNC</span>
            </button>

            <div className="flex items-center space-x-4 border-l border-emerald-900/30 pl-6">
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {user.displayName ? user.displayName.split(" ")[0] : "Hacker"}
                </p>
                <button onClick={handleLogout} className="text-emerald-700 hover:text-emerald-400 transition-colors text-[10px] font-mono uppercase tracking-widest mt-1">
                  Sign Out
                </button>
              </div>
              <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Profile" className="w-9 h-9 rounded-full border border-emerald-900/50" />
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
    </>
  );
}

export default App;