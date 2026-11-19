import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useUserStore from "../store/useUserStore";
import { apiFetch } from "../api/apiFetch";
import { useTheme } from "../contexts/ThemeContext";

export default function Profile() {
  const { id } = useParams();
  const loggedUser = useUserStore((s) => s.loggedUser);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [modalTab, setModalTab] = useState("followers");
  const fileInputRef = useRef();
  const { theme } = useTheme();
  const isOwnProfile =!id || id === loggedUser.userid;
  const targetId = id || loggedUser.userid;
  const [newUsername, setNewUsername] = useState("");
  const [showEditName, setShowEditName] = useState(false);
  const updateProfilePic = useUserStore(s => s.updateProfilePic);
 const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!targetId) return;

  apiFetch(`api/posts/allposts`)
   .then(data => {
      if (!Array.isArray(data)) return;
      const mine = data.filter(p => {
        const postedById = p.postedBy?._id || p.postedBy;
        return postedById?.toString() === targetId?.toString();
      });
      setPosts(mine);
    })
   .catch(console.error);
}, [targetId]);



useEffect(() => {
  if (!targetId) return;
  setLoading(true);
  apiFetch(`api/user/stats/${targetId}`)
    .then((data) => setStats(data))
    .catch(console.error)
    .finally(() => setLoading(false));
}, [targetId]);

useEffect(() => {
  if (!targetId) return;

  // Followers - from followRoutes
  apiFetch(`api/user/followers/${targetId}`)
   .then(d => {
      console.log("followers res:", d);
      setFollowers(d?.followers || []);
    })
   .catch(() => setFollowers([]));

  // Following - you don't have this endpoint, so we fake it from followers for now
  // Add this endpoint in backend, for now set empty
  apiFetch(`api/user/following/${targetId}`).then(d => setFollowing(d.following || [])).catch(()=>setFollowing([]));
}, [targetId]);


const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const previewUrl = URL.createObjectURL(file);

  // optimistic update both places
  setStats(p => ({...p, profilePic: previewUrl }));
  

  setUploading(true);
  try {
    const fd = new FormData();
    fd.append("profilePic", file);

    const data = await apiFetch("api/uploads/profile", {
      method: "POST",
      body: fd
    });


    const newUrl = data.profilePic;
    setStats(p => ({...p, profilePic: newUrl}));
    updateProfilePic(newUrl);
    
  } catch (err) {
    console.error(err);
    // revert on fail if you want
    // setLoggedUser(loggedUser)
  } finally {
    setUploading(false);
    e.target.value = "";
  }
};


  const handleChangeUserName = async () => {
    const data = await apiFetch("api/user/updateprofile", { method: "PUT", body: JSON.stringify({ newUsername }) });
    setStats(p => ({...p, username: data.newUsername}));
    setShowEditName(false);
  };

  





  
  
if (loading || !stats) {
  return <div className="flex justify-center py-20 text-[#8696A0]">Loading...</div>

  }
// ===== NORMAL PROFILE =====
return (
  <div className={`max-w- mx-auto min-h-screen ${theme === "dark" ? "text-white bg-[#0B141A]" : "text-black bg-[#ECE5DD]"}`}>
    <div className={`flex gap-6 md:gap-16 px-4 py-8 border-b ${theme === "dark" ? "bg-[#202C33] border-[#374045]" : "bg-white border-gray-200"}`}>
      <div className="relative shrink-0">
        <img src={loggedUser?.profilePic || "/default-avatar.png"} alt="profile" className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover border- border-[#25D366]" />
        {isOwnProfile && (
          <>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className={`absolute bottom-0 right-0 rounded-full px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-60 shadow ${theme === "dark" ? "bg-[#2A3942] text-white" : "bg-[#25D366] text-white hover:bg-[#1EBE5A]"}`}
            >
              {uploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Uploading...
                </>
              ) : (
                "Edit"
              )}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text- font-semibold">{stats.username}</h2>
          {isOwnProfile && <button onClick={() => { setNewUsername(stats.username); setShowEditName(true); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${theme === "dark" ? "bg-[#2A3942] border-[#374045] hover:bg-[#374045]" : "bg-[#F0F2F5] border-gray-200 hover:bg-gray-200"}`}>Edit profile</button>}
        </div>
        <div className="flex gap-6 md:gap-10 text-sm mb-3">
          <span><b>{stats.postsCount}</b> <span className="text-[#8696A0]">posts</span></span>
          <button onClick={() => { setModalTab("followers"); setShowFollowModal(true); }} className="hover:text-[#25D366]"><b>{followers.length}</b> <span className="text-[#8696A0]">followers</span></button>
          <button onClick={() => { setModalTab("following"); setShowFollowModal(true); }} className="hover:text-[#25D366]"><b>{following.length}</b> <span className="text-[#8696A0]">following</span></button>
        </div>
        <p className="text-sm">❤ {stats.likesReceived} <span className="text-[#8696A0]">likes</span></p>
        <p className="text-xs text-[#8696A0] mt-2">Member of MyGram • WhatsApp style profile</p>
      </div>
    </div>

    <div className={`flex justify-center gap-10 text-xs tracking-widest ${theme === "dark" ? "bg-[#202C33]" : "bg-white"}`}>
      <button onClick={() => setActiveTab("posts")} className={`py-3.5 border-b-2 ${activeTab === "posts" ? "border-[#25D366] text-[#25D366] font-bold" : "border-transparent text-[#8696A0]"}`}>POSTS</button>
      <button onClick={() => setActiveTab("reels")} className={`py-3.5 border-b-2 ${activeTab === "reels" ? "border-[#25D366] text-[#25D366] font-bold" : "border-transparent text-[#8696A0]"}`}>REELS</button>
    </div>

    <div className="grid grid-cols-3 gap-1 md:gap-1.5 p-1">
      {posts.filter(p => activeTab === "posts" ? p.mediaType !== "video" : p.mediaType === "video").map(post => (
        <div key={post._id} className="aspect-square bg-black relative group cursor-pointer overflow-hidden rounded-lg">
          {activeTab === "posts" ? (
            <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" onError={(e) => e.target.src = "/placeholder.svg"} />
          ) : (
            post.thumbnail ? (
              <img src={post.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <video src={post.mediaUrl} muted autoPlay playsInline preload="metadata" className="w-full h-full object-cover" />
            )
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm gap-4 transition-opacity">
            <span>❤ {post.likes?.length || 0}</span>
            <span>💬 {post.comments?.length || 0}</span>
          </div>
          {activeTab === "reels" && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text- w-6 h-6 rounded-full flex items-center justify-center">▶</div>
          )}
        </div>
      ))}
    </div>

    {posts.length === 0 && (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-30">📷</div>
        <p className="font-semibold">No posts yet</p>
        <p className="text-sm text-[#8696A0] mt-1">Share your first moment with MyGram</p>
      </div>
    )}

    {showEditName && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className={`p-6 rounded-2xl w-[90%] max-w-sm shadow-2xl ${theme === "dark" ? "bg-[#202C33]" : "bg-white"}`}>
          <h3 className="font-semibold mb-4">Change username</h3>
          <input value={newUsername} onChange={e => setNewUsername(e.target.value)} className={`w-full rounded-full px-4 py-2.5 outline-none text-sm border ${theme === "dark" ? "bg-[#2A3942] border-[#374045] focus:border-[#25D366]" : "bg-[#F0F2F5] border-transparent focus:border-[#25D366] focus:bg-white"}`} />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowEditName(false)} className={`text-sm px-4 py-2 rounded-full ${theme === "dark" ? "bg-[#2A3942]" : "bg-[#F0F2F5]"}`}>Cancel</button>
            <button onClick={handleChangeUserName} className="bg-[#25D366] hover:bg-[#1EBE5A] text-white px-5 py-2 rounded-full text-sm font-semibold">Save</button>
          </div>
        </div>
      </div>
    )}

    {showFollowModal && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl ${theme === "dark" ? "bg-[#202C33]" : "bg-white"}`}>
          <div className={`flex border-b ${theme === "dark" ? "border-[#374045]" : "border-gray-200"}`}>
            <button onClick={() => setModalTab("followers")} className={`flex-1 py-3.5 text-sm ${modalTab === "followers" ? "font-bold text-[#25D366] border-b-2 border-[#25D366]" : "text-[#8696A0]"}`}>Followers</button>
            <button onClick={() => setModalTab("following")} className={`flex-1 py-3.5 text-sm ${modalTab === "following" ? "font-bold text-[#25D366] border-b-2 border-[#25D366]" : "text-[#8696A0]"}`}>Following</button>
            <button onClick={() => setShowFollowModal(false)} className="px-4 text-[#8696A0]">✕</button>
          </div>
          <div className="max-h- overflow-y-auto p-3 space-y-1">
            {(modalTab === "followers" ? followers : following).map(u => (
              <div key={u._id} className={`flex items-center gap-3 p-2 rounded-xl ${theme === "dark" ? "hover:bg-[#2A3942]" : "hover:bg-[#F0F2F5]"}`}>
                <img src={u.profilePic || "/placeholder.svg"} className="w-10 h-10 rounded-full object-cover" />
                <span className="text-sm font-medium">{u.username}</span>
              </div>
            ))}
            {(modalTab === "followers" ? followers : following).length === 0 && (
              <p className="text-center text-sm text-[#8696A0] py-8">No {modalTab} yet</p>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
  
}

  
