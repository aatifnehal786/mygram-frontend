import { useEffect, useRef, useState } from "react";

export default function ImagePostWithMusic({ post, currentlyPlayingId, setCurrentlyPlayingId, videoRef }) {
  const audioRef = useRef();
  const [isMuted, setIsMuted] = useState(false);

  const isCurrent = currentlyPlayingId === post._id;

  useEffect(() => {
    if (!audioRef.current) return;

    if (isCurrent) {
      audioRef.current.play();
      audioRef.current.muted = isMuted;
      if (videoRef?.current) {
        videoRef.current.pause();
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isCurrent, isMuted, videoRef]);

  const handlePlay = () => {
    if (!isCurrent) {
      setCurrentlyPlayingId(post._id);
    } else {
      setCurrentlyPlayingId(null);
    }
  };

 return (
  <div className="w-full max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-lg">
    {post.backgroundMusic && (
      <audio ref={audioRef} src={post.backgroundMusic} />
    )}

    <div className="relative group">
      {/* Image */}
      <img
        src={post.mediaUrl}
        alt="Post"
        onClick={handlePlay}
        className="w-full h-auto object-cover cursor-pointer 
                   transition-transform duration-300 group-hover:scale-[1.01]"
      />

      {/* Play overlay (optional but 🔥) */}
      {!isPlaying && post.backgroundMusic && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-black/30 opacity-0 group-hover:opacity-100
                        transition-opacity duration-300">
          <div className="text-white text-5xl">▶</div>
        </div>
      )}

      {/* Mute / Unmute Button */}
      {isCurrent && post.backgroundMusic && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-3 right-3
                     bg-black/60 hover:bg-black/80
                     text-white text-lg
                     rounded-full px-3 py-2
                     backdrop-blur-md
                     transition-all duration-200"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      )}
    </div>
  </div>
);

}
