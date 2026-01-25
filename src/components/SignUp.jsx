import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'
import { apiFetch } from "../api/apiFetch";

export default function SignUp(){

    const [userDetails,setUserDetails] = useState({
        username:"",
        email:"",
        password:"",
        mobile:""
    })

    const [message,setMessage] = useState({
        type:"",
        text:""
    })

    const [isLoading, setIsLoading] = useState(false);
      const [isPassword,setIsPassword] = useState(false)
      const [strength, setStrength] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

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
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (strongRegex.test(val)) setStrength("strong");
    else if (mediumRegex.test(val)) setStrength("medium");
    else if (weakRegex.test(val)) setStrength("weak");
    else setStrength("");

     if (typingTimeout) clearTimeout(typingTimeout);

  // Set timeout to clear strength after 2 seconds of inactivity
  const timeout = setTimeout(() => {
    setStrength("");
  }, 3000);

  setTypingTimeout(timeout);

  // Cleanup on component unmount
  return () => clearTimeout(timeout);
  }, [userDetails.password]);

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

  
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const data = await apiFetch("api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userDetails),
    });

    setMessage({ type: "success", text: data.message });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
      setIsLoading(false);
      setUserDetails({
        username: "",
        email: "",
        password: "",
        mobile: "",
      });
    }, 3000);
  } catch (err) {
    console.error(err);
    setMessage({ type: "error", text: err.message });
    setIsLoading(false);
  }
};





  return (
  <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <form className="w-full max-w-md bg-white border rounded-lg shadow-sm p-8 space-y-6">

      <h1 className="text-2xl font-semibold text-center">
        Sign up to create an account
      </h1>

      {/* Username */}
      <input
        className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        type="text"
        placeholder="Username"
        required
        name="username"
        value={userDetails.username}
        onChange={handleInput}
      />

      {/* Email */}
      <input
        className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        type="email"
        placeholder="Email"
        required
        name="email"
        value={userDetails.email}
        onChange={handleInput}
      />

      {/* Password */}
      <div className="relative">
        <input
          className="w-full border rounded-md px-4 py-2 text-sm pr-12 focus:outline-none focus:ring-1 focus:ring-gray-400"
          type={isPassword ? "text" : "password"}
          placeholder="Password"
          maxLength={16}
          required
          name="password"
          value={userDetails.password}
          onChange={handleInput}
        />

        <img
          onClick={showHide}
          src={isPassword ? show : hide}
          alt="toggle"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
        />

        <p
          className={`mt-1 text-xs font-medium ${
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

      {/* Mobile */}
      <input
        className="w-full border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        type="text"
        placeholder="Mobile number"
        minLength={12}
        required
        name="mobile"
        value={userDetails.mobile}
        onChange={handleInput}
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
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
      {message?.text && (
        <p
          className={`text-center text-sm ${
            message.type === "error" ? "text-red-500" : "text-green-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  </section>
);

}