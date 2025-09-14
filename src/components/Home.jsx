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
  apiFetch("/allusers1")
    .then((data) => setUsers(data))
    .catch((err) => console.error("All users fetch error:", err));
}, []);



// CHECK FOLLOW STATUS

useEffect(() => {
  if (Array.isArray(users) && loggedUser?._id) {
    users.forEach((user) => {
      if (user._id !== loggedUser._id) {
        apiFetch(`/follow-status/${user._id}`)
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
  const url = `/${isFollowing ? "unfollow" : "follow"}/${targetUserId}`;

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
    <div className="home">


      {showVerifyMessage ? <p> Mobile Veified</p>: <p>verify Mobile</p>}
     
 <div className="users">
  {Array.isArray(users) && users.map((user) =>
    user._id !== loggedUser._id ? (
      <div className="user" key={user._id}>
        <img
          className="profile-photo-img"
          src={user.profilePic}
          alt={user.username}
        />
        <div className="user-content">
          <h5>{user.username}</h5>
        <button className="follow-btn" onClick={() => handleFollowToggle(user._id)}>
          {followStatus[user._id] ? "Unfollow" : "Follow"}
        </button>
        </div>
      </div>
    ) : null
  )}
</div>

    </div>
  );
}
