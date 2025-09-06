import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";   // generate unique deviceId
import { UserContext } from "../contexts/UserContext";
import hide from "../assets/hide.png";
import show from "../assets/show.png";

export default function Login() {
  const loggedData = useContext(UserContext);
  const [user, setUser] = useState({ loginId: "", password: "" });
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false);

  const navigate = useNavigate();

  // ✅ Generate deviceId and persist in localStorage
  useEffect(() => {
    let storedId = localStorage.getItem("deviceId");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("deviceId", storedId);
    }
    setDeviceId(storedId);
  }, []);

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    fetch("https://mygram-1-1nua.onrender.com/login", {
      method: "POST",
      body: JSON.stringify({ ...user, deviceId }), // include deviceId
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json().then((data) => ({ status: res.status, data })))
      .then(({ status, data }) => {
        setIsLoading(false);

        if (status === 200 && data.token) {
          // ✅ login success
          localStorage.setItem("token-auth", JSON.stringify(data));
          sessionStorage.setItem("token-auth", JSON.stringify(data));
          loggedData.setLoggedUser(data);
          navigate("/home", { replace: true });
        } else if (status === 403) {
          // 🚨 approval required
          setMessage({
            type: "info",
            text: "📧 Approval required — check your email to confirm this device.",
          });
        } else {
          setMessage({ type: "error", text: data.message || "Login failed" });
        }
      })
      .catch(() => {
        setIsLoading(false);
        setMessage({ type: "error", text: "⚠️ An error occurred. Please try again." });
      });
  };

  const showHide = () => setIsPassword((prev) => !prev);

  return (
    <section className="container">
      <form className="form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <input
          className="inp"
          type="text"
          placeholder="Enter Username, Email, or Mobile"
          required
          name="loginId"
          onChange={handleInput}
          value={user.loginId}
        />
        <div className="pass2">
          <input
            className="inp"
            type={isPassword ? "text" : "password"}
            placeholder="Enter Password"
            maxLength={16}
            onChange={handleInput}
            required
            name="password"
            value={user.password}
          />
          <img onClick={showHide} src={isPassword ? show : hide} alt="toggle visibility" />
        </div>
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? "Loading..." : "Login"}
        </button>
        <div className="form-content">
          <p>
            Don&apos;t Have an Account? <Link to="/register">Create now</Link>
          </p>
          <Link to="/forgot-password">Forgot Password</Link>
        </div>
        {message.text && <p className={message.type}>{message.text}</p>}
      </form>
    </section>
  );
}
