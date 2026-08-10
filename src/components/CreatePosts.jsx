import { useState } from 'react';
import { apiFetch } from "../api/apiFetch";
import { useTheme } from '../contexts/ThemeContext';

export default function CreatePost() {
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMediaFile(f);
    setPreview(URL.createObjectURL(f));
    setMediaType(f.type.startsWith("video")? "video" : "image");
  };

  const handleCreate = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("caption", caption);
    fd.append("mediaType", mediaType);
    fd.append("media", mediaFile);
    await apiFetch("api/create-posts/create", { method: "POST", body: fd });
    setLoading(false);
    setCaption(""); setPreview(null);
    alert("Posted!");
  };

  return (
    <div className="max-w- mx-auto mt-6">
      <div className={`border rounded-xl overflow-hidden ${theme === "dark"? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"}`}>
        <div className="flex justify-between items-center p-3 border-b">
          <h2 className="font-semibold mx-auto">Create new post</h2>
          <button onClick={handleCreate} disabled={!mediaFile} className="text-blue-600 text-sm font-semibold">Share</button>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="flex-1 bg-black aspect-square flex items-center justify-center">
            {preview? mediaType === "video"? <video src={preview} className="max-h-full" controls /> : <img src={preview} className="max-h-full" /> : (
              <label className="cursor-pointer flex flex-col items-center text-white">
                <span className="text-5xl mb-2">📷</span>
                <span>Select from computer</span>
                <input type="file" accept="image/*,video/*" onChange={onFile} className="hidden" />
              </label>
            )}
          </div>
          <div className="w-full md:w- p-4">
            <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption..." className={`w-full h-32 resize-none outline-none text-sm ${theme === "dark"? "bg-zinc-900" : "bg-white"}`} />
          </div>
        </div>
      </div>
    </div>
  );
}