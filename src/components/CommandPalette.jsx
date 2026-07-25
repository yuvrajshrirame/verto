import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Zap, Users, Disc, BarChart2, DatabaseBackup, User, LogOut, Terminal, ChevronRight, AtSign, Loader2 } from 'lucide-react';

const CommandPalette = ({ 
  setCurrentView, 
  setIsSyncModalOpen, 
  setIsProfileModalOpen, 
  setIsSignOutModalOpen,
  initAudio,
  setViewingProfile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // User Search States
  const [allPublicUsers, setAllPublicUsers] = useState(null); // Cache to avoid over-querying Firebase
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // The Command Library
  const commands = [
    { id: 'focus', icon: Zap, label: 'Access Focus Node', action: () => setCurrentView('focus'), category: 'Navigation' },
    { id: 'groups', icon: Users, label: 'Access Groups Matrix', action: () => setCurrentView('groups'), category: 'Navigation' },
    { id: 'audio', icon: Disc, label: 'Access Audio Engine', action: () => setCurrentView('audio'), category: 'Navigation' },
    { id: 'analytics', icon: BarChart2, label: 'Access Analytics Core', action: () => setCurrentView('analytics'), category: 'Navigation' },
    { id: 'sync', icon: DatabaseBackup, label: 'Force Daily Sync', action: () => setIsSyncModalOpen(true), category: 'System' },
    { id: 'init-audio', icon: Disc, label: 'Initialize Spotify Link', action: () => initAudio(), category: 'System' },
    { id: 'profile', icon: User, label: 'Modify Network Identity', action: () => setIsProfileModalOpen(true), category: 'System' },
    { id: 'signout', icon: LogOut, label: 'Terminate Connection (Sign Out)', action: () => setIsSignOutModalOpen(true), category: 'Danger' },
  ];

  // Determine Mode
  const isUserMode = searchQuery.startsWith('@');
  const userSearchString = isUserMode ? searchQuery.slice(1).toLowerCase() : '';

  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeListLength = isUserMode ? filteredUsers.length : filteredCommands.length;

  // Global Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50); 
    }
  }, [isOpen]);

  // Handle User Search Logic
  useEffect(() => {
    if (!isUserMode) return;

    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        let usersToFilter = allPublicUsers;
        
        // Only hit Firebase once per session to grab the global directory
        if (!usersToFilter) {
          const q = query(collection(db, "users"), where("isPublic", "==", true));
          const snap = await getDocs(q);
          usersToFilter = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllPublicUsers(usersToFilter);
        }
        
        // Client-side text heuristic filtering
        const filtered = usersToFilter.filter(u => {
          const usernameMatch = u.username && u.username.toLowerCase().includes(userSearchString);
          const nameMatch = u.displayName && u.displayName.toLowerCase().includes(userSearchString);
          return usernameMatch || nameMatch;
        }).slice(0, 8); // Limit to top 8 matches to keep UI clean
        
        setFilteredUsers(filtered);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    fetchUsers();
  }, [searchQuery, isUserMode, userSearchString, allPublicUsers]);


  // Handle Internal Keyboard Navigation
  const handleModalKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeListLength > 0) {
        setSelectedIndex((prev) => (prev + 1) % activeListLength);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeListLength > 0) {
        setSelectedIndex((prev) => (prev - 1 + activeListLength) % activeListLength);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isUserMode) {
        if (filteredUsers[selectedIndex]) {
          setViewingProfile({ uid: filteredUsers[selectedIndex].id });
          setIsOpen(false);
        }
      } else {
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-gradient-to-br from-[#1a1d24]/95 to-[#090a0f]/95 backdrop-blur-3xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent z-50" />

        {/* Input Header */}
        <div className="flex items-center px-4 py-4 border-b border-emerald-900/40 bg-[#030712]/40 relative z-10">
          <Terminal className="w-5 h-5 text-emerald-500 shrink-0 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or use @ to search users..."
            className="flex-1 bg-transparent border-none text-emerald-100 font-mono text-lg px-4 outline-none placeholder-emerald-900/60"
          />
          <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 bg-[#090a0f]/80 border border-emerald-900/50 rounded-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <span className="text-[10px] text-emerald-600 font-mono font-bold tracking-widest uppercase">ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 relative z-10">
          
          {isUserMode ? (
             // --- USER SEARCH MATRIX ---
             isSearchingUsers && filteredUsers.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center text-emerald-700/50 font-mono">
                  <Loader2 className="w-8 h-8 mb-3 animate-spin drop-shadow-sm" />
                  <span className="text-xs uppercase tracking-widest">Scanning Global Directory...</span>
                </div>
             ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center text-emerald-700/50 font-mono">
                  <User className="w-8 h-8 mb-3 drop-shadow-sm opacity-50" />
                  <span className="text-xs uppercase tracking-widest">No matching operators found.</span>
                </div>
             ) : (
               filteredUsers.map((usr, index) => {
                 const isSelected = index === selectedIndex;
                 return (
                   <button
                     key={usr.id}
                     onClick={() => {
                       setViewingProfile({ uid: usr.id });
                       setIsOpen(false);
                     }}
                     onMouseEnter={() => setSelectedIndex(index)}
                     className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-mono tracking-wide ${
                       isSelected 
                         ? 'bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/40 border-t-emerald-400/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                         : 'bg-transparent border border-transparent hover:bg-emerald-950/20'
                     }`}
                   >
                     <div className="flex items-center gap-4">
                       <img 
                         src={usr.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker'} 
                         alt="Avatar" 
                         className={`w-8 h-8 rounded-full border ${isSelected ? 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-emerald-900/50'}`}
                       />
                       <div className="flex flex-col items-start">
                          <span className={`text-sm font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-500/80'}`}>{usr.displayName}</span>
                          <span className={`text-[10px] flex items-center ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            <AtSign className="w-3 h-3 mr-0.5" />
                            {usr.username || `operator_${usr.id.substring(0,4)}`}
                          </span>
                       </div>
                     </div>
                     
                     {isSelected && (
                       <div className="flex items-center gap-2 text-emerald-400">
                         <span className="text-[9px] uppercase tracking-widest opacity-70">View Profile</span>
                         <ChevronRight className="w-4 h-4" />
                       </div>
                     )}
                   </button>
                 );
               })
             )
          ) : (
            // --- STANDARD COMMAND MATRIX ---
            filteredCommands.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-emerald-700/50 font-mono">
                <Search className="w-8 h-8 mb-3 drop-shadow-sm opacity-50" />
                <span className="text-xs uppercase tracking-widest">No valid commands found.</span>
              </div>
            ) : (
              filteredCommands.map((cmd, index) => {
                const isSelected = index === selectedIndex;
                const Icon = cmd.icon;
                const isDanger = cmd.category === 'Danger';

                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-mono text-sm tracking-wide ${
                      isSelected 
                        ? isDanger 
                          ? 'bg-gradient-to-r from-red-500/20 to-transparent border border-red-500/40 border-t-red-400/30 text-red-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                          : 'bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/40 border-t-emerald-400/30 text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                        : 'bg-transparent border border-transparent text-emerald-700 hover:text-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected && isDanger ? 'text-red-400' : isSelected ? 'text-emerald-400' : 'text-emerald-800'}`} />
                      <span>{cmd.label}</span>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-widest ${isDanger ? 'text-red-500/50' : 'text-emerald-500/50'}`}>
                          {cmd.category}
                        </span>
                        <ChevronRight className={`w-4 h-4 ${isDanger ? 'text-red-400' : 'text-emerald-400'}`} />
                      </div>
                    )}
                  </button>
                );
              })
            )
          )}
        </div>
        
        {/* Footer Hint */}
        <div className="px-4 py-3 border-t border-emerald-900/30 bg-[#030712]/60 flex items-center justify-between font-mono text-[10px] text-emerald-700 uppercase tracking-widest relative z-10">
            <span>Use ↑↓ arrows to navigate</span>
            <span>↵ Enter to execute</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;