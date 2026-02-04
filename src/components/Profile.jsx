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
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("followers"); // or "following"
  const [requests, setRequests] = useState([]);


  const isOwnProfile = loggedUser && (!id || id === loggedUser.userid);
  const targetUserId =  loggedUser?.userid;
  const [followStatus, setFollowStatus] = useState({});
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

 const [newUsername, setNewUsername] = useState(stats?.username || "");


 // followers and following
 useEffect(() => {
  

  const fetchFollowersAndFollowing = async () => {
    try {
      setLoadingFollowers(true);

      const [followersRes, followingRes] = await Promise.all([
        apiFetch(`api/user/followers/${targetUserId}`),
        apiFetch(`api/user/following/${targetUserId}`),
      ]);

      setFollowers(followersRes);
      setFollowing(followingRes);
    } catch (error) {
      console.error("Error fetching followers/following:", error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  fetchFollowersAndFollowing();
}, [stats, targetUserId]);

// CHECK FOLLOW STATUS

useEffect(() => {
  const checkFollowStatus = async () => {
    if (!targetUserId || isOwnProfile) return;

    try {
      const data = await apiFetch(`api/follow-status/${targetUserId}`);

      // EXPECTED: { status: "following" | "requested" | "follow" }
      setFollowStatus(data.status);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  checkFollowStatus();
}, [targetUserId, loggedUser]);


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


// HANDLE CHANGE USERNAME
const handleChangeUserName = async (newUsername) => {
  if (!newUsername?.trim()) return;
  if (newUsername === stats.username) return;

  try {
    const data = await apiFetch("api/user/updateprofile", {
      method: "PUT",
      body: JSON.stringify({ newUsername }),
    });

    // update UI instantly
    setStats((prev) => ({
      ...prev,
      username: data.newUsername || newUsername,
    }));
  } catch (err) {
    console.error("Failed to change username:", err);
  }
};



  if (!loggedUser || !stats) return <p>Loading...</p>;

 return (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex gap-8">

      {/* ===== LEFT SIDEBAR: FOLLOWERS / FOLLOWING ===== */}
     {/* ===== LEFT SIDEBAR ===== */}
<div className="hidden lg:block w-72">
  <div className="sticky top-24 space-y-6">

    {/* Followers */}
    <div>
      <h3 className="text-sm font-semibold mb-3">
        Followers ({followers.length})
      </h3>

      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
        {loadingFollowers ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : followers.length === 0 ? (
          <p className="text-sm text-gray-400">No followers yet</p>
        ) : (
          followers.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="text-sm font-medium">
                {user.username}
              </span>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Following */}
    <div>
      <h3 className="text-sm font-semibold mb-3">
        Following ({following.length})
      </h3>

      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
        {loadingFollowers ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : following.length === 0 ? (
          <p className="text-sm text-gray-400">Not following anyone</p>
        ) : (
          following.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="text-sm font-medium">
                {user.username}
              </span>
            </div>
          ))
        )}
      </div>
    </div>

  </div>
</div>

      {/* ===== RIGHT CONTENT ===== */}
      <div className="flex-1">

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
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-semibold">{stats.username}</h2>

              {isOwnProfile && (
                <button
                  onClick={() => setIsUsernameModalOpen(true)}
                  className="text-sm px-2 py-1 rounded-md border bg-white hover:bg-gray-100"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="flex justify-center md:justify-start gap-6 text-sm">
  <span><strong>{stats.postsCount}</strong> posts</span>

  <span
    onClick={() => {
      setActiveTab("followers");
      setShowFollowModal(true);
    }}
    className="cursor-pointer"
  >
    <strong>{followers.length}</strong> followers
  </span>

  <span
    onClick={() => {
      setActiveTab("following");
      setShowFollowModal(true);
    }}
    className="cursor-pointer"
  >
    <strong>{following.length}</strong> following
  </span>
</div>


            <p className="text-sm text-gray-600">
              ❤️ Total Likes: {stats.likesReceived}
            </p>

            {isUploading && (
              <p className="text-sm text-indigo-500">
                Uploading profile picture...
              </p>
            )}
          </div>
        </div>

        {/* ===== POSTS SECTION ===== */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-6">Posts</h3>

          {message && (
            <p className="text-sm text-red-500 mb-4">
              {message.data}
            </p>
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
                    controls
                    className="w-full h-64 object-cover"
                    src={post.mediaUrl}
                  />
                ) : (
                  <ImagePostWithMusic
                    post={post}
                    currentlyPlayingId={currentlyPlayingId}
                    setCurrentlyPlayingId={setCurrentlyPlayingId}
                    videoRef={videoRef}
                  />
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  <p className="font-medium">{post.caption}</p>

                  <div className="flex justify-between text-sm">
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
                        <strong>{c.commentedBy?.username}:</strong>{" "}
                        {c.text}
                      </p>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleComment(post._id, e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />

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

      {/* ===== USERNAME MODAL ===== */}
      {isUsernameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-[90%] max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Change Username
            </h3>

            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter new username"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsUsernameModalOpen(false)}
                className="px-4 py-2 text-sm border rounded-lg"
              >
                Cancel
              </button>

              <button
                disabled={newUsername === stats.username || !newUsername.trim()}
                onClick={() => {
                  handleChangeUserName(newUsername);
                  setIsUsernameModalOpen(false);
                }}
                className="px-4 py-2 text-sm rounded-lg text-white bg-indigo-600 disabled:bg-gray-400"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

    {showFollowModal && (
  <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">

    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="font-semibold">
        {activeTab === "followers" ? "Followers" : "Following"}
      </h3>

      <button
        onClick={() => setShowFollowModal(false)}
        className="text-gray-600 text-xl"
      >
        ✕
      </button>
    </div>

    {/* Tabs */}
    <div className="flex border-b">
      <button
        onClick={() => setActiveTab("followers")}
        className={`flex-1 py-2 text-sm ${
          activeTab === "followers"
            ? "border-b-2 border-black font-medium"
            : "text-gray-500"
        }`}
      >
        Followers
      </button>

      <button
        onClick={() => setActiveTab("following")}
        className={`flex-1 py-2 text-sm ${
          activeTab === "following"
            ? "border-b-2 border-black font-medium"
            : "text-gray-500"
        }`}
      >
        Following
      </button>
    </div>

    {/* List */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {(activeTab === "followers" ? followers : following).map((user) => (
        <div
          key={user._id}
          className="flex items-center gap-3"
        >
          <img
            src={user.profilePic || "/avatar.png"}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />

          <span className="text-sm font-medium">
            {user.username}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

<div className="p-4">
  <h2 className="text-lg font-semibold mb-3">Follow Requests</h2>

  {requests.length === 0 ? (
    <p className="text-gray-500 text-sm">No follow requests</p>
  ) : (
    requests.map((user) => (
      <div
        key={user._id}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-3">
          <img
            src={user.profilePic}
            className="w-10 h-10 rounded-full"
          />
          <span className="font-medium">{user.username}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => acceptRequest(user._id)}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
          >
            Accept
          </button>

          <button
            onClick={() => rejectRequest(user._id)}
            className="bg-gray-200 px-3 py-1 rounded-md text-sm"
          >
            Reject
          </button>
        </div>
      </div>
    ))
  )}
</div>

  </div>
);


}