import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import hide from "../assets/hide.png";
import show from "../assets/show.png";
import { apiFetch } from '../api/apiFetch'
import { toast, ToastContainer } from "react-toastify";
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
  setUser((prev) => ({...prev, [e.target.name]: e.target.value.trim()
  }));
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

    console.log("Login response:", data);
    if (data.token) {
      setLoggedUser(data);
      toast.success("Login Successful");
      navigate("/home");
    }
  } catch (err) {
    console.error(err);
    // err.message will be "Incorrect password" from apiFetch
    toast.error(err.message || "Login failed");
  } finally {
    setIsLoading(false);
  }
};

  const showHide = () => setIsPassword((prev) => !prev);

 return (
    <section className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center">
      <div className="flex w-full max-w-[935px] justify-center gap-8 px-4 mt-8">

        {/* Left - Phone mockup - hide on mobile like Instagram */}
        <div className="hidden lg:block relative w-[380px] h-[581px] bg-[url('https://static.cdninstagram.com/images/instagram/xig/homepage/phones/home-phones.png?31d6ffed')] bg-no-repeat bg-[length:468px_634px] bg-[-46px_0]">
          <img
            src="https://static.cdninstagram.com/images/instagram/xig/homepage/screenshots/screenshot1.png?d6bf0c928b5a"
            className="absolute top-[27px] left-[112px] w-[250px] h-[538px] object-cover rounded-[2px]"
            alt=""
          />
        </div>

        {/* Right - Form */}
        <div className="w-full max-w-[350px] flex flex-col gap-2.5">
          {/* Main Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#dbdbdb] flex flex-col items-center px-10 pt-8 pb-6"
          >
            {/* Instagram Logo */}
            <h1
              className="font-[Grand_Hotel] text-[51px] mb-8 tracking-wide"
              style={{ fontFamily: "'Grand Hotel', cursive" }}
            >
              Instagram
            </h1>

            <div className="w-full flex flex-col gap-2">
              <div className="relative">
                <input
                  placeholder="Username or Email"
                  type="text"
                  onChange={handleInput}
                  required
                  name="loginId"
                  value={user.loginId}
                  className="w-full h-[38px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] px-2 text-[12px] outline-none focus:border-[#a8a8a8]"
                />
              </div>

              <div className="relative">
                <input
                  placeholder="Password"
                  type={isPassword? "text" : "password"}
                  onChange={handleInput}
                  maxLength={16}
                  required
                  name="password"
                  value={user.password}
                  className="w-full h-[38px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] px-2 pr-16 text-[12px] outline-none focus:border-[#a8a8a8]"
                />
                <button
                  type="button"
                  onClick={showHide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-semibold"
                >
                  <img className="w-5 h-5 opacity-60" src={isPassword? show : hide} alt="" />
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg text-sm font-semibold mt-3 disabled:opacity-70 disabled:pointer-events-none"
                disabled={isLoading ||!user.loginId ||!user.password}
              >
                {isLoading? <Spinner /> : "Log in"}
              </button>

              <div className="flex items-center my-3 gap-4">
                <div className="h-[1px] bg-[#dbdbdb] flex-1" />
                <span className="text-[13px] font-semibold text-[#8e8e8e]">OR</span>
                <div className="h-[1px] bg-[#dbdbdb] flex-1" />
              </div>

              <Link
                to="/forgot-password"
                className="text-[12px] text-[#00376b] text-center mt-2"
              >
                Forgot password?
              </Link>

              <Link
                to="/guest-login"
                className="w-full h-8 border border-[#dbdbdb] bg-[#fafafa] text-[#00376b] rounded-lg flex items-center justify-center gap-2 text-[14px] font-semibold mt-3 hover:bg-[#f0f0f0]"
              >
                <span className="text-lg text-blue-500 hover:text-green-500">👤</span> Continue as Guest
              </Link>
            </div>
          </form>

          {/* Signup Card */}
          <div className="bg-white border border-[#dbdbdb] h-[63px] flex items-center justify-center text-[14px]">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="text-[#0095f6] font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          {/* Get the app */}
          <div className="flex flex-col items-center mt-2">
            <p className="text-[14px] mb-3">Get the app.</p>
            <div className="flex gap-2">
              <img
                src="https://static.cdninstagram.com/rsrc.php/v3/yz/r/c5Rp7Ym-Klz.png"
                className="h-10"
                alt="app store"
              />
              <img
                src="https://static.cdninstagram.com/rsrc.php/v3/yu/r/EHY6QnZYdNX.png"
                className="h-10"
                alt="play store"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer like Instagram */}
      <footer className="mt-16 mb-10 text-[12px] text-[#8e8e8e] flex flex-wrap justify-center gap-x-3 gap-y-2 max-w-[1200px]">
        <span>Meta</span><span>About</span><span>Blog</span><span>Jobs</span><span>Help</span>
        <span>API</span><span>Privacy</span><span>Terms</span><span>Locations</span>
        <span>Instagram Lite</span><span>Threads</span><span>Contact Uploading & Non-Users</span>
        <span>Meta Verified</span>
      </footer>
    </section>
  );
}