import { useParams } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../contexts/UserContext";
import ImagePostWithMusic from "./ImagePostWithMusic";
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
  console.log(loggedUser)

  useEffect(() => {
    if (!targetUserId || !loggedUser?.token) return;

    async function fetchStatsAndPosts() {
      try {
        const res = await fetch(`https://mygram-1-1nua.onrender.com/users/${targetUserId}/stats`, {
         headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loggedUser.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
        });
        const data = await res.json();
        setStats(data);

        const postsRes = await fetch("https://mygram-1-1nua.onrender.com/allposts", {
         headers: {
          
          "Authorization": `Bearer ${loggedUser.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
        });
        const allPosts = await postsRes.json();
        const userPosts = allPosts.filter(post => post.postedBy?._id === targetUserId);
        setPosts(userPosts);

        if (!isOwnProfile) {
          setIsFollowing(data.followers.some(f => f._id === loggedUser._id));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchStatsAndPosts();
  }, [id, loggedUser]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!targetUserId || isOwnProfile) return;

      try {
        const res = await fetch(`https://mygram-1-1nua.onrender.com/follow-status/${targetUserId}`, {
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loggedUser.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
        });

        const data = await res.json();
        if (res.ok) {
          setIsFollowing(data.isFollowing);
        } else {
          console.error("Failed to fetch follow status:", data.error || data.message);
        }
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };

    checkFollowStatus();
  }, [id, loggedUser]);

  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);
    console.log(loggedUser.token);

    setIsUploading(true);
    const res = await fetch("https://mygram-1-1nua.onrender.com/user/profile-pic", {
      method: "POST",
     headers: {
  Authorization: `Bearer ${loggedUser.token?.trim()}`,
  "x-device-id": localStorage.getItem("deviceId"), // 👈 required
  
},


      
      body: formData,
    });

    const data = await res.json();
    setIsUploading(false);
    console.log(data)


      setStats((prev) => ({ ...prev, profilePic: data.profilePic }));
    
 
  };
  // console.log(posts)
    // console.log(stats)

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`https://mygram-1-1nua.onrender.com/like/${postId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
      });
      const updated = await res.json();
      setPosts(posts.map(p => p._id === postId ? updated : p));
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const handleComment = async (postId, text) => {
    if (!text) return;
    try {
      const res = await fetch(`https://mygram-1-1nua.onrender.com/comment/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loggedUser.token}`,
        },
        body: JSON.stringify({ text }),
      });

      const updated = await res.json();
      setPosts(posts.map(p => p._id === postId ? updated : p));
    } catch (err) {
      console.error("Failed to comment", err);
    }
  };

 const handledeletePost = async (deletePostId) => {
  try {
    const deleteres = await fetch(`https://mygram-1-1nua.onrender.com/delete-post/${deletePostId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${loggedUser.token}`,
      },
    });

    const data = await deleteres.json();
    setMessage({text:"delete",data:data.message})
    setTimeout(()=>{
        setMessage({text:"",data:""})
      },3000)
    if (deleteres.ok) {
      // Remove the deleted post from the posts state
      
      setPosts(prevPosts => prevPosts.filter(post => post._id !== deletePostId));
      
    } else {
      console.error("Failed to delete post:", data.error || data.message);
    }
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
         
          <button onClick={()=>handledeletePost(post._id)}>Delete</button>
          
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
