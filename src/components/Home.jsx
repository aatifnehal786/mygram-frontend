import { useEffect, useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";

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
  if (Array.isArray(users) && loggedUser?.userid) {
    users.forEach((user) => {
      if (user._id !== loggedUser._id) {
        apiFetch(`api/follow-status/${user?._id}`)
          .then((statusData) => {
            setFollowStatus((prev) => ({
              ...prev,
              [user._id]: statusData.isFollowing,
            }));
          })
          .catch((err) => console.error("Follow status fetch error:", err));
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
  const isFollowing = followStatus[targetUserId];
  const url = `api/${isFollowing ? "unfollow" : "follow"}/${targetUserId}`;

  try {
    await apiFetch(url, { method: "PUT" });
    setFollowStatus((prev) => ({
      ...prev,
      [targetUserId]: !isFollowing,
    }));
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
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-medium transition
                    ${
                      followStatus[user._id]
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }
                  `}
                >
                  {followStatus[user._id] ? "Unfollow" : "Follow"}
                </button>
              </div>
            )
        )}
    </div>
  </div>
);

}
