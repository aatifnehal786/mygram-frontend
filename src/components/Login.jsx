import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import hide from "../assets/hide.png";
import show from "../assets/show.png";

export default function Login() {
  const loggedData = useContext(UserContext);
  const [user, setUser] = useState({ loginId: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false);

  const navigate = useNavigate();

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    fetch("https://mygram-1-1nua.onrender.com/login", {
      method: "POST",
      body: JSON.stringify(user),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.otpRequired) {
          setOtpStep(true); // move to OTP step
          setMessage({ type: "info", text: data.message });
        } else if (data.token) {
          localStorage.setItem("token-auth", JSON.stringify(data));
          sessionStorage.setItem("token-auth", JSON.stringify(data));
          loggedData.setLoggedUser(data);
          navigate("/home", { replace: true });
        } else {
          setMessage({ type: "error", text: data.message });
        }
      })
      .catch(() => {
        setIsLoading(false);
        setMessage({ type: "error", text: "An error occurred" });
      });
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    setIsLoading(true);

    fetch("https://mygram-1-1nua.onrender.com/verify-device-otp", {
      method: "POST",
      body: JSON.stringify({ loginId: user.loginId, otp }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.token) {
          localStorage.setItem("token-auth", JSON.stringify(data));
          sessionStorage.setItem("token-auth", JSON.stringify(data));
          loggedData.setLoggedUser(data);
          navigate("/home", { replace: true });
        } else {
          setMessage({ type: "error", text: data.message });
        }
      })
      .catch(() => {
        setIsLoading(false);
        setMessage({ type: "error", text: "OTP verification failed" });
      });
  };

  const showHide = () => setIsPassword((prev) => !prev);

  return (
    <section className="container">
      {!otpStep ? (
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
            <img onClick={showHide} src={isPassword ? show : hide} alt="" />
          </div>
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </button>
           <div className="form-content">
            <p>Don't Have an Account ? <Link to='/register'>create now</Link></p>
            <Link to='/forgot-password'>Forgot Password</Link>
          </div>
          <p className={message.type}>{message.text}</p>
        </form>
      ) : (
        <form className="form" onSubmit={handleOtpVerify}>
          <h1>You have looged in other system, Please verify To login</h1>
          <h1>Enter OTP</h1>
          <input
            className="inp"
            type="text"
            placeholder="Enter OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
         
          <p className={message.type}>{message.text}</p>
        </form>
        
      )}
    </section>
  );
}
