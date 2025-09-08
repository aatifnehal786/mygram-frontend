import { useEffect, useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { Link } from "react-router-dom";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [showVerifyMessage, setShowVerifyMessage] = useState(true); // Renamed for clarity
  const { loggedUser } = useContext(UserContext);
  const [followStatus, setFollowStatus] = useState({});

  console.log(loggedUser);

  useEffect(() => {
    fetch("https://mygram-1-1nua.onrender.com/allusers1", {
      method: "GET",
     headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loggedUser?.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      
        setUsers(data);
      });
  }, []);



  useEffect(() => {
  if (Array.isArray(users) && loggedUser?._id) {
    users.forEach((user) => {
      if (user._id !== loggedUser._id) {
        fetch(`https://mygram-1-1nua.onrender.com/follow-status/${user._id}`, {
         headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loggedUser?.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
        })
          .then((res) => res.json())
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

  

  const handleFollowToggle = async (targetUserId) => {
  const isFollowing = followStatus[targetUserId];

  const url = `https://mygram-1-1nua.onrender.com/${isFollowing ? "unfollow" : "follow"}/${targetUserId}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loggedUser?.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
    });

    const data = await res.json();

    if (res.ok) {
      setFollowStatus((prev) => ({
        ...prev,
        [targetUserId]: !isFollowing,
      }));
    } else {
      console.error("Failed to toggle follow:", data.error);
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
  }
};


  return (
    <div className="home">
     
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
