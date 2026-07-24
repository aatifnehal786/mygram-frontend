import { useEffect, useState} from "react";
// import { UserContext } from "../contexts/UserContext";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
// import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../contexts/ThemeContext";
import useUserStore from "../store/useUserStore";
import VideoPost from "./VideoPost";
import ImagePostWithMusic from "./ImagePostWithMusic";
import { toast,ToastContainer } from "react-toastify";
export default function Home() {


  const [users, setUsers] = useState([]);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const { id } = useParams();
  const loggedUser = useUserStore((state) => state.loggedUser);
  const [posts, setPosts] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [loadingUserId, setLoadingUserId] = useState(null);
  const { theme } = useTheme();
  const [publicPosts, setPublicPosts] = useState([]);
  const isOwnProfile = loggedUser && (!id || id === loggedUser.userid);
  const [message, setMessage] = useState({ text: "", data: "" })
  const targetUserId = loggedUser?.userid;
  // console.log(loggedUser);

// FETCH ALL USERS

useEffect(() => {
  apiFetch("api/user/allusers2")
    .then((data) => setUsers(data))
    .catch((err) => console.error("All users fetch error:", err));
}, []);

// fetch public posts
useEffect(() => {
  if (!loggedUser?.user?.isGuest) return;

  const fetchPublicPosts = async () => {
    try {
      const data = await apiFetch("api/posts/public-posts");
      setPublicPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchPublicPosts();
}, [loggedUser?.user?.isGuest]);

  useEffect(() => {
    if (!targetUserId || !loggedUser?.token) return;

    async function fetchStatsAndPosts() {
      try {
        const data = await apiFetch("api/posts/allposts");
        const userPosts = data.filter((post) => post.postedBy?._id === targetUserId);
        setPosts(userPosts);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchStatsAndPosts();
  }, [targetUserId, loggedUser]);


// CHECK FOLLOW STATUS
useEffect(() => {
  if (!Array.isArray(users) || !loggedUser?.userid) return;

  const fetchStatuses = async () => {
    const statusMap = {};

    try {
      await Promise.all(
        users.map(async (user) => {
          if (user._id === loggedUser.userid) return;

          const res = await apiFetch(
            `api/follow-status/${user._id}`
          );

          // backend returns { status: "requested" | "following" | "follow" }
          statusMap[user._id] = res.status;
        })
      );

      setFollowStatus(statusMap);
    } catch (err) {
      console.error("Follow status fetch error:", err);
    }
  };

  fetchStatuses();
}, [users, loggedUser.userid]);

// TOGGLE FOLLOW / UNFOLLOW
const handleFollowToggle = async (targetUserId) => {
  if (loadingUserId === targetUserId) return;

  const currentStatus = followStatus[targetUserId]; // "follow" | "following"

  try {
    setLoadingUserId(targetUserId);

    // 🔴 UNFOLLOW
    if (currentStatus === "following") {
      await apiFetch(`api/unfollow/${targetUserId}`, {
        method: "PUT", // or PUT based on your backend
      });

      setFollowStatus((prev) => ({
        ...prev,
        [targetUserId]: "follow",
      }));

      toast.info("Unfollowed");
    }

    // 🟢 FOLLOW
    else {
      await apiFetch(`api/follow/${targetUserId}`, {
        method: "PUT",
      });

      setFollowStatus((prev) => ({
        ...prev,
        [targetUserId]: "following",
      }));

      toast.success("Followed");
    }
  } catch (err) {
    console.error("Follow toggle error:", err);
    toast.error("Something went wrong");
  } finally {
    setLoadingUserId(null);
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


 return (
  <div className={`min-h-screen p-4 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
    <h1 className="text-3xl font-bold mb-6 text-center">Welcome to MyGram</h1>
    <div className={`min-h-800 px-2 py-6 ${theme === "dark" ? "bg-green-900 text-white" : "bg-red-400 text-black"} rounded-lg`}>

    {/* Users Grid */}
    <div className={`max-w-4xl mx-auto grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 ${theme === "dark" ? "text-blue-800" : "text-black"}`}>
     {Array.isArray(users) &&
  users.map(
    (user) => {
      if (user._id === loggedUser.userid) return null;
      return (
        <div
          key={user._id}
          className={`bg-${theme === "dark" ? "gray-800" : "white"} rounded-xl shadow-sm p-4 flex flex-col items-center text-center`}>
          <img
            src={user.profilePic || null}
            alt={user.username}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />

          <h5 className={`font-medium text-sm mb-2 ${
            theme === "dark" ? "text-green-400" : "text-black"
          }`}>
            {user.username}
          </h5>

          
{loggedUser?.user?.isGuest ? <p className="text-xm text-red-800">Guest users cannot follow</p> : followStatus[user._id] === undefined ? (
  <p className="text-xs text-gray-400">Loading status…</p>
) : (
  <button
    disabled={loadingUserId === user._id}
    onClick={() => handleFollowToggle(user._id)}
    className={`
      px-4 py-1 rounded-md text-sm font-medium transition
      disabled:opacity-60 disabled:cursor-not-allowed
      ${
        followStatus[user._id] === "following"
          ? "bg-gray-200 text-black hover:bg-gray-300"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }
    `}
  >
    {loadingUserId === user._id
      ? "Loading..."
      : followStatus[user._id] === "following"
      ? "Following"
      : "Follow"}
  </button>
)}


        </div>
      );
    }
  )}

    </div>
   
  </div>
  {/* =====PUBLIC POSTS SECTION ===== */}
            <div className={`max-w-4xl mx-auto mt-8 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg p-4`}>
              {loggedUser?.user?.isGuest ? (<div className="mt-10">
              <h3 className="text-xl font-semibold mb-6">Posts</h3>
  
              
  
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicPosts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white border rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Media */}
                    {post.mediaType === "video" ? (
                      <VideoPost
                        post={post}
                        currentlyPlayingId={currentlyPlayingId}
                        setCurrentlyPlayingId={setCurrentlyPlayingId}
                        
                      />
                    ) : (
                      <ImagePostWithMusic
                        post={post}
                        currentlyPlayingId={currentlyPlayingId}
                        setCurrentlyPlayingId={setCurrentlyPlayingId}
                       
                      />
                    )}
  
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <p className={`font-medium ${theme === "dark" ? "text-red-400" : "text-black"}`}>
                        {post.caption}
                      </p>
  
                      <div className="flex justify-between text-sm">
                        <span>❤️ {post.likes.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>) : (
              <>
               {/* ===== PRIVATE POSTS SECTION ===== */}
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
                                {post.mediaType === "video" ? (
                                  <VideoPost
                                    post={post}
                                    currentlyPlayingId={currentlyPlayingId}
                                    setCurrentlyPlayingId={setCurrentlyPlayingId}
                                    
                                  />
                                ) : (
                                  <ImagePostWithMusic
                                    post={post}
                                    currentlyPlayingId={currentlyPlayingId}
                                    setCurrentlyPlayingId={setCurrentlyPlayingId}
                                   
                                  />
                                )}
              
                                {/* Content */}
                                <div className="p-4 space-y-3">
                                  <p className={`font-medium ${theme === "dark" ? "text-red-400" : "text-black"}`}>
                                    {post.caption}
                                  </p>
              
                                  <div className="flex justify-between text-sm">
                                    <span>❤️ {post.likes.length}</span>
                                    <button
                                      onClick={() => handleLike(post._id)}
                                      className={`hover:underline ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                                        }`}
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
                        </>
            )}
            </div>
             <ToastContainer position="top-right" autoClose={2000} />
  </div>
);

}
