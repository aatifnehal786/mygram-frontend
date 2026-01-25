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
  <div className="max-w-5xl mx-auto px-4 py-8">

    {/* ===== Profile Header ===== */}
    <div className="flex flex-col md:flex-row items-center md:items-start gap-10 border-b pb-8">

      {/* Profile Image */}
      <div className="relative">
        <img
          src={stats.profilePic}
          alt="Profile"
          className="w-36 h-36 md:w-40 md:h-40 rounded-full object-cover border"
        />

        {isOwnProfile && (
          <>
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-2 right-2 bg-white text-sm px-3 py-1 rounded-full shadow hover:bg-gray-100"
            >
              Edit
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 space-y-4 text-center md:text-left">
        <h2 className="text-2xl font-semibold">{stats.username}</h2>

        <div className="flex justify-center md:justify-start gap-6 text-sm">
          <span><strong>{stats.postsCount}</strong> posts</span>
          <span><strong>{stats.followersCount}</strong> followers</span>
          <span><strong>{stats.followingCount}</strong> following</span>
        </div>

        <p className="text-sm text-gray-600">
          ❤️ Total Likes: {stats.likesReceived}
        </p>

        {isUploading && (
          <p className="text-sm text-indigo-500">Uploading profile picture...</p>
        )}
      </div>
    </div>

    {/* ===== Posts Section ===== */}
    <div className="mt-10">
      <h3 className="text-xl font-semibold mb-6">Posts</h3>

      {message && (
        <p className="text-sm text-red-500 mb-4">{message.data}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="bg-white border rounded-lg shadow-sm overflow-hidden"
          >

            {/* Media */}
            {post.mediaUrl.endsWith(".mp4") ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-64 object-cover"
                src={post.mediaUrl}
                onPlay={() => setCurrentlyPlayingId(null)}
              />
            ) : (
              <ImagePostWithMusic
                post={post}
                currentlyPlayingId={currentlyPlayingId}
                setCurrentlyPlayingId={setCurrentlyPlayingId}
                videoRef={videoRef}
              />
            )}

            {/* Post Content */}
            <div className="p-4 space-y-3">
              <p className="font-medium">{post.caption}</p>

              <div className="flex justify-between items-center text-sm">
                <span>❤️ {post.likes.length}</span>

                <button
                  onClick={() => handleLike(post._id)}
                  className="text-indigo-600 hover:underline"
                >
                  Like
                </button>
              </div>

              {/* Comments */}
              <div className="space-y-1 text-sm text-gray-700">
                {post.comments.map((c, idx) => (
                  <p key={idx}>
                    <strong>{c.commentedBy?.username || "User"}:</strong>{" "}
                    {c.text}
                  </p>
                ))}
              </div>

              {/* Add Comment */}
              <input
                type="text"
                placeholder="Add a comment..."
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleComment(post._id, e.target.value);
                    e.target.value = "";
                  }
                }}
              />

              {/* Delete Post */}
              {isOwnProfile && (
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete post
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

}