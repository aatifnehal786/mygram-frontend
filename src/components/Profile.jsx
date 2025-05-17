import { useParams } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../contexts/UserContext";
import ImagePostWithMusic from "./ImagePostWithMusic";
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

  const isOwnProfile = loggedUser && (!id || id === loggedUser.userid);
  const targetUserId = id || loggedUser?.userid;

  useEffect(() => {
    if (!targetUserId || !loggedUser?.token) return;

    async function fetchStatsAndPosts() {
      try {
        const res = await fetch(`http://localhost:8000/users/${targetUserId}/stats`, {
          headers: {
            Authorization: `Bearer ${loggedUser.token}`,
          },
        });
        const data = await res.json();
        setStats(data);

        const postsRes = await fetch("http://localhost:8000/allposts", {
          headers: {
            Authorization: `Bearer ${loggedUser.token}`,
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
        const res = await fetch(`http://localhost:8000/follow-status/${targetUserId}`, {
          headers: {
            Authorization: `Bearer ${loggedUser.token}`,
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

  const toggleFollow = async () => {
    if (!targetUserId) return;

    const url = isFollowing
      ? `http://localhost:8000/unfollow/${targetUserId}`
      : `http://localhost:8000/follow/${targetUserId}`;

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loggedUser.token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setIsFollowing(prev => !prev);
      } else {
        console.error("Follow/unfollow error:", data.error || data.message);
      }
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    setIsUploading(true);
    const res = await fetch("http://localhost:8000/user/profile-pic", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${loggedUser.token}`,
      },
      body: formData,
    });

    const data = await res.json();
    setIsUploading(false);

    if (res.ok) {
      setStats((prev) => ({ ...prev, profilePic: data.profilePic }));
    } else {
      alert("Failed to upload photo");
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`http://localhost:8000/like/${postId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
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
      const res = await fetch(`http://localhost:8000/comment/${postId}`, {
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

  if (!loggedUser || !stats) return <p>Loading...</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-photo" style={{ position: "relative" }}>
          <img
            src={`http://localhost:8000${stats.profilePic || "/uploads/profile_pics/default.jpg"}`}
            alt="Profile"
            className="profile-photo-img"
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ccc",
            }}
          />
          {isOwnProfile && (
            <>
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  backgroundColor: "#000",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  border: "none",
                  cursor: "pointer",
                }}
                title="Edit Profile Picture"
              >
                ✎
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

         {!isOwnProfile && (
          <button className="follow-btn" onClick={toggleFollow}>
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      
      </div>

      <h3>Posts</h3>
      
      { 
      posts.map((post) => (
        <div key={post._id} className="post">
          <p><strong>{post.caption}</strong></p>
    {post.mediaUrl.endsWith(".mp4") ? (
  <video
    ref={videoRef}
    controls
    width="100%"
    src={`http://localhost:8000/${post.mediaUrl}`}
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
