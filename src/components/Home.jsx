import { useEffect, useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [showVerifyMessage, setShowVerifyMessage] = useState(true); // Renamed for clarity
  const { loggedUser } = useContext(UserContext);
  const [followStatus, setFollowStatus] = useState({});

  console.log(loggedUser);
// FETCH ALL USERS

useEffect(() => {
  apiFetch("api/user/allusers1")
    .then((data) => setUsers(data))
    .catch((err) => console.error("All users fetch error:", err));
}, []);



// CHECK FOLLOW STATUS

useEffect(() => {
  if (Array.isArray(users) && loggedUser?._id) {
    users.forEach((user) => {
      if (user._id !== loggedUser._id) {
        apiFetch(`api/follow-status/${user._id}`)
          .then((statusData) => {
            setFollowStatus((prev) => ({
              ...prev,
              [user._id]: statusData.status, // "following" | "requested" | "none"
            }));
          })
          .catch((err) =>
            console.error("Follow status fetch error:", err)
          );
      }
    });
  }
}, [users, loggedUser]);





  useEffect(() => {
    // Check if mobile is already verified
    const isVerified = localStorage.getItem("mobileVerified");
    if (isVerified === "true") {
      setShowVerifyMessage(false);
    }
  }, []);

  

// TOGGLE FOLLOW AND UNFOLLOW

const handleFollowToggle = async (targetUserId) => {
  const status = followStatus[targetUserId]; // "following" | "requested" | undefined

  try {
    // 🔴 UNFOLLOW
    if (status === "following") {
      await apiFetch(`api/unfollow/${targetUserId}`, {
        method: "POST",
      });

      setFollowStatus((prev) => ({
        ...prev,
        [targetUserId]: "none",
      }));
    }

    // 🟡 SEND FOLLOW REQUEST
    else if (!status || status === "none") {
      await apiFetch(`api/follow/request/${targetUserId}`, {
        method: "POST",
      });

      setFollowStatus((prev) => ({
        ...prev,
        [targetUserId]: "requested",
      }));
    }

    // 🟠 REQUESTED → do nothing (or show toast)
    else if (status === "requested") {
      toast.info("Follow request already sent ⏳");
    }
  } catch (error) {
    console.error("Error toggling follow:", error.message);
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
          <Link
            to="/otp"
            className="underline ml-2 font-medium"  
            onClick={() => setShowVerifyMessage(false)}
          >
            Click here to verify
          </Link>
        </div>
      )}
    </div>

    {/* Users Grid */}
    <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.isArray(users) &&
        users.map(
          (user) =>
            user._id !== loggedUser._id && (
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

                <button
  onClick={() => handleFollowToggle(user._id)}
  disabled={followStatus[user._id] === "requested"}
  className={`
    px-4 py-1 rounded-md text-sm
    ${
      followStatus[user._id] === "following"
        ? "bg-gray-200 text-black"
        : followStatus[user._id] === "requested"
        ? "bg-yellow-400 text-black cursor-not-allowed"
        : "bg-blue-600 text-white hover:bg-blue-700"
    }
  `}
>
  {followStatus[user._id] === "following"
    ? "Following"
    : followStatus[user._id] === "requested"
    ? "Requested"
    : "Follow"}
</button>

              </div>
            )
        )}
    </div>
    <ToastContainer position="top-right" autoClose={3000} />
  </div>
);

}
