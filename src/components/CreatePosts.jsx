import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {apiFetch} from "../api/apiFetch";
import {useTheme} from "../contexts/ThemeContext";
import useUserStore from "../store/useUserStore";
export default function CreatePost() {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState("");
  const [musicFile, setMusicFile] = useState(null);
  const [musicName, setMusicName] = useState("");
  const [loading, setLoading] = useState(false);
  const {theme} = useTheme();
 
  const user = useUserStore((s) => s.loggedUser);
  const mediaRef = useRef(null);
  const musicRef = useRef(null);
  const navigate = useNavigate();
  const onClose = () => navigate("/");

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith("video")? "video" : "image");
  };

  const handleMusicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Music max 10MB");
      return;
    }
    setMusicFile(file);
    setMusicName(file.name);
  };

  const handleShare = async () => {
    if (!mediaFile) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("media", mediaFile);
    fd.append("caption", caption);
    fd.append("mediaType", mediaType);
    if (musicFile) fd.append("backgroundMusic", musicFile);

    try {
      const data = await apiFetch("/api/uploads/create", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      
      // data is already JSON, no need for .json()
      console.log(data); 

      if (data.success) {
        onClose?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
  <div className={`w-full max-w- max-h- rounded-2xl overflow-hidden flex flex-col shadow-2xl ${theme === 'dark' ? 'bg-[#202C33] text-white' : 'bg-white text-black'}`}>
    {/* Header - WhatsApp Style */}
    <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${theme === 'dark' ? 'bg-[#202C33] border-[#374045]' : 'bg-[#075E54] text-white border-[#075E54]'}`}>
      <button onClick={onClose} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${theme === 'dark' ? 'bg-[#2A3942] text-white hover:bg-[#374045]' : 'bg-white/20 text-white hover:bg-white/30'}`}>
        ✕
      </button>
      <h2 className="font-semibold text-">Create new post</h2>
      <button
        onClick={handleShare}
        disabled={!mediaFile || loading}
        className="bg-[#25D366] hover:bg-[#1EBE5A] text-white px-5 py-2 rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {loading ? "Sharing..." : "Share"}
      </button>
    </div>

    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
      {/* LEFT - Preview */}
      <div className={`w-full md:w-[60%] flex items-center justify-center aspect-square md:aspect-auto relative shrink-0 ${theme === 'dark' ? 'bg-black' : 'bg-[#0B141A]'}`}>
        {!mediaPreview ? (
          <div className="flex flex-col items-center text-white p-8 text-center">
            <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center text-4xl mb-4">📷</div>
            <p className="text-xl font-light mb-1">Drag photos and videos here</p>
            <p className="text-sm text-white/60 mb-4">Share a moment with your friends</p>
            <button
              onClick={() => mediaRef.current.click()}
              className="bg-[#25D366] hover:bg-[#1EBE5A] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition"
            >
              Select from computer
            </button>
          </div>
        ) : (
          <>
            {mediaType === "image" ? (
              <img src={mediaPreview} alt="preview" className="w-full h-full object-contain max-h-" />
            ) : (
              <video src={mediaPreview} controls autoPlay muted loop className="w-full h-full object-contain max-h-" />
            )}
            <button
              onClick={() => mediaRef.current.click()}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur"
            >
              Change
            </button>
            {mediaType === "video" && (
              <span className="absolute top-3 left-3 bg-[#25D366] text-white px-2.5 py-1 rounded-full text- font-semibold">VIDEO</span>
            )}
          </>
        )}
        <input ref={mediaRef} type="file" accept="image/*,video/*" hidden onChange={handleMediaChange} />
      </div>

      {/* RIGHT - Caption + Music */}
      <div className="w-full md:w-[40%] flex flex-col flex-1 min-h-">
        <div className="p-4 flex items-center gap-3">
          <img src={user?.profilePic || "/placeholder.svg"} className="w-9 h-9 rounded-full object-cover border-2 border-[#25D366]" />
          <div>
            <span className="font-semibold text-sm block">{user?.name || "username"}</span>
            <span className="text- text-[#8696A0]">Posting to feed</span>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          maxLength={2200}
          className={`w-full px-4 py-2 text-sm outline-none resize-none h- bg-transparent ${theme === 'dark' ? 'placeholder:text-[#8696A0]' : 'placeholder:text-[#8696A0]'}`}
        />

        <div className="px-4 flex justify-between items-center">
          <span className="text-xs text-[#8696A0]">{caption.length > 2000 ? "Almost full" : "Add hashtags, mention friends"}</span>
          <span className={`text-xs ${caption.length > 2000 ? "text-red-500 font-semibold" : "text-[#8696A0]"}`}>{caption.length}/2,200</span>
        </div>

        <div className={`border-t mt-3 ${theme === 'dark' ? 'border-[#374045]' : 'border-gray-200'}`} />

        {/* OPTIONAL BACKGROUND MUSIC */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-[#25D366]/10 rounded-full flex items-center justify-center text-base">🎵</span>
              <span className="text-sm font-medium">Add background music</span>
              <span className={`text- font-semibold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-[#2A3942] text-[#8696A0]' : 'bg-[#F0F2F5] text-[#8696A0]'}`}>Optional</span>
            </div>
            {!musicFile ? (
              <button onClick={() => musicRef.current.click()} className="text-xs font-semibold text-[#25D366] hover:text-[#1EBE5A]">Add</button>
            ) : (
              <button onClick={() => { setMusicFile(null); setMusicName(""); }} className="text-xs text-red-500 font-semibold">Remove</button>
            )}
          </div>

          {musicFile && (
            <div className={`mt-3 rounded-xl p-2.5 flex items-center gap-3 ${theme === 'dark' ? 'bg-[#2A3942]' : 'bg-[#F0F2F5]'}`}>
              <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center text-white text-sm shrink-0">♪</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{musicName}</p>
                <p className="text- text-[#8696A0]">Will play with post</p>
              </div>
              <audio controls className="h-8 w-24" src={musicFile ? URL.createObjectURL(musicFile) : ""} />
            </div>
          )}
          <input ref={musicRef} type="file" accept="audio/*" hidden onChange={handleMusicChange} />
        </div>

        <div className={`border-t ${theme === 'dark' ? 'border-[#374045]' : 'border-gray-200'}`} />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-[#8696A0]">📍</span>
            <input placeholder="Add location" className="w-full text-sm outline-none bg-transparent placeholder:text-[#8696A0]" />
          </div>
        </div>

        {/* WhatsApp Tip */}
        <div className="mt-auto p-4">
          <div className={`rounded-xl p-3 flex items-center gap-2 text-xs ${theme === 'dark' ? 'bg-[#005C4B]/30 text-[#A9E8C8]' : 'bg-[#DCF8C6] text-[#075E54]'}`}>
            <span>✅</span> Your post will appear in Home feed with WhatsApp styling.
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}