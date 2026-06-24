import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Feed = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to the database in real-time
  useEffect(() => {
    // Create a query: look at "sessions", order by newest first, grab the last 20
    const q = query(
      collection(db, "sessions"), 
      orderBy("timestamp", "desc"), 
      limit(20)
    );

    // onSnapshot listens for live changes. It triggers immediately, and then again EVERY time new data is added.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedData = [];
      snapshot.forEach((doc) => {
        feedData.push({ id: doc.id, ...doc.data() });
      });
      setSessions(feedData);
      setLoading(false);
    });

    // Cleanup listener if the component unmounts
    return () => unsubscribe();
  }, []);

  // 2. Helper function to turn raw seconds into "1h 30m"
  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <div className="text-slate-500 font-mono text-sm animate-pulse">Loading activity...</div>;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/50 w-full max-w-md mx-auto mt-8">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
        <h2 className="text-lg font-semibold text-white">Live Activity Feed</h2>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {sessions.length === 0 ? (
          <p className="text-slate-500 text-sm font-mono text-center py-4">No activity yet. Be the first!</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-lg flex items-start space-x-4 hover:border-slate-700 transition-colors">
              
              {/* Profile Picture */}
              <img 
                src={session.userPhoto || 'https://via.placeholder.com/40'} 
                alt={session.userName} 
                className="w-10 h-10 rounded-full border border-slate-700"
              />
              
              {/* Activity Text */}
              <div className="flex-1">
                <p className="text-slate-300 text-sm">
                  <span className="font-semibold text-amber-400">{session.userName.split(" ")[0]}</span> completed a sprint
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded font-mono">
                    {session.task}
                  </span>
                  <span className="text-emerald-400 text-xs font-mono font-bold">
                    + {formatDuration(session.duration)}
                  </span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;