import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Disc, Radio } from 'lucide-react';

// Swap the placeholder string with your specific regional URI for this track
const GALAT_KARAM_URI = "spotify:track:6qy1l029lJaZiJg7Ag3avy"; 
const DO_I_WANNA_KNOW_URI = "spotify:track:5FVd6KXrgO9B3JPmC8OPst";

const SpotifyEngine = ({ token }) => {
  const [player, setPlayer] = useState(undefined);
  const [isPaused, setPaused] = useState(true);
  const [isActive, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

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
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (player) player.disconnect();
    };
  }, [token]);

  const playSpecificTrack = async (uri) => {
    if (!deviceId || !token) return;
    
    // This forcefully transfers playback to this web element and starts the track
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uris: [uri] })
    });
  };

  if (!token) return null;

  return (
    <div className="bg-[#0f1117]/60 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-5 shadow-2xl flex flex-col w-full shrink-0">
        
        {/* Engine Header */}
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

        {/* Now Playing Visualizer */}
        <div className="flex items-center space-x-4 mb-5">
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

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
            <button 
                onClick={() => player?.previousTrack()} 
                disabled={!isActive}
                className="p-2 text-emerald-600 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
            >
                <SkipBack className="w-5 h-5" />
            </button>

            <button 
                onClick={() => player?.togglePlay()} 
                disabled={!isActive}
                className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-30 transition-all cursor-pointer"
            >
                {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
            </button>

            <button 
                onClick={() => player?.nextTrack()} 
                disabled={!isActive}
                className="p-2 text-emerald-600 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
            >
                <SkipForward className="w-5 h-5" />
            </button>
        </div>

        {/* Hardware-Style Track Triggers */}
        <div className="grid grid-cols-2 gap-3 mt-auto border-t border-emerald-900/30 pt-4">
            <button 
                onClick={() => playSpecificTrack(DO_I_WANNA_KNOW_URI)}
                disabled={!isReady}
                className="flex items-center justify-center py-2 px-2 bg-[#090a0f] border border-emerald-900/50 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors disabled:opacity-50 group cursor-pointer"
            >
                <span className="font-mono text-[10px] font-bold text-emerald-700 group-hover:text-emerald-400 tracking-wider text-center">
                    DO I WANNA KNOW
                </span>
            </button>
            <button 
                onClick={() => playSpecificTrack(GALAT_KARAM_URI)} 
                disabled={!isReady}
                className="flex items-center justify-center py-2 px-2 bg-[#090a0f] border border-emerald-900/50 rounded-lg hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors disabled:opacity-50 group cursor-pointer"
            >
                <span className="font-mono text-[10px] font-bold text-emerald-700 group-hover:text-emerald-400 tracking-wider text-center">
                    GALAT KARAM
                </span>
            </button>
        </div>
    </div>
  );
};

export default SpotifyEngine;