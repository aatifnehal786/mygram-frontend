import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'
import { apiFetch } from "../api/apiFetch";
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  if (!userDetails.username || !userDetails.email || !userDetails.password || !userDetails.mobile) {
    toast.error("All fields are required");
     setTimeout(() => {
      setUserDetails({
        username: "",
        email: "",
        password: "",
        mobile: "",
      });
    }, 5000);
    return;
  }
  setIsLoading(true);

  try {
    const data = await apiFetch("api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userDetails),
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
      });
    },5000);
  } catch (err) {
    toast.error(data.error || "An error occurred. Please try again.");
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
  <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <form className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8 space-y-6">

      <h1 className="text-2xl font-semibold text-center">
        Sign up to create an account
      </h1>

      {/* Username */}
      <input
        className="w-full px-4 py-2 mt-1 border rounded-xl outline-none focus:ring-2  focus:ring-gray-400"
        type="text"
        placeholder="Username"
        required
        name="username"
        value={userDetails.username}
        onChange={handleInput}
        onKeyDown={handleEnterKey}
      />

      {/* Email */}
      <input
        className="w-full px-4 py-2 mt-1 border rounded-xl outline-none focus:ring-2  focus:ring-gray-400"
        type="email"
        placeholder="Email"
        required
        name="email"
        value={userDetails.email}
        onChange={handleInput}
        onKeyDown={handleEnterKey}
      />

      {/* Password */}
      <div className="relative w-full">
        <input
          className="w-full px-4 py-2 mt-1 border rounded-xl outline-none focus:ring-2 focus:ring-gray-400"
          type={isPassword ? "text" : "password"}
          placeholder="Password"
          maxLength={16}
          required
          name="password"
          value={userDetails.password}
          onChange={handleInput}
          onKeyDown={handleEnterKey}
        />

        <img
          onClick={showHide}
          src={isPassword ? show : hide}
          alt="toggle"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
        />

        {/* Strength Bar */}
        
        
      </div>
      {strength && (
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getStrengthColor()} ${
                strength === "weak"
                  ? "w-1/3"
                  : strength === "medium"
                  ? "w-2/3"
                  : "w-full"
              }`}
            />
          </div>

          <p
            className={`mt-2 text-sm font-medium ${
              strength === "weak"
                ? "text-red-500"
                : strength === "medium"
                ? "text-yellow-500"
                : "text-green-600"
            }`}
          >
            {getStrengthText()}
          </p>
          </div>
        )}
      <div className="relative">
          <input
        type={isConfirmPassword ? "text" : "password"}
        name="confirmPassword"
        placeholder="Confirm password"
        value={userDetails.confirmPassword}
        onChange={handleInput}
        className={`w-full px-4 py-2 mt-1 border rounded-xl outline-none focus:ring-2 ${
          passwordError
            ? "border-red-500 focus:ring-red-400"
            : "focus:ring-green-400"
         }`}
        />
        <img
          onClick={showHide2}
          src={isConfirmPassword ? show : hide}
          alt="toggle"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
        />
        </div>

        {/* Error Message */}
        {passwordError && (
        <p className="text-red-500 text-sm mt-2">{passwordError}</p>
        )}

      {/* Mobile */}
      <input
        className="w-full px-4 py-2 mt-1 border rounded-xl outline-none focus:ring-2  focus:ring-gray-400"
        type="text"
        placeholder="Mobile number"
        minLength={12}
        required
        name="mobile"
        value={userDetails.mobile}
        onChange={handleInput}
        onKeyDown={handleEnterKey}
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !isFormValid}
        className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {isLoading ? "Creating account..." : "Join"}
      </button>

      {/* Login link */}
      <div className="text-center text-sm">
        <p>
          Already registered?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>

      {/* Email OTP */}
      <div className="text-center text-sm">
        <Link to="/emailotp" className="text-gray-500 hover:underline">
          Verify email to login
        </Link>
      </div>

      {/* Message */}
      <ToastContainer position="top-right" autoClose={3000} />
    </form>
  </section>
);

}