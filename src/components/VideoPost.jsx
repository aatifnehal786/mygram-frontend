import { useEffect, useRef, useState } from "react";

export default function VideoPost({
  post,
  currentlyPlayingId,
  setCurrentlyPlayingId,
}) {
  const videoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);

  const isCurrent = currentlyPlayingId === post._id;

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (isCurrent) {
      video.muted = isMuted;

      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.log("Video play error:", err);
        }
      };

      playVideo();
    } else {
      video.pause();
      video.currentTime = 0;
    }

    return () => {
      video.pause();
    };
  }, [isCurrent, isMuted]);

  const handlePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (!isCurrent) {
        setCurrentlyPlayingId(post._id);

        await video.play();
      } else {
        video.pause();

        setCurrentlyPlayingId(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-black rounded-xl overflow-hidden shadow-lg">
      <div className="relative group">
        
        <video
          ref={videoRef}
          src={post.mediaUrl}
          loop
          playsInline
          muted={isMuted}
          onClick={handlePlay}
          className="w-full h-64 object-cover cursor-pointer"
        />

        {/* Mute / Unmute */}
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