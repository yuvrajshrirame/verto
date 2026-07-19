import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, GithubAuthProvider } from "firebase/auth";
import { auth, provider } from "./firebase";
import Landing from "./components/Landing";
import Timer from "./components/Timer";
import Feed from "./components/Feed";   
import DailySyncModal from "./components/DailySyncModal";
import AnimatedBackground from "./components/AnimatedBackground";
import ProfileSettingsModal from "./components/ProfileSettingsModal";
import SpotifyEngine from "./components/SpotifyEngine";
import GuildDashboard from "./components/GuildDashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard"; 
import { DatabaseBackup, LogOut, X, Zap, Disc, Users, BarChart2 } from "lucide-react"; 

import { redirectToSpotifyAuth, getTokenFromCode } from "./spotify";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyExpired, setSpotifyExpired] = useState(false);

  const [authError, setAuthError] = useState(null);

  // --- WORKSPACE NAVIGATION ---
  const [currentView, setCurrentView] = useState('focus'); // 'focus', 'guilds', 'audio', 'analytics'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkSpotifyAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        window.history.replaceState({}, document.title, "/"); 
        const token = await getTokenFromCode(code);
        if (token) {
          setSpotifyToken(token);
          setSpotifyExpired(false);
        }
      } else {
        const savedToken = localStorage.getItem("spotify_token");
        const expiresAt = localStorage.getItem("spotify_token_expires_at");
        if (savedToken && expiresAt) {
          if (Date.now() > parseInt(expiresAt)) {
            localStorage.removeItem("spotify_token");
            localStorage.removeItem("spotify_token_expires_at");
            setSpotifyExpired(true);
          } else {
            setSpotifyToken(savedToken);
          }
        }
      }
    };
    checkSpotifyAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem("github_token", credential.accessToken);
      }
    } catch (error) { 
      console.error("Login Error:", error); 
    }
  };

  const executeSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem("github_token"); 
    setIsSignOutModalOpen(false);
  };

  const triggerAuthError = async (message) => {
    setAuthError(message);
    setIsSyncModalOpen(false);
    await signOut(auth);
    localStorage.removeItem("github_token");
  };

  if (loading) return <div className="min-h-screen bg-[#030712]" />;
  if (!user) return <Landing onLogin={handleLogin} />;

  const navItems = [
    { id: 'focus', icon: Zap, label: 'FOCUS NODE' },
    { id: 'guilds', icon: Users, label: 'GUILDS' },
    { id: 'audio', icon: Disc, label: 'AUDIO ENGINE' },
    { id: 'analytics', icon: BarChart2, label: 'ANALYTICS' },
  ];

  return (
    <>
      <AnimatedBackground />
      
      <div className="flex h-screen overflow-hidden selection:bg-emerald-500/30 z-10 relative">
        
        {/* === SIDEBAR NAVIGATION === */}
        <aside className="w-16 md:w-64 bg-[#030712]/80 backdrop-blur-xl border-r border-emerald-900/30 flex flex-col justify-between shrink-0 transition-all duration-300">
          <div>
            <div className="h-20 flex items-center justify-center md:justify-start md:px-8 border-b border-emerald-900/30">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider hidden md:block">
                VERTO<span className="text-emerald-500">.</span>
              </h1>
              <h1 className="text-xl font-bold text-white md:hidden">V<span className="text-emerald-500">.</span></h1>
            </div>

            <nav className="p-3 md:p-4 flex flex-col gap-2 mt-4 w-full">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer w-full text-left overflow-hidden ${
                    currentView === item.id 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'border border-transparent text-emerald-700 hover:text-emerald-400 hover:bg-emerald-950/30'
                  }`}
                  title={item.label}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${currentView === item.id ? 'animate-pulse' : ''}`} />
                  <span className="hidden md:block font-mono text-xs font-bold tracking-widest whitespace-nowrap truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-emerald-900/30">
             <div className="flex flex-col md:flex-row items-center md:space-x-3 p-2">
                <img 
                  onClick={() => setIsProfileModalOpen(true)} 
                  src={user.photoURL} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-emerald-900/50 cursor-pointer hover:border-emerald-400 transition-colors shrink-0" 
                />
                <div className="hidden md:flex flex-col flex-1 truncate">
                  <span className="text-white text-xs font-medium truncate">{user.displayName?.split(" ")[0] || "Hacker"}</span>
                  <button onClick={() => setIsSignOutModalOpen(true)} className="text-emerald-700 hover:text-emerald-400 text-[9px] font-mono uppercase tracking-widest text-left mt-0.5 cursor-pointer">
                    Sign Out
                  </button>
                </div>
             </div>
          </div>
        </aside>

        {/* === MAIN CONTENT WORKSPACE === */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          <header className="h-16 shrink-0 border-b border-emerald-900/30 flex items-center justify-end px-6 space-x-4 bg-[#030712]/50 backdrop-blur-sm">
            {!spotifyToken && (
              <button onClick={redirectToSpotifyAuth} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                <span>{spotifyExpired ? "AUDIO EXPIRED" : "INIT AUDIO"}</span>
              </button>
            )}
            <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
              <DatabaseBackup className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DAILY SYNC</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-6xl mx-auto h-full animate-fade-in">
              
              {/* MASTER LAYOUT: The Timer is now ALWAYS mounted so state is never lost */}
              <div className={currentView === 'focus' ? "flex flex-col xl:flex-row gap-6 h-full" : "h-full relative"}>

                {/* The Timer component itself determines if it should be Full Screen or a Floating Widget based on currentView */}
                <Timer user={user} isBackground={currentView !== 'focus'} />

                {currentView === 'focus' && (
                  <div className="flex-1 xl:max-w-md h-[500px] xl:h-full">
                    <Feed user={user} />
                  </div>
                )}

                {currentView === 'guilds' && <GuildDashboard user={user} />}
                
                {currentView === 'audio' && (
                  <div className="h-full flex items-center justify-center text-emerald-700 font-mono">
                    {spotifyToken ? <SpotifyEngine token={spotifyToken} /> : "INITIALIZE SPOTIFY ABOVE TO ACCESS AUDIO ENGINE."}
                  </div>
                )}

                {currentView === 'analytics' && <AnalyticsDashboard user={user} />}

              </div>

            </div>
          </div>
        </main>

        {isSyncModalOpen && <DailySyncModal user={user} onClose={() => setIsSyncModalOpen(false)} onAuthError={triggerAuthError} />}
        {isProfileModalOpen && <ProfileSettingsModal user={user} onClose={() => setIsProfileModalOpen(false)} />}
        
        {isSignOutModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4"
            onClick={() => setIsSignOutModalOpen(false)}
          >
            <div 
              className="bg-[#030712] border border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] w-full max-w-sm relative transform scale-100 transition-transform"
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
                <h2 className="text-xl font-mono font-bold text-white tracking-widest mb-2 uppercase">Sign Out</h2>
                <p className="text-emerald-700/80 text-xs font-mono mb-8">Are you sure you want to sign out?</p>
                <div className="flex w-full space-x-3">
                  <button onClick={() => setIsSignOutModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-emerald-900/50 text-emerald-400 font-mono font-bold text-xs tracking-wider hover:bg-emerald-500/10 transition-colors cursor-pointer">CANCEL</button>
                  <button onClick={executeSignOut} className="flex-1 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs tracking-wider hover:bg-emerald-500/20 transition-all cursor-pointer">SIGN OUT</button>
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