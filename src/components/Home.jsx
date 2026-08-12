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
  
  // NEW FOR FOLLOW
  const [profileFollowStatus, setProfileFollowStatus] = useState("follow");
  const [followLoading, setFollowLoading] = useState(false);

  const { loggedUser, token } = useUserStore();
  const posts = useUserStore(s => s.posts);
  const publicPosts = useUserStore(s => s.publicPosts);
  const setPosts = useUserStore(s => s.setPosts);
  const setPublicPosts = useUserStore(s => s.setPublicPosts);
  const updateFeedPost = useUserStore(s => s.updateFeedPost);
  const removeFeedPost = useUserStore(s => s.removeFeedPost);
  const { theme } = useTheme();
  const [statusFeed, setStatusFeed] = useState([]);
const [showAddStatus, setShowAddStatus] = useState(false);
const [viewingStatusGroup, setViewingStatusGroup] = useState(null);
const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
const [statusViewers, setStatusViewers] = useState([]);
const [showViewers, setShowViewers] = useState(false);
  const isGuest = loggedUser?.user?.isGuest || loggedUser?.isGuest;
  const feed = isGuest? publicPosts : posts;
  const myId = loggedUser?._id || loggedUser?.user?._id || loggedUser?.id || loggedUser?.userid;
  
const [statusText, setStatusText] = useState("");
const [statusFile, setStatusFile] = useState(null);


  useEffect(() => {
    if(!token) return;
    apiFetch("api/user/stats").then(setUsers).catch(console.error);
  }, [token]);

  useEffect(() => {
    if(!token &&!isGuest) return;
    const url = isGuest? "api/posts/public-posts" : "api/posts/allposts";
    apiFetch(url)
     .then(d => {
        const arr = Array.isArray(d)? d : d.posts || [];
        if (isGuest) setPublicPosts(arr);
        else setPosts(arr);
      })
     .catch(console.error);
  }, [isGuest, token]);

  // FETCH FOLLOW STATUS WHEN PROFILE OPENS
  useEffect(() => {
    if (!selectedProfile?._id) return;
    if (selectedProfile._id === myId) return;

    const fetchStatus = async () => {
      try {
        const data = await apiFetch(`api/user/follow-status/${selectedProfile._id}`);
        // data.status will be: "follow" | "following" | "follow_back"
        setProfileFollowStatus(data.status || "follow");
      } catch (err) {
        console.log("status error", err);
        setProfileFollowStatus("follow");
      }
    };
    fetchStatus();
  }, [selectedProfile, myId]);

useEffect(() => {
  apiFetch("api/status/feed")
   .then(d => {
      console.log("status feed response:", d); // check what backend sends
      const arr = Array.isArray(d) ? d : d.data || d.statuses || [];
      setStatusFeed(arr);
    })
   .catch(() => setStatusFeed([]));
}, []);



// ONE function for both text + media
const handleCreateStatus = async () => {
  if (!statusText.trim() &&!statusFile) {
    return toast.error("Type something or select file");
  }

  const formData = new FormData();
  if (statusText.trim()) {
    formData.append('text', statusText.trim());
    formData.append('bgColor', '#1a1a1a');
  }
  if (statusFile) {
    formData.append('media', statusFile);
    formData.append('mediaType', statusFile.type.startsWith('video')? 'video' : 'image');
  } else {
    formData.append('mediaType', 'text');
  }

  try {
    await apiFetch('api/status/create', {
      method: 'POST',
      body: formData,
    });
    setShowAddStatus(false);
    setStatusText("");
    setStatusFile(null);
    toast.success("Status added");
    // refresh feed
    const d = await apiFetch("api/status/feed");
    setStatusFeed(Array.isArray(d)? d : d.data || []);
  } catch (e) {
    console.log(e);
    toast.error("Failed");
  }
};

 const handleFollowToggle = async () => {
  if (!selectedProfile?._id) return;
  setFollowLoading(true);
  try {
    if (profileFollowStatus === "following") {
      await apiFetch(`api/user/unfollow/${selectedProfile._id}`, { 
        method: "PUT" 
      });
      setProfileFollowStatus("follow");
      toast.success("Unfollowed");
    } else {
      await apiFetch(`api/user/follow/${selectedProfile._id}`, { 
        method: "PUT" 
      });
      setProfileFollowStatus("following");
      toast.success("Followed");
    }
  } catch (err) {
    console.log(err);
    toast.error("Failed");
  } finally {
    setFollowLoading(false);
  }
};

  const handleLikeToggle = async (postId) => {
    //... your existing like code same...
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
      toast.error("Delete failed");
      if (isGuest) setPublicPosts(backup);
      else setPosts(backup);
    }
  };




// VIEW STATUS
const openStatusViewer = (group) => {
  setViewingStatusGroup(group);
  setCurrentStatusIndex(0);
  setShowViewers(false);
  // mark viewed
  const firstStatus = group.statuses[0];
  if (firstStatus) {
    apiFetch(`api/status/view/${firstStatus._id}`, { method: "PUT" }).catch(()=>{});
  }
};

const nextStatus = () => {
  if (!viewingStatusGroup) return;
  if (currentStatusIndex < viewingStatusGroup.statuses.length - 1) {
    const next = currentStatusIndex + 1;
    setCurrentStatusIndex(next);
    const id = viewingStatusGroup.statuses[next]._id;
    apiFetch(`api/status/view/${id}`, { method: "PUT" }).catch(()=>{});
  } else {
    setViewingStatusGroup(null);
  }
};

const prevStatus = () => {
  if (currentStatusIndex > 0) setCurrentStatusIndex(currentStatusIndex - 1);
};

// DELETE STATUS
const handleDeleteStatus = async (statusId) => {
  if (!window.confirm("Delete this status?")) return;
  try {
    await apiFetch(`api/status/${statusId}`, { method: "DELETE" });
    toast.success("Status deleted");
    setViewingStatusGroup(null);
    // refresh feed
    const d = await apiFetch("api/status/feed");
    setStatusFeed(Array.isArray(d)? d : d.data || []);
  } catch (e) {
    toast.error("Delete failed");
  }
};

// VIEWERS LIST
const fetchViewers = async (statusId) => {
  try {
    const data = await apiFetch(`api/status/viewers/${statusId}`);
    setStatusViewers(Array.isArray(data)? data : data.viewers || []);
    setShowViewers(true);
  } catch (e) {
    console.log(e);
  }
};

// Auto-next every 5 sec
// Auto-next - wait for video duration
useEffect(() => {
  if (!viewingStatusGroup) return;

  const current = viewingStatusGroup.statuses[currentStatusIndex];
  const isVideo = current?.mediaType === 'video' || current?.mediaUrl?.includes('.mp4');

  if (isVideo) {
    // For video, don't auto-next - wait for onEnded event
    return;
  }

  const timer = setTimeout(() => nextStatus(), 5000); // 5 sec only for image/text
  return () => clearTimeout(timer);
}, [currentStatusIndex, viewingStatusGroup]);


  const isOwnProfile = selectedProfile?._id?.toString() === myId?.toString();

  return (
    <div className={`w-full max-w- mx-auto ${theme === "dark"? "bg-black text-white" : "bg-[#fafafa] text-black"}`}>
      <div className="flex gap-4 overflow-x-auto px-4 py-4">
  {/* ADD STATUS BUTTON */}
  <div onClick={() => setShowAddStatus(true)} className="flex flex-col items-center gap-1 cursor-pointer">
    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center relative border-2 border-dashed">
      <img src={loggedUser?.profilePic || "/placeholder.svg"} className="w-full h-full rounded-full object-cover" />
      <span className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">+</span>
    </div>
    <span className="text-xs">Your Status</span>
  </div>

  {/* OTHER USERS STATUS */}
  {Array.isArray(statusFeed) && statusFeed.map(group => (
    <div key={group.user._id} onClick={() => openStatusViewer(group)} className="flex flex-col items-center gap-1 cursor-pointer">
      <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
        <img src={group.user.profilePic} className="w-full h-full rounded-full object-cover border-2 border-white" />
      </div>
      <span className="text-xs truncate w-20 text-center">{group.user.username}</span>
    </div>
  ))}

  {/* Your old users.map - keep as fallback if no status */}
</div>
      {/* STORIES */}
      <div className={`w-full border ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"} rounded-lg mb-4`}>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4">
          {Array.isArray(users) && users.map(user => (
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

      {/* FEED - same as yours */}
      <div className="w-full flex flex-col gap-4">
        {feed.map(post => {
          const isOwn = (post.postedBy?._id || post.postedBy)?.toString() === myId?.toString();
          const isLiked = post.likes?.some(l => (l?._id || l)?.toString() === myId?.toString());
          return (
            <div key={post._id} className={`border rounded-lg overflow-hidden ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 p-3">
                <img src={post.postedBy?.profilePic || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover" />
                <span className="text-sm font-semibold">{post.postedBy?.username}</span>
                {isOwn && <button onClick={() => handleDeletePost(post._id)} className="ml-auto text-xs text-red-500">Delete</button>}
              </div>
              <div className="w-full aspect-square bg-black overflow-hidden">
                {post.mediaType === "video"? <VideoPost post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} /> : <ImagePostWithMusic post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} />}
              </div>
              <div className="px-3 pt-3 pb-1 flex gap-4 items-center">
                <button onClick={() => handleLikeToggle(post._id)}>{isLiked? <span className="text-red-500">❤</span> : <span>🤍</span>}</button>
                <button onClick={() => document.getElementById(`comment-${post._id}`)?.focus()}>💬</button>
              </div>
              <div className="px-3 text-sm font-semibold">{post.likes?.length > 0 && <p>{post.likes.length} likes</p>}</div>
              <div className="px-3 py-1 text-sm"><p><b>{post.postedBy?.username}</b> {post.caption}</p></div>
              <div className={`px-3 py-3 border-t mt-2 flex items-center gap-2 ${theme === "dark"? "border-zinc-800" : "border-gray-200"}`}>
                <input id={`comment-${post._id}`} value={commentTexts[post._id] || ""} onChange={(e) => setCommentTexts(prev => ({...prev, [post._id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post._id) }} placeholder="Add a comment..." className="flex-1 bg-transparent text-sm outline-none" />
                <button onClick={() => handleAddComment(post._id)} className="text-blue-500 text-sm font-semibold">Post</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROFILE POPUP WITH FOLLOW BUTTON */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProfile(null)}>
          <div className={`rounded-xl p-6 w-full max-w-sm text-center ${theme === "dark"? "bg-zinc-900" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <img src={selectedProfile.profilePic} className="w-20 h-20 rounded-full mx-auto object-cover" />
            <h2 className="font-bold mt-3">{selectedProfile.username}</h2>
            <p className="text-sm text-gray-500">{selectedProfile.bio || ""}</p>

            <div className="flex justify-around mt-4 text-sm">
              <div><b>{selectedProfile.postsCount || 0}</b><p>Posts</p></div>
              <div><b>{selectedProfile.followersCount || 0}</b><p>Followers</p></div>
              <div><b>{selectedProfile.followingCount || 0}</b><p>Following</p></div>
            </div>

            {/* FOLLOW BUTTON */}
            {!isOwnProfile && (
              <div className="mt-6">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`w-full py-2 rounded-lg font-semibold text-sm transition
                    ${profileFollowStatus === "following"
                     ? "bg-blue-800 border border-gray-300 text-black dark:text-white dark:border-zinc-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"}
                  `}
                >
                  {followLoading? "..." :
                   profileFollowStatus === "following"? "Following" :
                   profileFollowStatus === "follow_back"? "Follow Back" : "Follow"}
                </button>
              </div>
            )}

            {isOwnProfile && <p className="mt-6 text-sm text-gray-500">This is you</p>}
          </div>
        </div>
      )}

      {/* ===== PASTE STATUS MODAL HERE ===== */}
      {showAddStatus && (
  <div className="fixed inset-0 bg-black z-[100] flex flex-col">
    <div className="flex justify-between p-4 text-white">
      <button onClick={() => setShowAddStatus(false)} className="text-xl">✕</button>
      <button onClick={handleCreateStatus} className="bg-blue-500 px-4 py-1 rounded-full">Post</button>
    </div>

    <textarea
      value={statusText}
      onChange={(e) => setStatusText(e.target.value)}
      placeholder="Type your status..."
      className="flex-1 bg-black text-white text-2xl text-center p-10 outline-none resize-none"
    />

    {statusFile && (
      <div className="p-4 text-white text-sm text-center">
        Selected: {statusFile.name}
        <button onClick={()=>setStatusFile(null)} className="ml-2 text-red-400">Remove</button>
      </div>
    )}

    <div className="p-4 border-t border-zinc-800">
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setStatusFile(e.target.files[0])}
        className="text-white w-full"
      />
      <p className="text-xs text-gray-400 mt-2">Select file then click Post on top</p>
    </div>
  </div>
)}
      {/* =================================== */}
      {viewingStatusGroup && (
  <div className="fixed inset-0 bg-black z-[200] flex flex-col">
    {/* Progress bar */}
    <div className="flex gap-1 p-2">
      {viewingStatusGroup.statuses.map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded ${i <= currentStatusIndex? 'bg-white' : 'bg-white/30'}`} />
      ))}
    </div>

    {/* Header */}
    <div className="flex justify-between items-center p-3 text-white">
      <div className="flex items-center gap-2">
        <img src={viewingStatusGroup.user?.profilePic} className="w-8 h-8 rounded-full" />
        <span className="text-sm font-semibold">{viewingStatusGroup.user?.username}</span>
        <span className="text-xs text-gray-400">· now</span>
      </div>
      <div className="flex items-center gap-3">
        {viewingStatusGroup.user?._id === myId && (
          <button onClick={() => handleDeleteStatus(viewingStatusGroup.statuses[currentStatusIndex]._id)} className="text-red-400 text-sm">Delete</button>
        )}
        <button onClick={() => setViewingStatusGroup(null)} className="text-xl">✕</button>
      </div>
    </div>

    {/* Media */}
    <div className="flex-1 flex items-center justify-center relative" onClick={nextStatus}>
      {(() => {
       const s = viewingStatusGroup.statuses[currentStatusIndex];
const isVideo = s.mediaUrl?.includes('.mp4') || s.mediaUrl?.includes('video') || s.mediaType === 'video';

if (s.mediaType === 'video' || s.mediaUrl?.includes('video') || s.mediaUrl?.includes('.mp4')) {
  return (
    <video
      src={s.mediaUrl}
      autoPlay
      controls
      playsInline
      className="h-25 w-25"
      onEnded={() => nextStatus()} // next only when video ends
      onError={(e) => console.log("Video error:", e)}
    />
  );
}
if (s.mediaUrl) return <img src={s.mediaUrl} className="h-30 w-20 object-contain" />;
        return (
          <div className="w-full h-full flex items-center justify-center p-10 text-center text-white text-2xl" style={{ background: s.bgColor || '#1a1a1a' }}>
            {s.text}
          </div>
        );
      })()}
      {/* Prev/Next click areas */}
      <div className="absolute left-0 top-0 h-full w-1/2" onClick={(e)=>{ e.stopPropagation(); prevStatus(); }} />
      <div className="absolute right-0 top-0 h-full w-1/2" onClick={(e)=>{ e.stopPropagation(); nextStatus(); }} />
    </div>

    {/* Footer - Viewers */}
    <div className="p-3 text-white text-center">
      {viewingStatusGroup.user?._id === myId? (
        <button onClick={() => fetchViewers(viewingStatusGroup.statuses[currentStatusIndex]._id)} className="text-sm">
          👁️ {viewingStatusGroup.statuses[currentStatusIndex]?.viewers?.length || 0} views - Tap to see viewers
        </button>
      ) : (
        <p className="text-sm">{viewingStatusGroup.statuses[currentStatusIndex]?.text || ''}</p>
      )}
    </div>

    {/* Viewers Sheet */}
    {showViewers && (
      <div className="absolute bottom-0 w-full bg-zinc-900 rounded-t-2xl p-4 max-h-64 overflow-auto">
        <div className="flex justify-between mb-3">
          <h3 className="font-bold">Viewed by {statusViewers.length}</h3>
          <button onClick={()=>setShowViewers(false)}>✕</button>
        </div>
        {statusViewers.map(u => (
          <div key={u._id} className="flex items-center gap-2 py-2">
            <img src={u.profilePic} className="w-8 h-8 rounded-full" />
            <span className="text-sm">{u.username}</span>
          </div>
        ))}
      </div>
    )}
  </div>
)}

      <ToastContainer />
    </div>
  );
}