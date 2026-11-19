import { useEffect, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { format } from "date-fns";

export default function VideoPost({ post, currentlyPlayingId, setCurrentlyPlayingId }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true); // start muted like Instagram
  const isCurrent = currentlyPlayingId === post._id;
  const theme = useTheme();

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
    <div className={`w-full max-w- mx-auto rounded-2xl overflow-hidden shadow-sm border ${theme === 'dark' ? 'bg-[#202C33] border-[#374045]' : 'bg-white border-gray-200'}`}>
  {/* Header - WhatsApp Style - Add this above video if you don't have it */}
  <div className="flex items-center gap-3 px-3 py-2.5">
    {/* <img src={post.user?.profilePic || post.author?.profilePic || "/placeholder.svg"} className="w-9 h-9 rounded-full object-cover border-2 border-[#25D366]" /> */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate">{post.user?.username || post.author?.username || "username"}</p>
      <p className="text- text-[#8696A0]">{post.createdAt ? format(new Date(post.createdAt), "MMM d, HH:mm") : "Just now"} • MyGram</p>
    </div>
    <button className="text-[#8696A0] hover:text-black dark:hover:text-white text-lg leading-none">⋮</button>
  </div>

  <div className="w-full aspect-square relative flex justify-center items-center bg-black overflow-hidden group cursor-pointer" onClick={handlePlay}>
    <video
      ref={videoRef}
      src={post.mediaUrl}
      loop
      playsInline
      muted
      className="w-full h-full object-cover"
    />

    {/* Center Play Overlay - WhatsApp Style */}
    {!isCurrent && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
        <div className="w- h- bg-black/60 backdrop-blur rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition">
          <span className="text-white text- ml-1">▶</span>
        </div>
      </div>
    )}

    {/* Bottom Gradient + Info */}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-3 pointer-events-none">
      <p className="text-white text- line-clamp-2 drop-shadow">{post.caption || ""}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="bg-[#25D366] text-white text- font-bold px-2 py-0.5 rounded-full">REEL</span>
        <span className="text-white/80 text-">🎵 Original audio</span>
      </div>
    </div>

    {/* Mute Button - WhatsApp Style */}
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
      className="absolute bottom-3 right-3 bg-black/60 hover:bg-[#25D366] text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-md transition z-10 text-"
    >
      {isMuted ? "🔇" : "🔊"}
    </button>

    {/* Top Right Duration / Views */}
    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
      <span className="text-white text- font-medium">VIDEO</span>
    </div>
  </div>

  {/* Footer Actions - WhatsApp Style */}
  <div className="flex items-center gap-1 px-2 py-2">
    <button className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center justify-center text- transition">❤️</button>
    <button className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center justify-center text- transition">💬</button>
    <button className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center justify-center text- transition">↗️</button>
    <div className="flex-1" />
    <span className="text-xs text-[#8696A0] pr-2">{post.likes?.length || 0} likes • {post.comments?.length || 0} comments</span>
  </div>
</div>
  );
}