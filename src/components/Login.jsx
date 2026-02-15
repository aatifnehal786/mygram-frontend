import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import hide from "../assets/hide.png";
import show from "../assets/show.png";
import { v4 as uuidv4 } from "uuid";
import {apiFetch} from '../api/apiFetch'
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  // handle enter key for both forms
  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      if (otpRequired) {
        handleVerifyOtp();
      } else {
        handleSubmit(e);
      }
    }
  };

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

  if (!user.loginId || !user.password) {
    toast.error("All fields are required");
     setTimeout(() => {
      setUser({ loginId: "", password: "" });
    }, 5000);
    setIsLoading(false);
    return;
  }

  try {
    const data = await apiFetch("api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...user, deviceId }),
    });

    setIsLoading(false);
    console.log(data)

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

  if (!otp) {
    toast.error("OTP is required");
    setIsLoading(false);
    return;
  }

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



  const showHide = () => setIsPassword((prev) => !prev);

  return (
  <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
    {!otpRequired ? (
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Login
        </h1>

        {/* Login ID */}
        <input
          type="text"
          placeholder="Username, Email, or Mobile"
          required
          name="loginId"
          onKeyDown={handleEnterKey}
          onChange={handleInput}
          value={user.loginId}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Password */}
        <div className="relative">
          <input
            type={isPassword ? "text" : "password"}
            placeholder="Password"
            maxLength={16}
            onChange={handleInput}
            onKeyDown={handleEnterKey}
            required
            name="password"
            value={user.password}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <img
            onClick={showHide}
            src={isPassword ? show : hide}
            alt="toggle"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {/* Links */}
        <div className="text-sm text-center space-y-2">
          <p>
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:underline font-medium"
            >
              Create now
            </Link>
          </p>

          <Link
            to="/forgot-password"
            className="text-indigo-600 hover:underline font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Message */}
        <ToastContainer position="top-right" autoClose={3000} />
      </form>
    ) : (
      /* OTP FORM */
      <form className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Verify OTP
        </h2>

        <input
          type="text"
          placeholder="Enter OTP"
          required
          value={otp}
          onKeyDown={handleEnterKey}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    )}
  </section>
);

}
