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
    <div className="image-post">
      {post.backgroundMusic && (
        <audio ref={audioRef} src={`http://localhost:8000/${post.backgroundMusic}`} />
      )}

      <div className="image-post-with-music" style={{ position: "relative" }}>
        <img
          className="post-image"
          src={`http://localhost:8000/${post.mediaUrl}`}
          alt="Post"
          onClick={handlePlay}
          style={{ cursor: "pointer" }}
        />

        {isCurrent && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        )}
      </div>
    </div>
  );
}
