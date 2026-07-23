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

  // Telemetry States
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
        
        if (!isDragging) {
            setPosition(state.position);
        }
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (player) player.disconnect();
    };
  }, [token]); 

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

  // Calculate Gradient Percentages
  const progressPercent = duration ? (position / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  if (!token) return null;

  return (
    // METALLIC GLASS UPGRADE: Deep blur, dual-tone metallic gradient, specular edge highlights
    <div className="bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] flex flex-col w-full shrink-0 relative overflow-hidden">
        
        {/* Subtle Top Inner Glint */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        <div className="flex items-center justify-between mb-5 border-b border-emerald-900/40 pb-4 relative z-10">
            <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                  <Radio className={`w-4 h-4 ${isActive ? 'animate-pulse text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-emerald-700'}`} />
                </div>
                <span className="font-mono font-bold tracking-widest text-sm text-emerald-100 drop-shadow-sm">AUDIO ENGINE</span>
            </div>
            {isReady && !isActive && (
                <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-amber-500/30 tracking-widest uppercase">
                    Awaiting Signal
                </span>
            )}
        </div>

        {/* Visualizer & Track Info */}
        <div className="flex items-center space-x-4 mb-5 relative z-10">
            {currentTrack?.album?.images[0]?.url ? (
                <div className="w-16 h-16 rounded-xl border border-emerald-900/50 border-t-emerald-500/30 border-l-emerald-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden shrink-0">
                  <img 
                    src={currentTrack.album.images[0].url} 
                    alt="Album Art" 
                    className="w-full h-full object-cover" 
                  />
                </div>
            ) : (
                <div className="w-16 h-16 rounded-xl border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 bg-[#090a0f]/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                    <Disc className="w-8 h-8 text-emerald-900/50" />
                </div>
            )}
            
            <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-emerald-100 font-bold truncate drop-shadow-sm text-lg">
                    {currentTrack ? currentTrack.name : 'System Idle'}
                </span>
                <span className="text-emerald-600 font-mono text-xs truncate tracking-wider">
                    {currentTrack ? currentTrack.artists.map(a => a.name).join(', ') : 'Waiting for track data...'}
                </span>
            </div>
        </div>

        {/* Telemetry: Progress Bar */}
        <div className="flex items-center gap-3 mb-6 text-[10px] font-mono text-emerald-600 relative z-10">
            <span className="w-8 text-right drop-shadow-sm">{formatTime(position)}</span>
            <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={position} 
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                disabled={!isActive}
                style={{ 
                    background: `linear-gradient(to right, #34d399 ${progressPercent}%, #030712 ${progressPercent}%)` 
                }}
                className="flex-1 h-1.5 bg-[#030712] rounded-lg appearance-none cursor-pointer disabled:opacity-50 transition-all focus:outline-none border border-emerald-900/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.8)] hover:[&::-webkit-slider-thumb]:scale-125 hover:[&::-webkit-slider-thumb]:bg-emerald-300 [&::-webkit-slider-thumb]:transition-all" 
            />
            <span className="w-8 drop-shadow-sm">{formatTime(duration)}</span>
        </div>

        {/* Master Controls & Volume Layer */}
        <div className="flex items-center justify-between mb-8 relative z-10">
            
            {/* Volume Control */}
            <div className="flex items-center gap-2 w-28 group bg-[#030712]/40 p-2 rounded-lg border border-emerald-900/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <button 
                    onClick={toggleMute} 
                    disabled={!isReady}
                    className="text-emerald-700 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
                >
                    {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]" />}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={isMuted ? 0 : volume} 
                    onChange={handleVolumeChange} 
                    disabled={!isReady}
                    style={{ 
                        background: `linear-gradient(to right, #34d399 ${volumePercent}%, transparent ${volumePercent}%)` 
                    }}
                    className="w-full h-1 bg-[#090a0f] rounded-lg appearance-none cursor-pointer opacity-70 group-hover:opacity-100 disabled:opacity-30 transition-all focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-150 hover:[&::-webkit-slider-thumb]:bg-emerald-300 [&::-webkit-slider-thumb]:transition-all" 
                />
            </div>

            {/* Hardware Buttons (Machined Style) */}
            <div className="flex items-center space-x-5">
                <button 
                    onClick={handlePrevTrack} 
                    disabled={!isActive}
                    className="p-2 text-emerald-600 hover:text-emerald-300 hover:scale-110 disabled:opacity-30 transition-all cursor-pointer drop-shadow-sm"
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button 
                    onClick={handleTogglePlay} 
                    disabled={!isActive}
                    className="p-3.5 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/40 border-t-emerald-400/50 rounded-full text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] disabled:opacity-30 cursor-pointer"
                >
                    {isPaused ? <Play className="w-5 h-5 fill-current ml-0.5 drop-shadow-md" /> : <Pause className="w-5 h-5 fill-current drop-shadow-md" />}
                </button>

                <button 
                    onClick={handleNextTrack} 
                    disabled={!isActive}
                    className="p-2 text-emerald-600 hover:text-emerald-300 hover:scale-110 disabled:opacity-30 transition-all cursor-pointer drop-shadow-sm"
                >
                    <SkipForward className="w-5 h-5" />
                </button>
            </div>

            <div className="w-28"></div>
        </div>

        {/* Input Pipeline */}
        <div className="flex flex-col gap-3 mt-auto border-t border-emerald-900/40 pt-5 relative z-10">
            
            <button 
                onClick={() => executePlayback(DEFAULT_SOOTHING_URI, true)}
                disabled={!isReady}
                className="w-full flex items-center justify-center py-3 px-3 bg-[#090a0f]/60 backdrop-blur-md border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 rounded-xl hover:border-emerald-400/50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] disabled:opacity-50 group cursor-pointer"
            >
                <span className="font-mono text-[10px] font-bold text-emerald-600 group-hover:text-emerald-300 tracking-wider text-center uppercase transition-colors">
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
                    className="flex-1 bg-[#030712]/80 border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl py-2 px-3 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500/80 transition-colors placeholder-emerald-900/60"
                />
                <button
                    onClick={handleCustomPlay}
                    disabled={!isReady || !customInput.trim()}
                    className="p-2 bg-[#090a0f]/80 border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 rounded-xl hover:border-emerald-500/60 hover:text-emerald-400 text-emerald-600 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] disabled:opacity-50 cursor-pointer"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>
            
            {inputError && (
                <span className="text-red-400/90 font-mono text-[10px] text-center mt-1 drop-shadow-md">
                    {inputError}
                </span>
            )}
        </div>

    </div>
  );
};

export default SpotifyEngine;