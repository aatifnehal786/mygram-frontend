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
    <div className="w-full max-w- mx-auto bg-black rounded-lg overflow-hidden">
      <div className="w-full aspect-square relative flex justify-center items-center bg-black overflow-hidden">
        <img
          src={post.mediaUrl}
          alt="Post"
          onClick={handlePlay}
          className="w-full h-full object-cover cursor-pointer"
        />

        {post.backgroundMusic && (
          <audio ref={audioRef} src={post.backgroundMusic} loop preload="auto" />
        )}

        {/* Play icon if not playing */}
        {!isCurrent && post.backgroundMusic && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="bg-black/50 text-white rounded-full p-4 text-xl">🎵</span>
          </button>
        )}

        {/* Mute / Unmute */}
        {isCurrent && post.backgroundMusic && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md"
          >
            {isMuted? "🔇" : "🔊"}
          </button>
        )}
      </div>
    </div>
  );
}