import { useEffect, useRef, useState } from "react";

export default function VideoPost({ post, currentlyPlayingId, setCurrentlyPlayingId }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true); // start muted like Instagram
  const isCurrent = currentlyPlayingId === post._id;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isCurrent) {
      video.muted = isMuted;
      video.play().catch(() => {});
    } else {
      video.pause();
      // don't reset currentTime - keep thumbnail
    }
  }, [isCurrent, isMuted]);

  useEffect(() => {
    return () => {
      if (videoRef.current) videoRef.current.pause();
    };
  }, []);

  const handlePlay = () => {
    if (isCurrent) {
      // if playing, toggle mute on click (insta behavior) or pause
      setIsMuted(!isMuted);
    } else {
      setCurrentlyPlayingId(post._id);
      setIsMuted(false);
    }
  };

  return (
    <div className="w-full max-w- mx-auto bg-black rounded-lg overflow-hidden">
      <div className="w-full aspect-square relative flex justify-center items-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={post.mediaUrl}
          loop
          playsInline
          muted
          onClick={handlePlay}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Mute Button - always show like Instagram */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isCurrent) {
              setCurrentlyPlayingId(post._id);
              setIsMuted(false);
            } else {
              setIsMuted(!isMuted);
            }
          }}
          className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-md transition"
        >
          {isMuted? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}