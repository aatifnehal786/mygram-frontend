import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import hide from "../assets/hide.png";
import show from "../assets/show.png";
import { apiFetch } from '../api/apiFetch'
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";
import useUserStore from "../store/useUserStore";

export default function Login() {
  const [user, setUser] = useState({ loginId: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const setLoggedUser = useUserStore((state) => state.setLoggedUser);
  const navigate = useNavigate();

  const handleInput = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
      if (!data) return;

      if (data.token) {
        setLoggedUser(data);
        toast.success("Login Successful");
        navigate("/home");
      } else {
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
    <section className="container">
      <form onSubmit={handleSubmit} className="form">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>

        {/* FIXED: name="loginId" value={user.loginId} */}
        <div className="input-group">
          <input
            placeholder=" "
            type="text"
            onChange={handleInput}
            required
            name="loginId"
            value={user.loginId}
          />
          <label>Username / Email</label>
        </div>

        <div className="input-group">
          <input
            placeholder=" "
            type={isPassword? "text" : "password"}
            onChange={handleInput}
            maxLength={16}
            required
            name="password"
            value={user.password}
          />
          <label>Password</label>
          <img className="pass2" onClick={showHide} src={isPassword? show : hide} alt="" />
        </div>

        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading? <Spinner /> : "Join"}
        </button>

        <div className="text-sm text-center space-y-2">
          <p>
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              Create now
            </Link>
          </p>
          <Link to="/forgot-password" className="text-indigo-600 hover:underline font-medium">
            Forgot Password?
          </Link>
          <br/>
          <Link to="/guest-login" className="text-indigo-600 hover:underline font-medium">
            or Continue as Guest
          </Link>
        </div>
      </form>
    </section>
  );
}