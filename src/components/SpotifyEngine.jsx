import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Disc, Radio, Link as LinkIcon, Volume2, VolumeX } from 'lucide-react';

const DEFAULT_SOOTHING_URI = "spotify:playlist:37i9dQZF1DWWQRwui0ExPn";

// Helper function to format milliseconds into mm:ss
const formatTime = (ms) => {
  if (!ms) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const SpotifyEngine = ({ token }) => {
  const [player, setPlayer] = useState(undefined);
  const [isPaused, setPaused] = useState(true);
  const [isActive, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // Custom Input State
  const [customInput, setCustomInput] = useState("");
  const [inputError, setInputError] = useState("");

  // New Telemetry States (Volume & Progress)
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!token) return;

    if (!document.getElementById("spotify-player-script")) {
      const script = document.createElement("script");
      script.id = "spotify-player-script";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Verto Audio Engine',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        setIsReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) {
          setActive(false);
          return;
        }
        setCurrentTrack(state.track_window.current_track);
        setPaused(state.paused);
        setActive(true);
        setDuration(state.duration);
        
        // Only override position if the user isn't currently scrubbing the progress bar
        if (!isDragging) {
            setPosition(state.position);
        }
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (player) player.disconnect();
    };
  }, [token]); // Removed isDragging from dependency array to prevent constant re-renders

  // Real-time Progress Bar Ticker
  useEffect(() => {
    let interval;
    if (isActive && !isPaused && !isDragging) {
      interval = setInterval(() => {
        setPosition((prev) => Math.min(prev + 1000, duration));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, duration, isDragging]);


  // --- PLAYBACK CONTROLS ---
  const executePlayback = async (uri, isContextContext = true) => {
    if (!deviceId || !token) return;
    
    const body = isContextContext 
      ? JSON.stringify({ context_uri: uri }) 
      : JSON.stringify({ uris: [uri] });

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });
    } catch (err) {
      console.error("Playback execution failed:", err);
    }
  };

  const handleTogglePlay = async () => {
    if (!deviceId || !token) return;
    const endpoint = isPaused ? 'play' : 'pause';
    try {
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(`Failed to ${endpoint}:`, err);
    }
  };

  const handleNextTrack = async () => {
    if (!deviceId || !token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to skip forward:", err);
    }
  };

  const handlePrevTrack = async () => {
    if (!deviceId || !token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to skip backward:", err);
    }
  };

  // --- VOLUME & SEEK HANDLERS ---
  const handleVolumeChange = async (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    if (player) await player.setVolume(val);
  };

  const toggleMute = async () => {
    if (isMuted) {
      setIsMuted(false);
      if (player) await player.setVolume(volume > 0 ? volume : 0.5);
    } else {
      setIsMuted(true);
      if (player) await player.setVolume(0);
    }
  };

  const handleSeekChange = (e) => {
    setIsDragging(true);
    setPosition(parseInt(e.target.value, 10));
  };

  const handleSeekEnd = async (e) => {
    const val = parseInt(e.target.value, 10);
    setIsDragging(false);
    if (!deviceId || !token) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${val}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to seek:", err);
    }
  };

  // --- INPUT PARSER ---
  const handleCustomPlay = () => {
    setInputError("");
    if (!customInput.trim()) return;

    let finalUri = customInput.trim();
    let isContext = true;

    if (finalUri.includes("spotify.com")) {
      try {
        const url = new URL(finalUri);
        const pathParts = url.pathname.split("/").filter(Boolean);
        
        if (pathParts.length >= 2) {
          const type = pathParts[0]; 
          const id = pathParts[1];
          finalUri = `spotify:${type}:${id}`;
          isContext = type !== 'track';
        } else {
          throw new Error("Invalid structure");
        }
      } catch (err) {
        setInputError("Invalid Spotify link format.");
        return;
      }
    } 
    else if (finalUri.startsWith("spotify:")) {
      isContext = !finalUri.includes(":track:");
    } else {
      setInputError("Please enter a valid Spotify URL or URI.");
      return;
    }

    executePlayback(finalUri, isContext);
    setCustomInput(""); 
  };

  if (!token) return null;

  return (
    <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-5 shadow-2xl flex flex-col w-full shrink-0">
        
        <div className="flex items-center justify-between mb-4 border-b border-emerald-900/30 pb-3">
            <div className="flex items-center space-x-2 text-emerald-500">
                <Radio className={`w-5 h-5 ${isActive ? 'animate-pulse text-emerald-400' : 'text-emerald-700'}`} />
                <span className="font-mono font-bold tracking-widest text-sm text-emerald-100">AUDIO ENGINE</span>
            </div>
            {isReady && !isActive && (
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/30">
                    AWAITING SIGNAL
                </span>
            )}
        </div>

        {/* Visualizer & Track Info */}
        <div className="flex items-center space-x-4 mb-4">
            {currentTrack?.album?.images[0]?.url ? (
                <img 
                  src={currentTrack.album.images[0].url} 
                  alt="Album Art" 
                  className="w-16 h-16 rounded-md border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] object-cover" 
                />
            ) : (
                <div className="w-16 h-16 rounded-md border border-emerald-900/50 bg-[#090a0f] flex items-center justify-center">
                    <Disc className="w-8 h-8 text-emerald-900" />
                </div>
            )}
            
            <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-emerald-100 font-bold truncate">
                    {currentTrack ? currentTrack.name : 'System Idle'}
                </span>
                <span className="text-emerald-700 font-mono text-xs truncate">
                    {currentTrack ? currentTrack.artists.map(a => a.name).join(', ') : 'Waiting for track data...'}
                </span>
            </div>
        </div>

        {/* Telemetry: Progress Bar */}
        <div className="flex items-center gap-3 mb-5 text-[10px] font-mono text-emerald-700">
            <span className="w-8 text-right">{formatTime(position)}</span>
            <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={position} 
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                disabled={!isActive}
                className="flex-1 h-1 bg-emerald-900/40 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 disabled:opacity-50 transition-all focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full" 
            />
            <span className="w-8">{formatTime(duration)}</span>
        </div>

        {/* Master Controls & Volume Layer */}
        <div className="flex items-center justify-between mb-6">
            
            {/* Volume Control */}
            <div className="flex items-center gap-2 w-28 group">
                <button 
                    onClick={toggleMute} 
                    disabled={!isReady}
                    className="text-emerald-700 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
                >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={isMuted ? 0 : volume} 
                    onChange={handleVolumeChange} 
                    disabled={!isReady}
                    className="w-full h-1 bg-emerald-900/40 rounded-lg appearance-none cursor-pointer accent-emerald-500 opacity-50 group-hover:opacity-100 disabled:opacity-30 transition-all focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full" 
                />
            </div>

            {/* Hardware Buttons */}
            <div className="flex items-center space-x-4">
                <button 
                    onClick={handlePrevTrack} 
                    disabled={!isActive}
                    className="p-2 text-emerald-600 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button 
                    onClick={handleTogglePlay} 
                    disabled={!isActive}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-30 transition-all cursor-pointer"
                >
                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                </button>

                <button 
                    onClick={handleNextTrack} 
                    disabled={!isActive}
                    className="p-2 text-emerald-600 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
                >
                    <SkipForward className="w-5 h-5" />
                </button>
            </div>

            {/* Empty Spacer to balance the flex container perfectly */}
            <div className="w-28"></div>
        </div>

        {/* Input Pipeline */}
        <div className="flex flex-col gap-3 mt-auto border-t border-emerald-900/30 pt-4">
            
            <button 
                onClick={() => executePlayback(DEFAULT_SOOTHING_URI, true)}
                disabled={!isReady}
                className="w-full flex items-center justify-center py-2 px-3 bg-[#090a0f] border border-emerald-900/50 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 group cursor-pointer"
            >
                <span className="font-mono text-[10px] font-bold text-emerald-600 group-hover:text-emerald-400 tracking-wider text-center uppercase">
                    Load Default Soothing Mix
                </span>
            </button>

            <div className="flex items-center gap-2">
                <input 
                    type="text"
                    value={customInput}
                    onChange={(e) => { setCustomInput(e.target.value); setInputError(""); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomPlay()}
                    placeholder="Paste Spotify Link or URI..."
                    className="flex-1 bg-[#090a0f] border border-emerald-900/50 rounded-lg py-1.5 px-3 text-emerald-100 font-mono text-xs focus:outline-none focus:border-emerald-500/50 placeholder-emerald-900/50 transition-colors"
                />
                <button
                    onClick={handleCustomPlay}
                    disabled={!isReady || !customInput.trim()}
                    className="p-1.5 bg-[#090a0f] border border-emerald-900/50 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>
            
            {inputError && (
                <span className="text-red-400/80 font-mono text-[10px] text-center -mt-1">
                    {inputError}
                </span>
            )}
        </div>

    </div>
  );
};

export default SpotifyEngine;