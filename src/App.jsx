import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";

// Import all our components
import Landing from "./components/Landing";
import Timer from "./components/Timer";
import Feed from "./components/Feed";   

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if someone is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Failed to log in.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // State 1: Loading (Blank screen while checking auth)
  if (loading) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  // State 2: Logged Out (Show the sleek Landing Page)
  if (!user) {
    return <Landing onLogin={handleLogin} />;
  }

  // State 3: Logged In (Show the Main Dashboard)
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      
      {/* Dashboard Header Bar */}
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-wider">
          VERTO<span className="text-emerald-500">.</span>
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium">{user.displayName.split(" ")[0]}</p>
            <button onClick={handleLogout} className="text-slate-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-wider mt-1">
              Sign Out
            </button>
          </div>
          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-emerald-500" />
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Side: The Timer Component */}
        <div className="flex-1">
          <Timer user={user} />
        </div>

        {/* Right Side: The Feed Component */}
        <div className="flex-1">
          <Feed />
        </div>

      </main>
      
    </div>
  );
}

export default App;