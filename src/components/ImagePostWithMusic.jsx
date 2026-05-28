import { useEffect, useRef, useState } from "react";

export default function ImagePostWithMusic({ post, currentlyPlayingId, setCurrentlyPlayingId }) {
  const audioRef = useRef();
  const [isMuted, setIsMuted] = useState(false);

  const isCurrent = currentlyPlayingId === post._id;

useEffect(() => {
  const audio = audioRef.current;

  if (!audio) return;

  if (isCurrent) {
    audio.muted = isMuted;

    audio.play().catch((err) => {
      console.log(err);
    });
  } else {
    audio.pause();
    audio.currentTime = 0;
  }

  return () => {
    audio.pause();
  };
}, [isCurrent, isMuted]);

const handlePlay = async () => {
  if (!audioRef.current || !post.backgroundMusic) return;

  try {
    setCurrentlyPlayingId(post._id);

    audioRef.current.muted = false;

    await audioRef.current.play();
  } catch (err) {
    console.log("Playback error:", err);
  }
};

 return (
  <div className="w-200 max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-lg">
   

    <div className="relative group">
      {/* Image */}
      <img
  src={post.mediaUrl}
  alt="Post"
  onClick={handlePlay}
  className="w-full h-64 object-cover cursor-pointer"
/>
       {post.backgroundMusic && (
      <audio ref={audioRef} src={post.backgroundMusic} loop preload="auto"/>
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
