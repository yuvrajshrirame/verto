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
import SpotifyEngine from "./components/SpotifyEngine";
import GuildDashboard from "./components/GuildDashboard";
import { DatabaseBackup, LogOut, X, ChevronDown, Settings2 } from "lucide-react"; 

import { redirectToSpotifyAuth, getTokenFromCode } from "./spotify";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyExpired, setSpotifyExpired] = useState(false);
  const [isSpotifyMenuOpen, setIsSpotifyMenuOpen] = useState(false); 

  // Global Auth Error State
  const [authError, setAuthError] = useState(null);

  // Guilds Navigation State
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'guilds'

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
      const githubToken = credential?.accessToken;
      
      if (githubToken) {
        localStorage.setItem("github_token", githubToken);
      }
    } catch (error) { 
      console.error("Login Error:", error); 
    }
  };

  const unlinkSpotify = () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expires_at");
    setSpotifyToken(null);
    setSpotifyExpired(false);
    setIsSpotifyMenuOpen(false); 
  };

  const executeSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem("github_token"); 
    // Spotify tokens are intentionally NOT removed here to persist audio linkage
    setIsSignOutModalOpen(false);
  };

  const triggerAuthError = async (message) => {
    setAuthError(message);
    setIsSyncModalOpen(false);
    await signOut(auth);
    localStorage.removeItem("github_token");
  };

  if (loading) return <div className="min-h-screen bg-[#0f1117]" />;
  
  if (!user) {
    return (
      <>
        <Landing onLogin={handleLogin} />
        {authError && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in px-4">
            <div className="bg-[#0f1117] border border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] w-full max-w-sm text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 mb-4 animate-pulse">
                <span className="text-red-500 font-bold text-xl">!</span>
              </div>
              <h2 className="text-xl font-mono font-bold text-white tracking-widest mb-2 uppercase">Session Terminated</h2>
              <p className="text-red-400/80 text-xs font-mono mb-8">{authError}</p>
              <button 
                onClick={() => setAuthError(null)} 
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-mono font-bold text-xs tracking-wider hover:bg-red-500/20 transition-all cursor-pointer"
              >
                ACKNOWLEDGE & RE-AUTHENTICATE
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      
      <div className="min-h-screen relative p-6 selection:bg-emerald-500/30 z-10 overflow-x-hidden md:overflow-auto">
        
        <header className="flex justify-between items-center mb-6 max-w-5xl mx-auto border-b border-emerald-900/30 pb-4 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            VERTO<span className="text-emerald-500">.</span>
          </h1>
          
          <div className="flex items-center space-x-6">

            {/* Nav Links Block */}
            <div className="flex items-center space-x-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-1 mr-4 hidden sm:flex">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all ${currentView === 'dashboard' ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-700 hover:text-emerald-400'}`}
              >
                TERMINAL
              </button>
              <button 
                onClick={() => setCurrentView('guilds')}
                className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all ${currentView === 'guilds' ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-700 hover:text-emerald-400'}`}
              >
                GUILDS
              </button>
            </div>
            
            {!spotifyToken ? (
              <button 
                onClick={redirectToSpotifyAuth}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  spotifyExpired 
                    ? "text-amber-400 border border-amber-500/50 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    : "text-green-400 border border-green-500/50 bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                }`}
              >
                <span>{spotifyExpired ? "LINK EXPIRED - RE-AUTH" : "INIT SPOTIFY"}</span>
              </button>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsSpotifyMenuOpen(!isSpotifyMenuOpen)}
                  className="flex items-center space-x-2 text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                >
                  <span>AUDIO LINKED</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isSpotifyMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSpotifyMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSpotifyMenuOpen(false)} 
                    />
                    
                    <div className="absolute right-0 mt-2 w-48 bg-[#0f1117]/95 backdrop-blur-md border border-emerald-900/50 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.15)] z-50 p-2 flex flex-col gap-1">
                      <div className="px-2 py-1.5 mb-1 border-b border-emerald-900/30 flex items-center space-x-2">
                        <Settings2 className="w-3 h-3 text-emerald-700" />
                        <span className="text-[10px] text-emerald-700 font-mono tracking-widest uppercase">Engine Settings</span>
                      </div>
                      
                      <button
                        onClick={unlinkSpotify}
                        className="w-full text-left px-2 py-2 rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors font-mono text-xs font-bold flex items-center justify-between group cursor-pointer"
                      >
                        <span>UNLINK ENGINE</span>
                        <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button 
              onClick={() => setIsSyncModalOpen(true)} 
              className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 rounded-lg font-mono text-xs font-bold cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
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

        <main className="max-w-5xl mx-auto md:min-h-[calc(100vh-120px)] pb-10">
          
          {currentView === 'dashboard' ? (
            <div className="flex flex-col md:flex-row gap-5 h-full">
              <div className="flex-1 w-full flex flex-col gap-5">
                <PlayerStats uid={user.uid} />
                <div className="flex-1 min-h-[400px] [&>div]:h-full">
                  <Timer user={user} />
                </div>
                {spotifyToken && (
                  <SpotifyEngine token={spotifyToken} />
                )}
              </div>
              <div className="flex-1 w-full">
                <Feed user={user} />
              </div>
            </div>
          ) : (
            <GuildDashboard user={user} />
          )}
          
        </main>

        {isSyncModalOpen && <DailySyncModal user={user} onClose={() => setIsSyncModalOpen(false)} onAuthError={triggerAuthError} />}
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