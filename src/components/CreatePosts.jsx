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
    <div className="app-wrapper">
      <nav className="navbar">
        <h1 className="logo">MyGram</h1>
        
      </nav>

      <main className="main-content">
        <div className="create-post-container">
          <h2 className="title">Create Post</h2>
          <form className="post-form" onSubmit={handleCreatePost}>
            <input
              type="text"
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input-field"
              required
            />
           <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="input-field"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>

            {/* Show audio file upload only for image posts */}
            {mediaType === "image" && (
             
              <div>
                <p>Choose Audio File</p>
                <input
                type="file"
                accept="audio/*"
                onChange={(e) => setMusicFile(e.target.files[0])}
                className="file-input" placeholder='Choose Audio'
              />
              </div>
              )}

            <p>Choose image or video</p>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
              className="file-input" placeholder='Choose image or Video File'
              required
            />
            <button type="submit" className="submit-button">
              Upload Post
            </button>
          </form>
          {status && <p className="status-message">{status}</p>}
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
