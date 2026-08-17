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
      <div className="bg-white w-full max-w- rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onClose} className="text-xl">✕</button>
          <h2 className="font-semibold text-lg">Create new post</h2>
          <button
            onClick={handleShare}
            disabled={!mediaFile || loading}
            className="text-[#0095f6] font-semibold text-sm disabled:opacity-40"
          >
            {loading? "Sharing..." : "Share"}
          </button>
        </div>

        <div className="flex flex-col md:flex-row min-h-">
          {/* LEFT - Preview - THIS WAS BROKEN */}
          <div className="w-full md:w-[60%] bg-black flex items-center justify-center aspect-square md:aspect-auto relative">
            {!mediaPreview? (
              <div className="flex flex-col items-center text-white p-8 text-center">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-xl font-light mb-4">Drag photos and videos here</p>
                <button
                  onClick={() => mediaRef.current.click()}
                  className="bg-[#0095f6] text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
                >
                  Select from computer
                </button>
              </div>
            ) : (
              <>
                {mediaType === "image"? (
                  <img src={mediaPreview} alt="preview" className="w-20 h-20 object-contain" />
                ) : (
                  <video src={mediaPreview} controls autoPlay muted loop className="w-20 h-20 object-contain" />
                )}
                <button
                  onClick={() => mediaRef.current.click()}
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full text-xs"
                >
                  Change
                </button>
              </>
            )}
            <input ref={mediaRef} type="file" accept="image/*,video/*" hidden onChange={handleMediaChange} />
          </div>

          {/* RIGHT - Caption + Music */}
          <div className="w-full md:w-[40%] flex flex-col">
            <div className="p-4 flex items-center gap-3">
              <img src={user?.profilePic} className="w-7 h-7 rounded-full" />
              <span className="font-semibold text-sm">{user?.name || "username"}</span>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              maxLength={2200}
              className="w-full px-4 py-2 text-sm outline-none resize-none h- placeholder:text-gray-500"
            />

            <div className="px-4 flex justify-end">
              <span className="text-xs text-gray-400">{caption.length}/2,200</span>
            </div>

            <div className="border-t border-gray-200 mt-2" />

            {/* OPTIONAL BACKGROUND MUSIC */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎵</span>
                  <span className="text-sm font-medium">Add background music</span>
                  <span className="text- bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>
                </div>
                {!musicFile? (
                  <button onClick={() => musicRef.current.click()} className="text-xs font-semibold text-[#0095f6]">Add</button>
                ) : (
                  <button onClick={() => { setMusicFile(null); setMusicName(""); }} className="text-xs text-red-500">Remove</button>
                )}
              </div>

              {musicFile && (
                <div className="mt-3 bg-gray-50 rounded-lg p-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white text-xs">♪</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{musicName}</p>
                    <p className="text- text-gray-500">Will play with post</p>
                  </div>
                  <audio controls className="h-8 w-24" src={musicFile? URL.createObjectURL(musicFile) : ""} />
                </div>
              )}
              <input ref={musicRef} type="file" accept="audio/*" hidden onChange={handleMusicChange} />
            </div>

            <div className="border-t border-gray-200" />
            <div className="p-4">
              <input placeholder="Add location" className="w-full text-sm outline-none placeholder:text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}