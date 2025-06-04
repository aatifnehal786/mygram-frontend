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
        Authorization: `Bearer ${loggedUser.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setUsers(data);
      });
  }, []);



  useEffect(() => {
  users.forEach((user) => {
    if (user._id !== loggedUser._id) {
      fetch(`https://mygram-1-1nua.onrender.com/follow-status/${user._id}`, {
        headers: {
          Authorization: `Bearer ${loggedUser.token}`,
        },
      })
        .then((res) => res.json())
        .then((statusData) => {
          setFollowStatus((prev) => ({
            ...prev,
            [user._id]: statusData.isFollowing,
          }));
        });
    }
  });
}, [users]); // ✅ only run when users are loaded



  useEffect(() => {
    // Check if mobile is already verified
    const isVerified = localStorage.getItem("mobileVerified");
    if (isVerified === "true") {
      setShowVerifyMessage(false);
    }
  }, []);

  console.log(userId);

  const handleFollowToggle = async (targetUserId) => {
  const isFollowing = followStatus[targetUserId];

  const url = `https://mygram-1-1nua.onrender.com/${isFollowing ? "unfollow" : "follow"}/${targetUserId}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${loggedUser.token}`,
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
    <section className="home">
      <h1>Welcome to the Home Page</h1>
      {showVerifyMessage && (
        <p>
          Please verify mobile number{" "}
          <Link
            to="/otp"
            onClick={() => setShowVerifyMessage(false)}
          >
            verify mobile
          </Link>
        </p>
      )}
 <div className="users">
  {Array.isArray(users) && users.map((user) =>
    user._id !== loggedUser._id ? (
      <div key={user._id}>
        <img
          className="profile-photo-img"
          src={user.profilePic}
          alt={user.username}
        />
        <h5>{user.username}</h5>
        <button className="follow-btn" onClick={() => handleFollowToggle(user._id)}>
          {followStatus[user._id] ? "Unfollow" : "Follow"}
        </button>
      </div>
    ) : null
  )}
</div>

    </section>
  );
}
