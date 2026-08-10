import { useParams } from "react-router-dom";
import {  useEffect, useState, useRef } from "react";
import useUserStore from "../store/useUserStore";
import { apiFetch } from "../api/apiFetch"; // 👈 adjust path as needed
import { useTheme } from "../contexts/ThemeContext";

export default function Profile() {


  const { id } = useParams();
  const loggedUser = useUserStore((state) => state.loggedUser);

  
  const [stats, setStats] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();

  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("followers"); // or "following"
  

  const isOwnProfile = loggedUser && (!id || id === loggedUser.userid);
  const targetUserId = loggedUser?.userid;
  const { theme } = useTheme();








  // FETCH STATS AND POSTS
  useEffect(() => {
    if (!targetUserId || !loggedUser?.token) return;

    async function fetchStatsAndPosts() {
      try 
      {
        const statsData = await apiFetch(`api/user/stats/${targetUserId}`);
        console.log("Fetched stats:", statsData);
        setStats(statsData);
      }
      catch (err) 
      {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchStatsAndPosts();
  }, [targetUserId, loggedUser]);

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


 // Profile UI for guest users




  // public posts section
  


  

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loggedUser?.user?.isGuest && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Guest User Notice</p>
          <p>You are currently logged in as a guest. Some features may be limited.</p>
          <p className="mt-2 text-sm">To access all features, please register or log in with a full account.</p>
          <h1 className="mt-2 text-xl text-gray-600">
            Welcome, {loggedUser?.user?.fullName || "Guest"}! You can view your profile and posts, but some actions may be restricted.
          </h1>
        </div>
      )}
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
                {followers.length === 0 ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : followers.length === 0 ? (
                  <p className="text-sm text-gray-400">No followers yet</p>
                ) : ( Array.isArray(followers) ?
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
                  )) : null
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
                ) : ( Array.isArray(following) ?
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
                  )) : null
                )}
              </div>
            </div>

          </div>
        </div>

       {stats && (
        <div className="flex-1 space-y-6">
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
                    className={`absolute bottom-2 right-2 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} text-sm px-3 py-1 rounded-full shadow`}
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
                    className={`text-sm px-2 py-1 rounded-md border ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"
                      }`}
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
        </div>
        </div>
       )}

        {/* ===== USERNAME MODAL ===== */}
        {isUsernameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-[90%] max-w-md p-6">
              <h3 className={`text-lg font-semibold mb-4 text-center ${theme === "dark" ? "text-red-400" : "text-black"}`}>
                Change Username
              </h3>

              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}`}
                placeholder="Enter new username"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsUsernameModalOpen(false)}
                  className={`px-4 py-2 text-sm border rounded-lg ${theme === "dark" ? "bg-gray-600 text-white" : "bg-gray-300 text-black"}`}
                >
                  Cancel
                </button>

                <button
                  disabled={newUsername === stats.username || !newUsername.trim()}
                  onClick={() => {
                    handleChangeUserName(newUsername);
                    setIsUsernameModalOpen(false);
                  }}
                  className={`px-4 py-2 text-sm rounded-lg text-white ${theme === "dark" ? "bg-indigo-600 disabled:bg-gray-400 hover:bg-green-800 hover:text-red-500" : "bg-indigo-600 disabled:bg-gray-400 hover:bg-green-800 hover:text-red-500"}`}
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
              className={`flex-1 py-2 text-sm ${activeTab === "followers"
                  ? "border-b-2 border-black font-medium"
                  : "text-gray-500"
                }`}
            >
              Followers
            </button>

            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-2 text-sm ${activeTab === "following"
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


    </div>
  );


}