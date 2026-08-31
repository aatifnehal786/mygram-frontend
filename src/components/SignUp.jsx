import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'
import { apiFetch } from "../api/apiFetch";
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";

export default function SignUp(){

    const [userDetails,setUserDetails] = useState({
        username:"",
        email:"",
        password:"",
        confirmPassword: "",
        mobile:""
    })
    const [isLoading, setIsLoading] = useState(false);
    const [isPassword,setIsPassword] = useState(false)
    const [isConfirmPassword,setIsConfirmPassword] = useState(false)
    const [strength, setStrength] = useState("");
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [passwordError, setPasswordError] = useState("");

    // handle enter key for form submission
    const handleEnterKey = (e) => {
        if (e.key === "Enter") {
            handleSubmit(e);
        }
    };

  

    const handleInput = (e)=>{
        e.preventDefault();
        setUserDetails((prev)=>{
            return {...prev,[e.target.name]:e.target.value}
        })
        console.log(userDetails)


    }

    useEffect(() => {
    const val = userDetails.password;

    const weakRegex = /.{1,5}/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.{6,})/;
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (strongRegex.test(val)) setStrength("strong");
    else if (mediumRegex.test(val)) setStrength("medium");
    else if (weakRegex.test(val)) setStrength("weak");
    else setStrength("");

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setStrength("");
    }, 3000);

    setTypingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [userDetails.password]);

  const getStrengthColor = () => {
    switch (strength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

   // 🔁 Confirm Password Validation
  useEffect(() => {
    if (!userDetails.confirmPassword) {
      setPasswordError("");
      return;
    }

    if (userDetails.password !== userDetails.confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [userDetails.password, userDetails.confirmPassword]);

  const getStrengthText = () => {
    switch (strength) {
      case "weak":
        return "Weak Password";
      case "medium":
        return "Medium Password";
      case "strong":
        return "Strong Password";
      default:
        return "";
    }
  };

    
    const showHide = ()=>{
        setIsPassword((prev)=>!prev)
    }
    const showHide2 = ()=>{
        setIsConfirmPassword((prev)=>!prev)
    }

  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!userDetails.username || !userDetails.email || !userDetails.password || !userDetails.mobile || !userDetails.confirmPassword) {
    toast.error("All fields are required");
     setTimeout(() => {
      setUserDetails({
        username: "",
        email: "",
        password: "",
        mobile: "",
        confirmPassword: ""
      });
    }, 5000);
    return;
  }
  setIsLoading(true);

  try {
    const data = await apiFetch("api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...userDetails }),
    });

    if (data?.error) {
      toast.error(data.error || "Failed to create account");
    } else {
      toast.success(data.message || "Account created successfully!");
    }

    setTimeout(() => {
      setIsLoading(false);
      setUserDetails({
        username: "",
        email: "",
        password: "",
        mobile: "",
        confirmPassword: ""
      });
    },5000);
  } catch (error) {
    toast.error(error, "An error occurred. Please try again.");
    setIsLoading(false);
  }
};

const strongRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const isStrongPassword = strongRegex.test(userDetails.password);

const isFormValid =
  isStrongPassword &&
  userDetails.password === userDetails.confirmPassword &&
  userDetails.username.trim() !== "" &&
  userDetails.email.trim() !== "" &&
  userDetails.mobile.trim() !== "";


    console.log(isFormValid)

  return (
    <section className="min-h-screen bg-[#fafafa] flex flex-col items-center pt-3">
      <div className="w-full max-w- flex flex-col gap-2.5 mt-3">
        {/* Main Card */}
        <form className="bg-white border border-[#dbdbdb] flex flex-col items-center px-10 pt-7 pb-6">
          <h1 style={{ fontFamily: "'Grand Hotel', cursive" }} className="text- mb-1">
            Instagram
          </h1>

          <h2 className="text- font-semibold text-[#8e8e8e] text-center leading- mb-4">
            Sign up to see photos and videos from your friends.
          </h2>

          <button
            type="button"
            className="w-full h-8 bg-[#0095f6] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 mb-4"
          >
            <span className="text-">f</span> Log in with Facebook
          </button>

          <div className="flex items-center w-full gap-4 mb-4">
            <div className="h- bg-[#dbdbdb] flex-1" />
            <span className="text- font-semibold text-[#8e8e8e]">OR</span>
            <div className="h- bg-[#dbdbdb] flex-1" />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            {/* Mobile */}
            <input
              type="text"
              placeholder="Mobile number"
              required
              name="mobile"
              value={userDetails.mobile}
              onChange={handleInput}
              onKeyDown={handleEnterKey}
              className="w-full h- bg-[#fafafa] border border-[#dbdbdb] rounded- px-2 text- outline-none focus:border-[#a8a8a8]"
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              required
              name="email"
              value={userDetails.email}
              onChange={handleInput}
              onKeyDown={handleEnterKey}
              className="w-full h- bg-[#fafafa] border border-[#dbdbdb] rounded- px-2 text- outline-none focus:border-[#a8a8a8]"
            />

            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              required
              name="username"
              value={userDetails.username}
              onChange={handleInput}
              onKeyDown={handleEnterKey}
              className="w-full h- bg-[#fafafa] border border-[#dbdbdb] rounded- px-2 text- outline-none focus:border-[#a8a8a8]"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={isPassword? "text" : "password"}
                placeholder="Password"
                maxLength={16}
                required
                name="password"
                value={userDetails.password}
                onChange={handleInput}
                onKeyDown={handleEnterKey}
                className="w-full h- bg-[#fafafa] border border-[#dbdbdb] rounded- px-2 pr-10 text- outline-none focus:border-[#a8a8a8]"
              />
              <img
                onClick={showHide}
                src={isPassword? show : hide}
                alt="toggle"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-60"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={isConfirmPassword? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={userDetails.confirmPassword}
                onChange={handleInput}
                className="w-full h- bg-[#fafafa] border border-[#dbdbdb] rounded- px-2 pr-10 text- outline-none focus:border-[#a8a8a8]"
              />
              <img
                onClick={showHide2}
                src={isConfirmPassword? show : hide}
                alt="toggle"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-60"
              />
            </div>

            {passwordError && (
              <p className="text-red-500 text- text-center">{passwordError}</p>
            )}

            <p className="text- text-[#8e8e8e] text-center leading- mt-2">
              People who use our service may have uploaded your contact information to Instagram.{" "}
              <span className="text-[#00376b]">Learn More</span>
            </p>

            <p className="text- text-[#8e8e8e] text-center leading- mt-2">
              By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
            </p>

            <button
              onClick={handleSubmit}
              disabled={isLoading ||!isFormValid}
              className="w-full h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg text-sm font-semibold mt-3 disabled:opacity-60"
            >
              {isLoading? <Spinner /> : "Sign up"}
            </button>
          </div>
        </form>

        {/* Login Card */}
        <div className="bg-white border border-[#dbdbdb] h- flex items-center justify-center text-">
          <p>
            Have an account?{" "}
            <Link to="/login" className="text-[#0095f6] font-semibold">
              Log in
            </Link>
          </p>
        </div>

        <div className="flex flex-col items-center mt-2">
          <p className="text- mb-3">Get the app.</p>
          <div className="flex gap-2">
            <img src="https://static.cdninstagram.com/rsrc.php/v3/yz/r/c5Rp7Ym-Klz.png" className="h-10" alt="" />
            <img src="https://static.cdninstagram.com/rsrc.php/v3/yu/r/EHY6QnZYdNX.png" className="h-10" alt="" />
          </div>
        </div>
      </div>

      <footer className="mt-10 mb-10 text- text-[#8e8e8e] flex flex-wrap justify-center gap-x-3 gap-y-2 max-w- px-4">
        <span>Meta</span><span>About</span><span>Blog</span><span>Jobs</span><span>Help</span>
        <span>API</span><span>Privacy</span><span>Terms</span><span>Locations</span>
        <span>Instagram Lite</span><span>Threads</span><span>Contact Uploading & Non-Users</span>
        <span>Meta Verified</span>
      </footer>

      <ToastContainer position="top-right" autoClose={3000} />
    </section>
  );
}
