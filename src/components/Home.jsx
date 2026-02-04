import { useEffect, useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [showVerifyMessage, setShowVerifyMessage] = useState(false); // Renamed for clarity
  const { loggedUser } = useContext(UserContext);
  const [followStatus, setFollowStatus] = useState(null);
  const [loadingUserId, setLoadingUserId] = useState(null);


  console.log(loggedUser);
// FETCH ALL USERS

useEffect(() => {
  apiFetch("api/user/allusers1")
    .then((data) => setUsers(data))
    .catch((err) => console.error("All users fetch error:", err));
}, []);




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
}, [users, loggedUser]);






  useEffect(() => {
    // Check if mobile is already verified
    const isVerified = localStorage.getItem("mobileVerified");
    if (isVerified === "true") {
      setShowVerifyMessage(true);
    }
  }, []);

  

// TOGGLE FOLLOW AND UNFOLLOW
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


 return (
  <div className="min-h-screen bg-gray-100 px-4 py-6">

    {/* Verification Banner */}
    <div className="max-w-5xl mx-auto mb-4">
      {showVerifyMessage ? (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm">
          ✅ Mobile verified
        </div>
      ) : (
        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-md text-sm">
          ⚠️ Verify your mobile number
          <Link to="/otp" className="underline ml-2 font-medium">Click here to verify</Link>
        </div>
      )}
    </div>

    {/* Users Grid */}
    <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
     {Array.isArray(users) &&
  users.map(
    (user) => {
      if (user._id === loggedUser._id) return null;

    

      return (
        <div
          key={user._id}
          className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center text-center"
        >
          <img
            src={user.profilePic || ""}
            alt={user.username}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />

          <h5 className="font-medium text-sm mb-2">
            {user.username}
          </h5>

          
{followStatus[user._id] === undefined ? (
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
);

}
