import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
// import { UserContext } from "../contexts/UserContext";
import hide from "../assets/hide.png";
import show from "../assets/show.png";
import {apiFetch} from '../api/apiFetch'
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";
import useUserStore from "../store/useUserStore";

export default function Login() {
  // const loggedData = useContext(UserContext);
  const [user, setUser] = useState({ loginId: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [email, setEmail] = useState("");
  const setLoggedUser = useUserStore((state) => state.setLoggedUser);
 



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

  

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

 

  // HANDLE DEVICE LOGIN

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  if (!user.loginId || !user.password) {
    toast.error("All fields are required");
    setIsLoading(false);
    return;
  }

  try {
    const data = await apiFetch("api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...user }),
    });

    setIsLoading(false);
    console.log("Login response:", data);

    // ❗ IMPORTANT: check if data exists
    if (!data) return;

    // ✅ CASE 1: Login success
    if (data.token) {
    
setLoggedUser(data);


     
       toast.success("Login Successful");
      navigate("/home");
     
    }

    else {
      toast.error(data.message || "Login failed");
    }

  } catch (err) {
    console.error(err);
    setIsLoading(false);
    toast.error("Server error occurred");
  }
};


  const showHide = () => setIsPassword((prev) => !prev);

  return (
  <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
    
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
          {isLoading ? <Spinner/> : "Login"}
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
          <br/>
          <Link
            to="/guest-login"
            className="text-indigo-600 hover:underline font-medium"
          >
            or Continue as Guest
          </Link>

        </div>

        {/* Message */}
       
      </form>
      
    
      
    
   
  </section>
);

}
