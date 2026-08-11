import { useEffect, useState } from "react";
import { apiFetch } from "../api/apiFetch";
import { useTheme } from "../contexts/ThemeContext";
import useUserStore from "../store/useUserStore";
import VideoPost from "./VideoPost";
import ImagePostWithMusic from "./ImagePostWithMusic";
import { toast, ToastContainer } from "react-toastify";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);

  const loggedUser = useUserStore(s => s.loggedUser);
  const posts = useUserStore(s => s.posts);
  const publicPosts = useUserStore(s => s.publicPosts);
  const setPosts = useUserStore(s => s.setPosts);
  const setPublicPosts = useUserStore(s => s.setPublicPosts);
  const updateFeedPost = useUserStore(s => s.updateFeedPost);
  const removeFeedPost = useUserStore(s => s.removeFeedPost);
  const { theme } = useTheme();

  const isGuest = loggedUser?.user?.isGuest;
  const feed = isGuest? publicPosts : posts;
  const myId = loggedUser?.userid || loggedUser?._id || loggedUser?.user?._id || loggedUser?.id;

  useEffect(() => {
    apiFetch("api/user/stats").then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    const url = isGuest? "api/posts/public-posts" : "api/posts/allposts";
    apiFetch(url)
     .then(d => {
        const arr = Array.isArray(d)? d : d.posts || [];
        if (isGuest) setPublicPosts(arr);
        else setPosts(arr);
      })
     .catch(console.error);
  }, [isGuest]);

  const handleLikeToggle = async (postId) => {
    const currentPost = feed.find(p => p._id === postId);
    if (!currentPost) return;
    const isLiked = currentPost.likes?.some(l => (l?._id || l)?.toString() === myId?.toString());

    const newLikes = isLiked
     ? currentPost.likes.filter(l => (l?._id || l)?.toString()!== myId?.toString())
      : [...(currentPost.likes || []), myId];

    updateFeedPost(postId, { likes: newLikes });

    try {
      if (isLiked) {
        await apiFetch(`api/post/unlike/${postId}`, { method: "PUT" });
      } else {
        await apiFetch(`api/post/like/${postId}`, { method: "PUT" });
      }
    } catch (err) {
      console.log(err);
      updateFeedPost(postId, { likes: currentPost.likes });
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;

    const currentPost = feed.find(p => p._id === postId);
    const tempComment = {
      _id: Date.now().toString(),
      text,
      comment: text,
      postedBy: { username: loggedUser?.username || loggedUser?.user?.username, profilePic: loggedUser?.profilePic },
      username: loggedUser?.username || loggedUser?.user?.username,
    };

    updateFeedPost(postId, { comments: [...(currentPost.comments || []), tempComment] });
    setCommentTexts(prev => ({...prev, [postId]: "" }));

    try {
      const data = await apiFetch(`api/post/comment/${postId}`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (data.comments || data.post?.comments) {
        updateFeedPost(postId, { comments: data.comments || data.post.comments });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    const backup = [...feed];
    removeFeedPost(postId);
    try {
      await apiFetch(`api/post/delete-post/${postId}`, { method: "DELETE" });
      toast.success("Post deleted");
    } catch (err) {
      console.log(err);
      toast.error("Delete failed");
      if (isGuest) setPublicPosts(backup);
      else setPosts(backup);
    }
  };

  return (
    <div className={`w-full max-w- mx-auto ${theme === "dark"? "bg-black text-white" : "bg-[#fafafa] text-black"}`}>
      {/* STORIES */}
      <div className={`w-full border ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"} rounded-lg mb-4`}>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4">
          {users.map(user => (
            <div key={user._id} onClick={() => setSelectedProfile(user)} className="flex flex-col items-center gap-1 min-w- cursor-pointer">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <img src={user.profilePic || "/placeholder.svg"} alt={user.username} className="w-full h-full rounded-full object-cover" onError={e => e.target.src = "/placeholder.svg"} />
                </div>
              </div>
              <span className="text-sm truncate w-20 text-center">{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEED */}
      <div className="w-full flex flex-col gap-4">
        {feed.map(post => {
          const isOwn = (post.postedBy?._id || post.postedBy)?.toString() === myId?.toString();
          const isLiked = post.likes?.some(l => (l?._id || l)?.toString() === myId?.toString());
          return (
            <div key={post._id} className={`border rounded-lg overflow-hidden ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 p-3">
                <img src={post.postedBy?.profilePic || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover" onError={e => e.target.src = "/placeholder.svg"} />
                <span className="text-sm font-semibold">{post.postedBy?.username}</span>
                {isOwn && (
                  <button onClick={() => handleDeletePost(post._id)} className="ml-auto text-xs text-red-500 hover:font-bold">Delete</button>
                )}
              </div>

              <div className="w-full aspect-square bg-black overflow-hidden">
                {post.mediaType === "video"? (
                  <VideoPost post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} />
                ) : (
                  <ImagePostWithMusic post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} />
                )}
              </div>

              <div className="px-3 pt-3 pb-1 flex gap-4 text- items-center">
                <button onClick={() => handleLikeToggle(post._id)} className="hover:opacity-60">
                  {isLiked? <span className="text-red-500">❤️</span> : <span>🤍</span>}
                </button>
                <button onClick={() => document.getElementById(`comment-${post._id}`)?.focus()} className="hover:opacity-60">💬</button>
                <button className="hover:opacity-60">✈️</button>
              </div>

              <div className="px-3 text-sm font-semibold">
                {post.likes?.length > 0 && <p>{post.likes.length} likes</p>}
              </div>

              <div className="px-3 py-1 text-sm">
                <p><b>{post.postedBy?.username}</b> {post.caption}</p>
              </div>

              <div className="px-3 text-sm space-y-1">
                {(expandedPost === post._id? post.comments : post.comments?.slice(-2))?.map((c, i) => (
                  <p key={c._id || i} className="text-sm"><b>{c.postedBy?.username || c.username || "user"}</b> {c.text || c.comment}</p>
                ))}
                {post.comments?.length > 2 && expandedPost!== post._id && (
                  <button onClick={() => setExpandedPost(post._id)} className="text-gray-500 text-xs">View all {post.comments.length} comments</button>
                )}
              </div>

              <div className={`px-3 py-3 border-t mt-2 flex items-center gap-2 ${theme === "dark"? "border-zinc-800" : "border-gray-200"}`}>
                <span className="text-lg">😊</span>
                <input
                  id={`comment-${post._id}`}
                  value={commentTexts[post._id] || ""}
                  onChange={(e) => setCommentTexts(prev => ({...prev, [post._id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post._id) }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button onClick={() => handleAddComment(post._id)} disabled={!commentTexts[post._id]?.trim()} className="text-blue-500 text-sm font-semibold disabled:opacity-30">Post</button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProfile(null)}>
          <div className={`rounded-xl p-6 w-full max-w-sm text-center ${theme === "dark"? "bg-zinc-900" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <img src={selectedProfile.profilePic} className="w-20 h-20 rounded-full mx-auto object-cover" />
            <h2 className="font-bold mt-3">{selectedProfile.username}</h2>
            <div className="flex justify-around mt-4 text-sm"><div><b>{selectedProfile.postsCount}</b><p>Posts</p></div><div><b>{selectedProfile.followersCount}</b><p>Followers</p></div><div><b>{selectedProfile.followingCount}</b><p>Following</p></div></div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}