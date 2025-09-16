import { useParams } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../contexts/UserContext";
import ImagePostWithMusic from "./ImagePostWithMusic";
import { apiFetch } from "../api/apiFetch"; // 👈 adjust path as needed
import './Profile.css'
export default function Profile() {
  const { id } = useParams();
  const { loggedUser } = useContext(UserContext);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const videoRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();
  const [message,setMessage] = useState({text:"",data:""})

  const isOwnProfile = loggedUser && (!id || id === loggedUser.userid);
  const targetUserId =  loggedUser?.userid;
  // console.log(loggedUser)
  



// FETCH STATS AND POSTS
useEffect(() => {
  if (!targetUserId || !loggedUser?.token) return;

  async function fetchStatsAndPosts() {
    try {
      const statsData = await apiFetch(`api/user/stats/${targetUserId}`);
      setStats(statsData);

      const data = await apiFetch("api/posts/allposts");
      const userPosts = data.filter(
        (post) => post.postedBy?._id === targetUserId
      );
      setPosts(userPosts);

      if (!isOwnProfile) {
        setIsFollowing(statsData.followers.some((f) => f._id === loggedUser._id));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }

  fetchStatsAndPosts();
}, [id, loggedUser]);


// CHECK FOLLOW STATUS

useEffect(() => {
  const checkFollowStatus = async () => {
    if (!targetUserId || isOwnProfile) return;

    try {
      const data = await apiFetch(`api/follow-status/${targetUserId}`);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  checkFollowStatus();
}, [id, loggedUser]);

// HANDLE FILE CHANGE

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("profilePic", file);

  try {
    setIsUploading(true);

    const data = await apiFetch("api/uploads/profile", {
      method: "POST",
      body: formData, // ✅ handled by apiFetch (skips Content-Type for FormData)
    });
console.log(data)
    // Update profilePic in stats state
    setStats((prev) => ({ ...prev, profilePic: data.profilePic }));
  } catch (err) {
    console.error("Profile pic upload failed:", err);
  } finally {
    setIsUploading(false);
  }
};


// HANDLE LIKE

const handleLike = async (postId) => {
  try {
    const updated = await apiFetch(`api/posts/like/${postId}`, {
      method: "PUT",
    });

    setPosts(posts.map((p) => (p._id === postId ? updated : p)));
  } catch (err) {
    console.error("Failed to like post", err);
  }
};


// HANDLE COMMENT

const handleComment = async (postId, text) => {
  if (!text) return;
  try {
    const updated = await apiFetch(`api/posts/comment/${postId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    setPosts(posts.map((p) => (p._id === postId ? updated : p)));
  } catch (err) {
    console.error("Failed to comment", err);
  }
};


// HANDLE DELETE POSTS

const handleDeletePost = async (deletePostId) => {
  try {
    const data = await apiFetch(`api/posts/delete-post/${deletePostId}`, {
      method: "DELETE",
    });

    setMessage({ text: "delete", data: data.message });
    setTimeout(() => {
      setMessage({ text: "", data: "" });
    }, 3000);

    setPosts((prevPosts) =>
      prevPosts.filter((post) => post._id !== deletePostId)
    );
  } catch (err) {
    console.error("Delete post failed:", err);
  }
};



  if (!loggedUser || !stats) return <p>Loading...</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-photo2">
          <img
            src={stats.profilePic}
            alt="Profile"
            className="profile-photo-img"
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ccc",
              marginTop: '2rem',
            }}
          />
          {isOwnProfile && (
            <>
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                 
                 
                  top:"24%",
                  left:"35%",
                  backgroundColor: "#fff",
                  color: "#222",
                  borderRadius: "50%",
                  width: "5rem",
                  height: "4rem",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Edit Profile Picture"
              >
                Edit Profile Pic
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </>
          )}
        </div>
        {isUploading && <p>Uploading...</p>}
      </div>

      <div className="profile-info">
        <h2>{stats.username}</h2>
        <p>Posts: {stats.postsCount}</p>
        <p>Followers: {stats.followersCount}</p>
        <p>Following: {stats.followingCount}</p>
        <p>Total Likes: {stats.likesReceived}</p>

        
      </div>

   <div className="delete-message">
       <h3>Posts</h3>
      {message && <p className={message.text}>{message.data}</p>}
   </div>
      
      {
      posts.map((post) => (
        <div key={post._id} className="post">
          <p>delete post</p>
         
          <button onClick={()=>handleDeletePost(post._id)}>Delete</button>
          
          <p><strong>{post.caption}</strong></p>
    {post.mediaUrl.endsWith(".mp4") ? (
  <video
    ref={videoRef}
    controls
    width="100%"
    src={post.mediaUrl}
    onPlay={() => {
      setCurrentlyPlayingId(null); // Stop music
    }}
  />
) : (
  <ImagePostWithMusic
    post={post}
    currentlyPlayingId={currentlyPlayingId}
    setCurrentlyPlayingId={setCurrentlyPlayingId}
    videoRef={videoRef}
  />
)}




          
          <p>Likes: {post.likes.length}</p>
          <button onClick={() => handleLike(post._id)}>Like</button>

          <div className="comments">
            {post.comments.map((c, idx) => (
              <p key={idx}>
                <strong>{c.commentedBy?.username || "User"}:</strong> {c.text}
              </p>
            ))}
          </div>

          <input
            type="text"
            placeholder="Add a comment"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleComment(post._id, e.target.value);
                e.target.value = "";
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}