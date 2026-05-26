import { useEffect, useRef, useState } from "react";

export default function VideoPost({
  post,
  currentlyPlayingId,
  setCurrentlyPlayingId,
}) {
  const videoRef = useRef();
  const [isMuted, setIsMuted] = useState(false);

  const isCurrent = currentlyPlayingId === post._id;

  useEffect(() => {
    if (!videoRef.current) return;

    if (isCurrent) {
      videoRef.current.play();
      videoRef.current.muted = isMuted;
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isCurrent, isMuted]);

  const handlePlay = () => {
    if (!isCurrent) {
      setCurrentlyPlayingId(post._id);
    } else {
      setCurrentlyPlayingId(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-lg">
      <div className="relative group">
        {/* Video */}
        <video
          ref={videoRef}
          src={post.mediaUrl}
          controls
          muted={isMuted}
          onClick={handlePlay}
          className="w-full h-64 object-cover cursor-pointer"
        />

        {/* Mute / Unmute Button */}
        {isCurrent && (
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