import { useEffect, useRef, useState } from "react";

export default function ImagePostWithMusic({ post, currentlyPlayingId, setCurrentlyPlayingId }) {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const isCurrent = currentlyPlayingId === post._id;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio ||!post.backgroundMusic) return;

    if (isCurrent) {
      audio.muted = isMuted;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isCurrent, isMuted, post.backgroundMusic]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!post.backgroundMusic) return;

    if (isCurrent) {
      setCurrentlyPlayingId(null); // pause if already playing
    } else {
      setIsMuted(false); // unmute on first click
      setCurrentlyPlayingId(post._id);
    }
  };

  return (
    <div className="w-full max-w- mx-auto bg-black rounded-xl overflow-hidden border border-[#374045] dark:border-[#374045] border-gray-200">
  <div className="w-full aspect-square relative flex justify-center items-center bg-black overflow-hidden group">
    <img
      src={post.mediaUrl}
      alt="Post"
      onClick={handlePlay}
      className="w-full h-full object-cover cursor-pointer"
    />

    {/* WhatsApp Gradient Overlay - Bottom for controls */}
    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

    {post.backgroundMusic && (
      <audio ref={audioRef} src={post.backgroundMusic} loop preload="auto" />
    )}

    {/* Play icon if not playing - WhatsApp Green */}
    {!isCurrent && post.backgroundMusic && (
      <button
        onClick={handlePlay}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="bg-[#25D366] text-white rounded-full w- h- flex items-center justify-center text- shadow-2xl hover:bg-[#1EBE5A] transition scale-100 hover:scale-110">
          ▶️
        </span>
        <span className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md">
          🎵 Tap to play music
        </span>
      </button>
    )}

    {/* Playing Indicator - Top Left */}
    {isCurrent && post.backgroundMusic && (
      <div className="absolute top-3 left-3 bg-[#075E54] text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
        <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse"></span>
        Playing Music
      </div>
    )}

    {/* Mute / Unmute - WhatsApp Style */}
    {isCurrent && post.backgroundMusic && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        className="absolute bottom-3 right-3 bg-[#202C33]/90 hover:bg-[#075E54] text-white rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-md border border-white/20 transition"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    )}

    {/* Music Note Badge - Bottom Left when muted/paused */}
    {post.backgroundMusic && !isCurrent && (
      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
        🎵 Music
      </div>
    )}
  </div>
</div>
  );
}