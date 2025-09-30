import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import hide from "../assets/hide.png";
import show from "../assets/show.png";
import { v4 as uuidv4 } from "uuid";
import {apiFetch} from '../api/apiFetch'

export default function Login() {
  const loggedData = useContext(UserContext);
  const [user, setUser] = useState({ loginId: "", password: "" });
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  // ✅ Persist deviceId
  useEffect(() => {
    let savedId = localStorage.getItem("deviceId");
    if (!savedId) {
      savedId = uuidv4();
      localStorage.setItem("deviceId", savedId);
    }
    setDeviceId(savedId);
  }, []);

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

 

  // HANDLE DEVICE LOGIN

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const data = await apiFetch("api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...user, deviceId }),
    });

    setIsLoading(false);

    if ( data.token!=null) {
      loggedData.setLoggedUser(data);
      localStorage.setItem("token-auth", JSON.stringify(data));
      navigate("/home");
    } else if (data.otpRequired) {
      setOtpRequired(true);
      setEmail(data.email);
      setMessage({
        type: "info",
        text: "OTP sent to your email. Please verify.",
      });
    } else {
      setMessage({ type: "error", text: data.message || "Login failed" });
    }
  } catch (err) {
    console.error(err);
    setIsLoading(false);
    setMessage({ type: "error", text: "An error occurred" });
  }
};


// HANDLE NEW DEVICE VERIFY LOGIN VIA OTP

const handleVerifyOtp = async () => {
  setIsLoading(true);

  try {
    const data = await apiFetch("api/verify-device-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp, deviceId }),
    });

    setIsLoading(false);

    if (data.token) {
      loggedData.setLoggedUser(data);
      localStorage.setItem("token-auth", JSON.stringify(data));
      navigate("/home");
    } else {
      setMessage({
        type: "error",
        text: data.message || "OTP verification failed",
      });
    }
  } catch (err) {
    console.error(err);
    setIsLoading(false);
    setMessage({
      type: "error",
      text: "An error occurred during OTP verification",
    });
  }
};

 useEffect(()=>{
    console.log(deviceId,email,otp)
  },[handleVerifyOtp])

  const showHide = () => setIsPassword((prev) => !prev);

  return (
    <section className="container">
      {!otpRequired ? (
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
            <img onClick={showHide} src={isPassword ? show : hide} alt="toggle" />
          </div>
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </button>
          <div className="form-content">
            <p>
              Don't Have an Account ? <Link to="/register">create now</Link>
            </p>
            <Link to="/forgot-password">Forgot Password</Link>
          </div>
          <p className={message.type}>{message.text}</p>
        </form>
      ) : (
        <form className="form3">
          <input
            className="inp"
            type="text"
            placeholder="Enter OTP"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            onClick={handleVerifyOtp}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}
    </section>
  );
}
