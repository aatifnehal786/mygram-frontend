import React, { useContext,useEffect,useState } from 'react';
import './Post.css'
import { apiFetch } from "../api/apiFetch";
// import './App.css';
import { UserContext } from '../contexts/UserContext';
const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [musicFile,setMusicFile] = useState('')
  const [mediaFile, setMediaFile] = useState(null);
  const [status, setStatus] = useState('');
 
const handleCreatePost = async (e) => {
  e.preventDefault()
  if (!mediaFile) {
    setStatus("Please select a media file before posting.");
    return;
  }

  const formData = new FormData();
  formData.append("caption", caption);
  formData.append("mediaType", mediaType);
  formData.append("image", mediaFile); // ✅ must match backend field name

  if (mediaType === "image" && musicFile) {
    formData.append("backgroundMusic", musicFile); // ✅ must match backend
  }

  try {
    const data = await apiFetch("api/create-posts/create", {
      method: "POST",
      body: formData,
    });

    setStatus(data.message);

   
  } catch (err) {
    console.error("Create post failed:", err);
    setStatus("Failed to create post. Please try again.");
  }
};



useEffect(()=>{
  console.log("Post Created")
},[handleCreatePost])

  return (
  <div className="min-h-screen bg-gray-100 flex flex-col">

    {/* Navbar */}
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-wide text-blue-600">
        MyGram
      </h1>
    </nav>

    {/* Main */}
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">

        <h2 className="text-lg font-semibold mb-5 text-center">
          Create Post
        </h2>

        <form onSubmit={handleCreatePost} className="space-y-4">

          {/* Caption */}
          <input
            type="text"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            required
            className="
              w-full px-4 py-2 rounded-lg border
              focus:outline-none focus:ring-2 focus:ring-blue-500
              text-sm
            "
          />

          {/* Media Type */}
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="
              w-full px-4 py-2 rounded-lg border
              focus:outline-none focus:ring-2 focus:ring-blue-500
              text-sm bg-white
            "
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>

          {/* Audio (image only) */}
          {mediaType === "image" && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Optional background audio</p>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setMusicFile(e.target.files[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0
                           file:bg-gray-100 file:text-gray-700
                           hover:file:bg-gray-200"
              />
            </div>
          )}

          {/* Media */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              Choose image or video
            </p>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
              required
              className="w-full text-sm file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:bg-blue-50 file:text-blue-600
                         hover:file:bg-blue-100"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="
              w-full bg-blue-600 text-white py-2 rounded-lg
              font-medium hover:bg-blue-700 transition
            "
          >
            Upload Post
          </button>
        </form>

        {/* Status */}
        {status && (
          <p className="mt-4 text-center text-sm text-gray-600">
            {status}
          </p>
        )}
      </div>
    </main>
  </div>
);

};

export default CreatePost;
