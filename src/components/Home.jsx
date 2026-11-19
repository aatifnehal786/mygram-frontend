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
const [showCommentsModal, setShowCommentsModal] = useState(null); // will store postId
const [deletingCommentId, setDeletingCommentId] = useState(null);
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
        await apiFetch(`api/posts/unlike/${postId}`, { method: "PUT" });
      } else {
        await apiFetch(`api/posts/like/${postId}`, { method: "PUT" });
      }
    } catch (err) {
      updateFeedPost(postId, { likes: currentPost.likes });
    }
  };

 const handleAddComment = async (postId) => {
  const text = commentTexts[postId]?.trim();
  if (!text) return;

  const currentPost = feed.find(p => p._id?.toString() === postId?.toString());
  if (!currentPost) return;

  const tempComment = {
    _id: `temp-${Date.now()}`,
    text,
    commentedBy: {
      _id: myId,
      username: loggedUser?.username || loggedUser?.user?.username,
      profilePic: loggedUser?.profilePic || loggedUser?.user?.profilePic,
    },
  };

  updateFeedPost(postId, { comments: [...(currentPost.comments || []), tempComment] });
  setCommentTexts(prev => ({...prev, [postId]: "" }));

  try {
    const data = await apiFetch(`/api/posts/comment/${postId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    console.log("comment response", data); // check this now
    const finalComments = data.comments || data.post?.comments || data;
    const arr = Array.isArray(finalComments)? finalComments : finalComments.comments;
    if (arr) updateFeedPost(postId, { comments: arr });

  } catch (err) {
    console.error("Comment failed:", err.message);
    toast.error(err.message);
    updateFeedPost(postId, { comments: currentPost.comments });
    setCommentTexts(prev => ({...prev, [postId]: text }));
  }
};



const postForModal = feed.find(p => p._id?.toString() === showCommentsModal?.toString());

const handleDeleteComment = async (postId, commentId) => {
  if (!window.confirm("Delete this comment?")) return;
  setDeletingCommentId(commentId);
  const currentPost = feed.find(p => p._id?.toString() === postId?.toString());
  const backupComments = currentPost.comments;

  // optimistic remove
  updateFeedPost(postId, { comments: backupComments.filter(c => c._id?.toString()!== commentId?.toString()) });

  try {
    const data = await apiFetch(`/api/posts/comment/${postId}/${commentId}`, {
      method: "DELETE",
    });
    const finalComments = data.comments || data.post?.comments || data;
    const arr = Array.isArray(finalComments)? finalComments : finalComments.comments;
    if (arr) updateFeedPost(postId, { comments: arr });
    toast.success("Comment deleted");
  } catch (err) {
    toast.error(err.message);
    updateFeedPost(postId, { comments: backupComments });
  } finally {
    setDeletingCommentId(null);
  }
};

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    const backup = [...feed];
    removeFeedPost(postId);
    try {
      await apiFetch(`api/posts/delete-post/${postId}`, { method: "DELETE" });
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
    <div className={`w-full max-w- mx-auto ${theme === "dark" ? "bg-[#111B21] text-white" : "bg-[#ECE5DD] text-black"}`}>
  {/* ===== WHATSAPP HEADER FOR HOME ===== */}
  <div className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${theme === "dark" ? "bg-[#202C33]" : "bg-[#075E54] text-white"}`}>
    <h1 className="text- font-bold tracking-wide">MyGram</h1>
    <div className="flex gap-4 items-center">
      <span className="text-xl cursor-pointer">🔍</span>
      <span className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white text-lg cursor-pointer">＋</span>
    </div>
  </div>

  {/* STATUS - WhatsApp Style */}
  <div className="flex gap-4 overflow-x-auto px-4 py-4 scrollbar-hide">
    {/* ADD STATUS BUTTON */}
    <div onClick={() => setShowAddStatus(true)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center relative border-2 border-dashed border-[#25D366]">
        <img src={loggedUser?.profilePic || "/placeholder.svg"} className="w-full h-full rounded-full object-cover" />
        <span className="absolute bottom-0 right-0 bg-[#25D366] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm border-2 border-white">+</span>
      </div>
      <span className="text-xs">Your Status</span>
    </div>

    {/* OTHER USERS STATUS - Green Ring instead of Instagram Gradient */}
    {Array.isArray(statusFeed) && statusFeed.map(group => (
      <div key={group.user._id} onClick={() => openStatusViewer(group)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
        <div className="w-20 h-20 rounded-full p- bg-[#25D366]">
          <div className={`w-full h-full rounded-full p- ${theme === "dark" ? "bg-[#111B21]" : "bg-white"}`}>
            <img src={group.user.profilePic} className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
        <span className="text-xs truncate w-20 text-center">{group.user.username}</span>
      </div>
    ))}
  </div>

  {/* STORIES - WhatsApp Style */}
 
{/* STORIES - WhatsApp Style - FIXED FLICKER */}
<div className={`w-full border rounded-xl mx-2 w-[calc(100%-16px)] mb-4 overflow-hidden ${theme === "dark" ? "bg-[#202C33] border-[#374045]" : "bg-white border-gray-200"}`}>
  <p className={`text- font-semibold px-3 pt-2.5 pb-1 ${theme === "dark" ? "text-[#8696A0]" : "text-[#667781]"}`}>Stories • People you follow</p>
  <div className="flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth px-3 py-2 h-">
    {Array.isArray(users) && users.map(user => (
      <div key={user._id} onClick={() => setSelectedProfile(user)} className="flex flex-col items-center gap-1 min-w- w- cursor-pointer shrink-0">
        <div className="w-16 h-16 rounded-full p- bg-[#25D366] shrink-0">
          <div className={`w-full h-full rounded-full p- ${theme === "dark" ? "bg-[#111B21]" : "bg-white"}`}>
            <img src={user.profilePic || "/placeholder.svg"} alt={user.username} className="w-full h-full rounded-full object-cover" onError={e => e.target.src = "/placeholder.svg"} />
          </div>
        </div>
        <span className="text-xs truncate w- text-center">{user.username}</span>
      </div>
    ))}
    {users.length === 0 && (
      <p className="text-xs text-[#8696A0] py-5 whitespace-nowrap">No people to show yet. Follow someone to see their stories.</p>
    )}
  </div>
</div>

  {/* FEED */}
  <div className="w-full flex flex-col gap-3 px-2 pb-4">
    {feed.map(post => {
      const isOwn = (post.postedBy?._id || post.postedBy)?.toString() === myId?.toString();
      const isLiked = post.likes?.some(l => (l?._id || l)?.toString() === myId?.toString());
      return (
        <div key={post._id} className={`border rounded-xl overflow-hidden shadow-sm ${theme === "dark" ? "bg-[#202C33] border-[#374045]" : "bg-white border-gray-200"}`}>
          {/* Post Header */}
          <div className="flex items-center gap-2 p-3">
            <img src={post.postedBy?.profilePic || "/placeholder.svg"} className="w-9 h-9 rounded-full object-cover border-2 border-[#25D366]" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{post.postedBy?.username}</span>
              <span className="text- text-[#8696A0]">MyGram • now</span>
            </div>
            {isOwn && <button onClick={() => handleDeletePost(post._id)} className="ml-auto text-xs text-red-500 font-semibold">Delete</button>}
          </div>

          {/* Media */}
          <div className="w-full aspect-square bg-black overflow-hidden">
            {post.mediaType === "video" ? <VideoPost post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} /> : <ImagePostWithMusic post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} />}
          </div>

          {/* Like / Comment - WhatsApp Green + Red Heart */}
          <div className="px-3 pt-3 pb-1 flex gap-4 items-center">
            <button onClick={() => handleLikeToggle(post._id)} className="text-">{isLiked ? "❤️" : "🤍"}</button>
            <button onClick={() => document.getElementById(`comment-${post._id}`)?.focus()} className="text-">💬</button>
            <button className="ml-auto text-">↗️</button>
          </div>

          <div className="px-3 text-sm font-semibold">{post.likes?.length > 0 && <p>{post.likes.length} likes</p>}</div>
          <div className="px-3 py-1 text-sm"><p><b>{post.postedBy?.username}</b> {post.caption}</p></div>

          {/* COMMENTS PREVIEW */}
          {post.comments?.length > 0 && (
            <div className="px-3 py-2 flex flex-col gap-1">
              {post.comments.slice(-2).map(c => (
                <p key={c._id} className="text-sm flex justify-between">
                  <span><b className="mr-2">{c.commentedBy?.username}</b>{c.text}</span>
                </p>
              ))}
              {post.comments.length > 2 && (
                <button
                  onClick={() => setShowCommentsModal(post._id)}
                  className="text-xs text-[#8696A0] text-left hover:text-[#25D366]"
                >
                  View all {post.comments.length} comments
                </button>
              )}
            </div>
          )}

          {/* Add Comment */}
          <div className={`px-3 py-3 border-t mt-2 flex items-center gap-2 ${theme === "dark" ? "border-[#374045] bg-[#202C33]" : "border-gray-200 bg-[#F0F2F5]"}`}>
            <input
              id={`comment-${post._id}`}
              value={commentTexts[post._id] || ""}
              onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment(post._id);
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 bg-white dark:bg-[#2A3942] dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#25D366]/30"
            />
            <button
              type="button"
              onClick={() => handleAddComment(post._id)}
              disabled={!commentTexts[post._id]?.trim()}
              className="bg-[#25D366] text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      );
    })}
  </div>

  {/* PROFILE POPUP WITH FOLLOW BUTTON */}
  {selectedProfile && (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProfile(null)}>
      <div className={`rounded-xl p-6 w-full max-w-sm text-center shadow-2xl ${theme === "dark" ? "bg-[#202C33]" : "bg-white"}`} onClick={e => e.stopPropagation()}>
        <img src={selectedProfile.profilePic} className="w-20 h-20 rounded-full mx-auto object-cover border- border-[#25D366]" />
        <h2 className="font-bold mt-3">{selectedProfile.username}</h2>
        <p className="text-sm text-[#8696A0]">{selectedProfile.bio || ""}</p>

        <div className="flex justify-around mt-4 text-sm">
          <div><b>{selectedProfile.postsCount || 0}</b><p className="text-[#8696A0]">Posts</p></div>
          <div><b>{selectedProfile.followersCount || 0}</b><p className="text-[#8696A0]">Followers</p></div>
          <div><b>{selectedProfile.followingCount || 0}</b><p className="text-[#8696A0]">Following</p></div>
        </div>

        {!isOwnProfile && (
          <div className="mt-6">
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`w-full py-2.5 rounded-full font-semibold text-sm transition
                ${profileFollowStatus === "following"
                  ? "bg-transparent border-2 border-[#25D366] text-[#25D366]"
                  : "bg-[#25D366] text-white hover:bg-[#1EBE5A]"}
              `}
            >
              {followLoading ? "..." :
                profileFollowStatus === "following" ? "Following" :
                  profileFollowStatus === "follow_back" ? "Follow Back" : "Follow"}
            </button>
          </div>
        )}

        {isOwnProfile && <p className="mt-6 text-sm text-[#8696A0]">This is you</p>}
      </div>
    </div>
  )}

  {/* ADD STATUS MODAL - WhatsApp Style */}
  {showAddStatus && (
    <div className="fixed inset-0 bg-[#111B21] z-[100] flex flex-col">
      <div className="flex justify-between p-4 text-white bg-[#075E54]">
        <button onClick={() => setShowAddStatus(false)} className="text-xl">✕</button>
        <span className="font-semibold">Add Status</span>
        <button onClick={handleCreateStatus} className="bg-[#25D366] px-4 py-1 rounded-full font-semibold text-sm">Post</button>
      </div>

      <textarea
        value={statusText}
        onChange={(e) => setStatusText(e.target.value)}
        placeholder="Type your status..."
        className="flex-1 bg-[#111B21] text-white text-2xl text-center p-10 outline-none resize-none placeholder:text-[#8696A0]"
      />

      {statusFile && (
        <div className="p-4 text-white text-sm text-center">
          Selected: {statusFile.name}
          <button onClick={() => setStatusFile(null)} className="ml-2 text-red-400">Remove</button>
        </div>
      )}

      <div className="p-4 border-t border-[#374045] bg-[#202C33]">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setStatusFile(e.target.files[0])}
          className="text-white w-full text-sm"
        />
        <p className="text-xs text-[#8696A0] mt-2">Select file then click Post on top</p>
      </div>
    </div>
  )}

  {/* STATUS VIEWER - Same Logic, WhatsApp Header */}
  {viewingStatusGroup && (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      <div className="flex gap-1 p-2">
        {viewingStatusGroup.statuses.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= currentStatusIndex ? 'bg-[#25D366]' : 'bg-white/30'}`} />
        ))}
      </div>

      <div className="flex justify-between items-center p-3 text-white bg-[#075E54]/90">
        <div className="flex items-center gap-2">
          <img src={viewingStatusGroup.user?.profilePic} className="w-8 h-8 rounded-full border-2 border-[#25D366]" />
          <span className="text-sm font-semibold">{viewingStatusGroup.user?.username}</span>
          <span className="text-xs text-white/70">· now</span>
        </div>
        <div className="flex items-center gap-3">
          {viewingStatusGroup.user?._id === myId && (
            <button onClick={() => handleDeleteStatus(viewingStatusGroup.statuses[currentStatusIndex]._id)} className="text-red-400 text-sm">Delete</button>
          )}
          <button onClick={() => setViewingStatusGroup(null)} className="text-xl">✕</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative" onClick={nextStatus}>
        {(() => {
          const s = viewingStatusGroup.statuses[currentStatusIndex];
          if (s.mediaType === 'video' || s.mediaUrl?.includes('video') || s.mediaUrl?.includes('.mp4')) {
            return (
              <video
                src={s.mediaUrl}
                autoPlay
                controls
                playsInline
                className="h-full w-full object-contain"
                onEnded={() => nextStatus()}
                onError={(e) => console.log("Video error:", e)}
              />
            );
          }
          if (s.mediaUrl) return <img src={s.mediaUrl} className="h-full w-full object-contain" />;
          return (
            <div className="w-full h-full flex items-center justify-center p-10 text-center text-white text-2xl" style={{ background: s.bgColor || '#075E54' }}>
              {s.text}
            </div>
          );
        })()}
        <div className="absolute left-0 top-0 h-full w-1/2" onClick={(e) => { e.stopPropagation(); prevStatus(); }} />
        <div className="absolute right-0 top-0 h-full w-1/2" onClick={(e) => { e.stopPropagation(); nextStatus(); }} />
      </div>

      <div className="p-3 text-white text-center bg-[#202C33]">
        {viewingStatusGroup.user?._id === myId ? (
          <button onClick={() => fetchViewers(viewingStatusGroup.statuses[currentStatusIndex]._id)} className="text-sm">
            👁 {viewingStatusGroup.statuses[currentStatusIndex]?.viewers?.length || 0} views - Tap to see viewers
          </button>
        ) : (
          <p className="text-sm">{viewingStatusGroup.statuses[currentStatusIndex]?.text || ''}</p>
        )}
      </div>

      {showViewers && (
        <div className="absolute bottom-0 w-full bg-[#202C33] text-white rounded-t-2xl p-4 max-h-64 overflow-auto">
          <div className="flex justify-between mb-3">
            <h3 className="font-bold">Viewed by {statusViewers.length}</h3>
            <button onClick={() => setShowViewers(false)}>✕</button>
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

  {/* ALL COMMENTS POPUP */}
  {showCommentsModal && postForModal && (
    <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4" onClick={() => setShowCommentsModal(null)}>
      <div
        className={`w-full max-w-md max-h- rounded-xl flex flex-col ${theme === "dark" ? "bg-[#202C33] text-white" : "bg-white text-black"}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[#D1D7DB] dark:border-[#374045] bg-[#075E54] dark:bg-[#202C33] text-white rounded-t-xl">
          <h3 className="font-bold">Comments ({postForModal.comments?.length || 0})</h3>
          <button onClick={() => setShowCommentsModal(null)} className="text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {postForModal.comments?.length === 0 && <p className="text-center text-sm text-[#8696A0]">No comments yet</p>}
          {postForModal.comments?.map(c => {
            const isMyComment = c.commentedBy?._id?.toString() === myId?.toString() || c.commentedBy?.toString() === myId?.toString();
            return (
              <div key={c._id} className="flex gap-3 items-start">
                <img src={c.commentedBy?.profilePic || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm"><b>{c.commentedBy?.username}</b> <span className="ml-2">{c.text}</span></p>
                  <p className="text-xs text-[#8696A0] mt-1">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : "now"}</p>
                </div>
                {isMyComment && (
                  <button
                    onClick={() => handleDeleteComment(postForModal._id, c._id)}
                    disabled={deletingCommentId === c._id}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    {deletingCommentId === c._id ? "..." : "Delete"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className={`p-3 border-t flex gap-2 items-center ${theme === "dark" ? "border-[#374045] bg-[#202C33]" : "border-gray-200 bg-[#F0F2F5]"}`}>
          <input
            value={commentTexts[postForModal._id] || ""}
            onChange={(e) => setCommentTexts(prev => ({ ...prev, [postForModal._id]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment(postForModal._id);
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 bg-white dark:bg-[#2A3942] dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#25D366]/30"
          />
          <button
            type="button"
            onClick={() => handleAddComment(postForModal._id)}
            disabled={!commentTexts[postForModal._id]?.trim()}
            className="bg-[#25D366] text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  )}

  <ToastContainer />
</div>
  );
}