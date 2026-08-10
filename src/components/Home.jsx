import { useEffect, useState, useRef } from "react";
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
  const [followStatus, setFollowStatus] = useState({});
  const [posts, setPosts] = useState([]);
  const [publicPosts, setPublicPosts] = useState([]);
  const loggedUser = useUserStore(s => s.loggedUser);
  const { theme } = useTheme();
  const isGuest = loggedUser?.user?.isGuest;

  useEffect(() => {
    apiFetch("api/user/stats").then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    const url = isGuest? "api/posts/public-posts" : "api/posts/allposts";
    apiFetch(url).then(d => isGuest? setPublicPosts(d) : setPosts(d));
  }, [isGuest]);

  useEffect(() => {
    if (!users.length ||!loggedUser?.userid) return;
    Promise.all(users.map(async u => {
      try { const r = await apiFetch(`api/follow/follow-status/${u._id}`); return [u._id, r.status]; } catch { return [u._id, "follow"]; }
    })).then(a => setFollowStatus(Object.fromEntries(a)));
  }, [users]);

  const feed = isGuest? publicPosts : posts;

  return (
    <div className={`w-full max-w-[630px] mx-auto ${theme === "dark"? "bg-black text-white" : "bg-[#fafafa] text-black"}`}>

      {/* STORIES - FIXED CIRCLE */}
      <div className={`w-full border-b ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
        <div className="max-w-4xl mx-auto flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4">
          {users.map(user => (
            <div key={user._id} onClick={() => setSelectedProfile(user)} className="flex flex-col items-center gap-1 min-w- cursor-pointer">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <img src={user.profilePic || "/placeholder.svg"} alt={user.username} className="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <span className="text-sm truncate w-full text-center">{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEED - FIXED ASPECT */}
      <div className="w-30 mx-auto mt-4 flex justify-center align-center gap-4 flex-col max-w-4xl">
        {feed.map(post => (
          <div key={post._id} className={`border rounded-lg overflow-hidden ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 p-3">
              <img src={post.postedBy?.profilePic || "/placeholder.svg"} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-semibold">{post.postedBy?.username}</span>
            </div>

            {/* THIS FIXES BLACK BARS */}
            <div className="w-full  flex justify-between">
              <div className="w-20 h-20">
                {post.mediaType === "video"? (
                  <VideoPost post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} />
                ) : (
                  <ImagePostWithMusic post={post} currentlyPlayingId={currentlyPlayingId} setCurrentlyPlayingId={setCurrentlyPlayingId} />
                )}
              </div>
            </div>

            <div className="p-3 text-sm">
              <p><b>{post.postedBy?.username}</b> {post.caption}</p>
              <p className="text-gray-500 text-xs mt-1">{post.likes?.length} likes</p>
            </div>
          </div>
        ))}
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