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

  





  if (loggedUser?.user?.isGuest || loading) {
    return (
      <div className={`min-h-[calc(100vh-60px)] w-full flex flex-col items-center px-4 py-10 ${theme === "dark"? "bg-black text-white" : "bg-[#fafafa] text-black"}`}>

        <div className={`w-full max-w- border rounded-xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className="relative">
            <div className="w- h- md:w- md:h- rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-">
              <div className={`w-full h-full rounded-full flex items-center justify-center ${theme === "dark"? "bg-zinc-900" : "bg-gray-100"}`}>
                <span className="text-3xl md:text-5xl font-bold">
                  {(loggedUser?.user?.username || "G").charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-zinc-500 text-white text- px-2 py-0.5 rounded-full font-bold border-2 border-white dark:border-black">GUEST</div>
          </div>

          <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h1 className="text- font-light">{loggedUser?.user?.username || `guest_${Math.floor(Math.random()*9999)}`}</h1>
              <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500">Limited Access</span>
            </div>
            <div className="flex gap-6 justify-center md:justify-start text-sm">
              <p><b>0</b> posts</p>
              <p><b>0</b> followers</p>
              <p><b>0</b> following</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold">Guest Account</p>
              <p className="text-gray-500 max-w-">You are browsing as a guest. You can view public posts and stories, but you can't like, comment, follow or message.</p>
            </div>
            <div className="flex gap-2 justify-center md:justify-start mt-2">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-1.5 rounded-lg text-sm font-semibold"><Link to="/">Log In</Link></button>
              <button  className={`px-6 py-1.5 rounded-lg text-sm font-semibold ${theme === "dark"? "bg-zinc-800" : "bg-gray-100"}`}><Link to="/register">Sign Up</Link></button>
            </div>
          </div>
        </div>

        <div className="w-full max-w- grid grid-cols-3 gap-1 md:gap-2 mt-10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`aspect-square flex flex-col items-center justify-center gap-2 border ${theme === "dark"? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"}`}>
              <span className="text-2xl opacity-30">🔒</span>
              <span className="text- text-gray-400">Login to view</span>
            </div>
          ))}
        </div>

        <div className="w-full max-w- mt-8 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-xl p-">
          <div className={`rounded- p-6 flex flex-col md:flex-row items-center justify-between gap-4 ${theme === "dark"? "bg-black" : "bg-white"}`}>
            <div>
              <h3 className="font-bold text-sm md:text-base">Join MyGram to unlock everything ✨</h3>
              <p className="text-xs text-gray-500 mt-1">Create posts, like, comment, follow friends and chat.</p>
            </div>
            <button onClick={() => navigate("/register")} className="bg-black dark:bg-white dark:text-black text-white px-5 py-2 rounded-full text-sm font-semibold shrink-0">Create Account</button>
          </div>
        </div>
      </div>
    );
  }


  if (loading || !stats) {
  return <div className="flex justify-center py-20 text-gray-400">Loading...</div>;
}


  // NORMAL PROFILE BELOW
  return (
    <div className={`max-w- mx-auto ${theme === "dark"? "text-white bg-black" : "text-black bg-[#fafafa]"}`}>
      <div className="flex gap-10 md:gap-24 px-4 py-8 border-b border-gray-200 dark:border-zinc-800">
        <div className="relative">
          <img   src={loggedUser?.profilePic || "/default-avatar.png"} alt="profile" className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover" />
    {isOwnProfile && (
  <>
    <button
      onClick={() => fileInputRef.current.click()}
      disabled={uploading}
      className={`absolute bottom-0 right-0 bg-white border rounded-full px-2 py-1 text-xs flex items-center gap-1 disabled:opacity-60 ${theme === "dark"? "bg-zinc-800" : "bg-gray-100"}`}
    >
      {uploading? (
        <>
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          Uploading...
        </>
      ) : (
        "Edit"
      )}
    </button>

    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

    {/* Full avatar loader overlay - put this inside your avatar wrapper which should be `relative` */}
    {uploading && (
      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}
  </>
)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl">{stats.username}</h2>
            {isOwnProfile && <button onClick={() => { setNewUsername(stats.username); setShowEditName(true); }} className={`px-4 py-1 rounded-lg text-sm font-semibold border ${theme === "dark"? "bg-zinc-800" : "bg-gray-100"}`}>Edit profile</button>}
          </div>
          <div className="flex gap-6 md:gap-10 text-sm mb-4">
            <span><b>{stats.postsCount}</b> posts</span>
            <button onClick={() => { setModalTab("followers"); setShowFollowModal(true); }}><b>{followers.length}</b> followers</button>
            <button onClick={() => { setModalTab("following"); setShowFollowModal(true); }}><b>{following.length}</b> following</button>
          </div>
          <p className="text-sm">❤ {stats.likesReceived} likes</p>
        </div>
      </div>

     <div className="flex justify-center gap-12 border-t text-xs tracking-widest">
  <button onClick={() => setActiveTab("posts")} className={`py-3 border-t ${activeTab === "posts"? "border-black dark:border-white font-semibold" : "border-transparent text-gray-400"}`}>POSTS</button>
  <button onClick={() => setActiveTab("reels")} className={`py-3 border-t ${activeTab === "reels"? "border-black dark:border-white font-semibold" : "border-transparent text-gray-400"}`}>REELS</button>
</div>

<div className="grid grid-cols-3 gap-1 md:gap-1">
  {posts.filter(p => activeTab === "posts"? p.mediaType!== "video" : p.mediaType === "video").map(post => (
    <div key={post._id} className="aspect-square bg-black relative group cursor-pointer overflow-hidden">
      {/* IMAGE POSTS */}
      {activeTab === "posts"? (
        <img
          src={post.mediaUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = "/placeholder.svg"}
        />
      ) : (
        // REELS / VIDEO POSTS
        post.thumbnail? (
          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <video
            src={post.mediaUrl}
            muted
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        )
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm gap-4 transition-opacity">
        <span>❤ {post.likes?.length || 0}</span>
        <span>💬 {post.comments?.length || 0}</span>
      </div>

      {/* Play icon for video */}
      {activeTab === "reels" && (
        <div className="absolute top-2 right-2 text-white text-xs">▶</div>
      )}
    </div>
  ))}
</div>

      {showEditName && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className={`p-6 rounded-xl w-[90%] max-w-sm ${theme === "dark"? "bg-zinc-900" : "bg-white"}`}>
            <h3 className="font-semibold mb-4">Change username</h3>
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border rounded-lg px-3 py-2 outline-none" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowEditName(false)} className="text-sm">Cancel</button>
              <button onClick={handleChangeUserName} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {showFollowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-xl overflow-hidden ${theme === "dark"? "bg-zinc-900" : "bg-white"}`}>
            <div className="flex border-b dark:border-zinc-800">
              <button onClick={() => setModalTab("followers")} className={`flex-1 py-3 text-sm ${modalTab === "followers"? "font-bold border-b border-black dark:border-white" : ""}`}>Followers</button>
              <button onClick={() => setModalTab("following")} className={`flex-1 py-3 text-sm ${modalTab === "following"? "font-bold border-b border-black dark:border-white" : ""}`}>Following</button>
              <button onClick={() => setShowFollowModal(false)} className="px-4">✕</button>
            </div>
            <div className="max-h- overflow-y-auto p-3 space-y-3">
              {(modalTab === "followers"? followers : following).map(u => (
                <div key={u._id} className="flex items-center gap-3">
                  <img src={u.profilePic || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-sm">{u.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  
