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
import GroupDashboard from "./components/GroupDashboard"; 
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CommandPalette from "./components/CommandPalette"; 
import UserProfileModal from "./components/UserProfileModal"; 
import { DatabaseBackup, LogOut, X, Zap, Disc, Users, BarChart2, Bug, Book } from "lucide-react"; 

import { redirectToSpotifyAuth, getTokenFromCode } from "./spotify";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  
  const [viewingProfile, setViewingProfile] = useState(null); 

  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyExpired, setSpotifyExpired] = useState(false);

  const [authError, setAuthError] = useState(null);

  const [currentView, setCurrentView] = useState('focus'); 

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
    { id: 'groups', icon: Users, label: 'GROUPS' }, 
    { id: 'audio', icon: Disc, label: 'AUDIO ENGINE' },
    { id: 'analytics', icon: BarChart2, label: 'ANALYTICS CORE' },
  ];

  const userPhoto = String(user?.photoURL || "");
  const isPlaceholder = !userPhoto || userPhoto.includes('dicebear');

  return (
    <>
      <AnimatedBackground />
      
      <div className="flex h-screen overflow-hidden selection:bg-emerald-500/30 z-10 relative">
        
        <aside className="w-16 md:w-64 bg-[#030712]/80 backdrop-blur-xl border-r border-emerald-900/30 flex flex-col justify-between shrink-0 transition-all duration-300">
          <div>
            <div className="h-20 flex items-center justify-center md:justify-start md:px-8 border-b border-emerald-900/30 relative">
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

              <a 
                href="https://docs.uraj.dev/verto" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer w-full text-left overflow-hidden border border-transparent text-emerald-700 hover:text-emerald-400 hover:bg-emerald-950/30"
                title="DOCUMENTATION"
              >
                <Book className="w-5 h-5 shrink-0" />
                <span className="hidden md:block font-mono text-xs font-bold tracking-widest whitespace-nowrap truncate">DOCUMENTATION</span>
              </a>
            </nav>
          </div>

          <div className="p-4 border-t border-emerald-900/30">
             <div className="flex flex-col md:flex-row items-center md:space-x-3 p-2">
                {isPlaceholder ? (
                  <div onClick={() => setIsProfileModalOpen(true)} className="w-8 h-8 rounded-full border border-emerald-900/50 flex items-center justify-center bg-[#090a0f] cursor-pointer hover:border-emerald-400 transition-colors shrink-0">
                    <Bug className="w-4 h-4 text-emerald-500" />
                  </div>
                ) : (
                  <img 
                    onClick={() => setIsProfileModalOpen(true)} 
                    src={userPhoto} 
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-emerald-900/50 cursor-pointer hover:border-emerald-400 transition-colors shrink-0 object-cover" 
                  />
                )}
                <div className="hidden md:flex flex-col flex-1 truncate">
                  <span className="text-white text-xs font-medium truncate">{user.displayName?.split(" ")[0] || "Hacker"}</span>
                  <button onClick={() => setIsSignOutModalOpen(true)} className="text-emerald-700 hover:text-emerald-400 text-[9px] font-mono uppercase tracking-widest text-left mt-0.5 cursor-pointer">
                    Sign Out
                  </button>
                </div>
             </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          <header className="h-16 shrink-0 border-b border-emerald-900/30 flex items-center justify-between px-6 bg-[#030712]/50 backdrop-blur-sm">
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-emerald-700 border border-emerald-900/30 px-3 py-1.5 rounded-lg bg-[#090a0f]/50">
              <span className="text-slate-400">Ctrl + K</span>
              <span>/</span>
              <span className="text-slate-400">Cmd + K</span>
              <span className="ml-1 uppercase tracking-widest">for Command Palette</span>
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              {!spotifyToken && (
                <button onClick={redirectToSpotifyAuth} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                  <span>{spotifyExpired ? "AUDIO EXPIRED" : "INIT AUDIO"}</span>
                </button>
              )}
              <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                <DatabaseBackup className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DAILY SYNC</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-6xl mx-auto h-full animate-fade-in">
              
              {/* === FIX: Hide the Focus Node instead of destroying it === */}
              <div className={`flex-col xl:flex-row gap-6 h-full ${currentView === 'focus' ? 'flex' : 'hidden'}`}>
                <div className="flex-[1.5] min-h-[500px]">
                  <Timer user={user} isBackground={currentView !== 'focus'} setCurrentView={setCurrentView} />
                </div>
                <div className="flex-1 xl:max-w-md h-[500px] xl:h-full">
                  <Feed user={user} />
                </div>
              </div>

              {currentView === 'groups' && <GroupDashboard user={user} onViewProfile={setViewingProfile} />}
              
              {currentView === 'audio' && (
                <div className="h-full flex items-center justify-center text-emerald-700 font-mono">
                  {spotifyToken ? <SpotifyEngine token={spotifyToken} /> : "INITIALIZE SPOTIFY ABOVE TO ACCESS AUDIO ENGINE."}
                </div>
              )}

              {currentView === 'analytics' && <AnalyticsDashboard user={user} />}

            </div>
          </div>
        </main>

        <CommandPalette 
          setCurrentView={setCurrentView}
          setIsSyncModalOpen={setIsSyncModalOpen}
          setIsProfileModalOpen={setIsProfileModalOpen}
          setIsSignOutModalOpen={setIsSignOutModalOpen}
          initAudio={redirectToSpotifyAuth}
          setViewingProfile={setViewingProfile} 
        />

        {isSyncModalOpen && <DailySyncModal user={user} onClose={() => setIsSyncModalOpen(false)} onAuthError={triggerAuthError} />}
        {isProfileModalOpen && <ProfileSettingsModal user={user} onClose={() => setIsProfileModalOpen(false)} />}
        
        {viewingProfile && (
          <UserProfileModal 
            profileContext={viewingProfile} 
            currentUser={user} 
            onClose={() => setViewingProfile(null)} 
          />
        )}

        {isSignOutModalOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4"
            onClick={() => setIsSignOutModalOpen(false)}
          >
            <div 
              className="bg-gradient-to-br from-[#1a1d24]/90 to-[#090a0f]/95 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full max-w-sm relative transform scale-100 transition-transform overflow-hidden p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent z-50" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-emerald-500 blur-xl opacity-20" />

              <button 
                onClick={() => setIsSignOutModalOpen(false)} 
                className="absolute top-5 right-5 p-2 rounded-xl bg-[#090a0f]/50 border border-emerald-900/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] z-10"
              >
                <X className="w-4 h-4" />
              </button>
      
              <div className="flex flex-col items-center text-center mt-2 relative z-10">
                <div className="p-4 rounded-2xl mb-6 bg-[#090a0f]/80 border border-emerald-900/50 border-t-emerald-500/30 border-l-emerald-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <LogOut className="w-8 h-8 text-emerald-400 drop-shadow-md" />
                </div>
                
                <h2 className="text-xl font-mono font-bold text-white tracking-widest mb-2 uppercase drop-shadow-md">
                  Sign Out
                </h2>
                
                <p className="text-emerald-600/80 text-xs font-mono mb-8 uppercase tracking-wider">
                  Disconnect from the mainframe?
                </p>
                
                <div className="flex w-full gap-4">
                  <button 
                    onClick={() => setIsSignOutModalOpen(false)} 
                    className="flex-1 py-3.5 rounded-xl bg-[#090a0f]/60 backdrop-blur-md border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 text-emerald-500 font-mono font-bold text-xs tracking-wider hover:text-emerald-400 hover:border-emerald-400/50 transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] uppercase hover:scale-105"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={executeSignOut} 
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-b from-red-500/20 to-red-600/10 border border-red-500/40 border-t-red-400/40 text-red-400 font-mono font-bold text-xs tracking-widest hover:from-red-500/30 transition-all cursor-pointer shadow-[0_4px_15px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] uppercase hover:scale-105"
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