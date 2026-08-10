import { useParams } from "react-router-dom";
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

 useEffect(() => {
  if (!targetId) return;

  apiFetch(`api/user/stats/${targetId}`).then(setStats).catch(console.error);

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

  // Followers - from followRoutes
  apiFetch(`api/follow/followers/${targetId}`)
   .then(d => {
      console.log("followers res:", d);
      setFollowers(d?.followers || []);
    })
   .catch(() => setFollowers([]));

  // Following - you don't have this endpoint, so we fake it from followers for now
  // Add this endpoint in backend, for now set empty
  apiFetch(`api/follow/following/${targetId}`).then(d => setFollowing(d.following || [])).catch(()=>setFollowing([]));
}, [targetId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("profilePic", file);
    const data = await apiFetch("api/uploads/profile", { method: "POST", body: fd });
    setStats(p => ({...p, profilePic: data.profilePic}));
  };

  const handleChangeUserName = async () => {
    const data = await apiFetch("api/user/updateprofile", { method: "PUT", body: JSON.stringify({ newUsername }) });
    setStats(p => ({...p, username: data.newUsername}));
    setShowEditName(false);
  };

  if (!stats) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className={`max-w- mx-auto ${theme === "dark"? "text-white" : "text-black"}`}>
      {/* Header */}
      <div className="flex gap-10 md:gap-24 px-4 py-8 border-b border-gray-200 dark:border-zinc-800">
        <div className="relative">
          <img src={loggedUser?.profilePic || "/placeholder.svg"} className="w-20 h-20 md:w-36 md:h-36 rounded-full object-cover" />
          {isOwnProfile && (
            <>
              <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-white border rounded-full px-2 py-1 text-xs">Edit</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
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

      {/* Tabs */}
      <div className="flex justify-center gap-12 border-t text-xs tracking-widest">
        <button onClick={() => setActiveTab("posts")} className={`py-3 border-t ${activeTab === "posts"? "border-black dark:border-white" : "border-transparent text-gray-400"}`}>POSTS</button>
        <button onClick={() => setActiveTab("reels")} className={`py-3 border-t ${activeTab === "reels"? "border-black" : "border-transparent text-gray-400"}`}>REELS</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-1">
        {posts.filter(p => activeTab === "posts"? p.mediaType === "image" : p.mediaType === "video").map(post => (
          <div key={post._id} className="aspect-square bg-black relative group cursor-pointer">
            <img src={post.mediaType === "video"? post.thumbnail || post.mediaUrl : post.mediaUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm gap-4">❤ {post.likes?.length} 💬 {post.comments?.length}</div>
          </div>
        ))}
      </div>

      {/* Edit Username Modal */}
      {showEditName && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className={`p-6 rounded-xl w-[90%] max-w-sm ${theme === "dark"? "bg-zinc-900" : "bg-white"}`}>
            <h3 className="font-semibold mb-4">Change username</h3>
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowEditName(false)}>Cancel</button>
              <button onClick={handleChangeUserName} className="bg-blue-600 text-white px-4 py-1 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-xl overflow-hidden ${theme === "dark"? "bg-zinc-900" : "bg-white"}`}>
            <div className="flex border-b">
              <button onClick={() => setModalTab("followers")} className={`flex-1 py-3 text-sm ${modalTab === "followers"? "font-bold border-b" : ""}`}>Followers</button>
              <button onClick={() => setModalTab("following")} className={`flex-1 py-3 text-sm ${modalTab === "following"? "font-bold border-b" : ""}`}>Following</button>
              <button onClick={() => setShowFollowModal(false)} className="px-4">✕</button>
            </div>
            <div className="max-h- overflow-y-auto p-3 space-y-3">
              {(modalTab === "followers"? followers : following).map(u => (
                <div key={u._id} className="flex items-center gap-3">
                  <img src={u.profilePic || "/placeholder.svg"} className="w-8 h-8 rounded-full" />
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