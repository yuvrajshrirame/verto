import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";

function App() {
  // This state variable holds the user's data once they log in
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This hook listens to Firebase to see if someone is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // The function that triggers the Google pop-up
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Failed to log in. Check the console for details.");
    }
  };

  // The function to log out
  const handleLogout = async () => {
    await signOut(auth);
  };

  // 1. Show a blank screen for a split second while Firebase checks auth state
  if (loading) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // 2. If no user is found, show the Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-wider mb-2">
            VERTO<span className="text-amber-400">.</span>
          </h1>
          <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
            Proof of Work {'>'} Proof of Presence
          </p>
        </div>
        
        <button 
          onClick={handleLogin}
          className="bg-amber-400 text-slate-950 px-8 py-3 rounded font-bold hover:bg-amber-300 transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  // 3. If the user IS logged in, show this temporary Welcome Screen
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 text-center px-4">
      
      {/* User Profile Picture from Google */}
      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
         <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Welcome back, <span className="text-amber-400">{user.displayName.split(" ")[0]}</span>
        </h2>
        <p className="text-slate-400 font-mono text-sm">Authentication successful.</p>
      </div>

      <button 
        onClick={handleLogout}
        className="mt-8 text-slate-500 hover:text-white transition-colors underline font-mono text-xs uppercase tracking-wider"
      >
        Sign Out
      </button>
    </div>
  );
}

export default App;