import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, GithubAuthProvider } from "firebase/auth";
import { auth, provider } from "./firebase";
import Landing from "./components/Landing";
import Timer from "./components/Timer";
import Feed from "./components/Feed";   
import PlayerStats from "./components/PlayerStats"; // Imported new component

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  if (!user) {
    return <Landing onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-wider">
          VERTO<span className="text-emerald-500">.</span>
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium">
              {user.displayName ? user.displayName.split(" ")[0] : "Hacker"}
            </p>
            <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-wider mt-1">
              Sign Out
            </button>
          </div>
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Profile" className="w-10 h-10 rounded-full border border-emerald-500" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col">
          {/* Injected PlayerStats right here */}
          <PlayerStats uid={user.uid} />
          <Timer user={user} />
        </div>
        <div className="flex-1">
          <Feed />
        </div>
      </main>
      
    </div>
  );
}

export default App;