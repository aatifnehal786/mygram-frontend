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
  <section className="container">
    <form className="form">

      <h1>
        Sign up to create an account
      </h1>

      {/* Username */}
      <div className="input-group">
        <input
        type="text"
        placeholder=""
        required
        name="username"
        value={userDetails.username}
        onChange={handleInput}
        onKeyDown={handleEnterKey}
      />
       <label>Username</label>
      </div>

      {/* Email */}
      <div className="input-group">
        <input
        type="email"
        placeholder=""
        required
        name="email"
        value={userDetails.email}
        onChange={handleInput}
        onKeyDown={handleEnterKey}
      />
       <label>Email</label>
      </div>

      {/* Password */}
      <div className="input-group">
        <input
          type={isPassword ? "text" : "password"}
          placeholder=""
          maxLength={16}
          required
          name="password"
          value={userDetails.password}
          onChange={handleInput}
          onKeyDown={handleEnterKey}
        />
        <label>Password</label>
        <img
          onClick={showHide}
          src={isPassword ? show : hide}
          alt="toggle"
          className="pass1"
        />

        {/* Strength Bar */}
        
        
      </div>
      <div className="input-group">
          <input
        type={isConfirmPassword ? "text" : "password"}
        name="confirmPassword"
        placeholder=""
        value={userDetails.confirmPassword}
        onChange={handleInput}
        />
        <label>Confirm Password</label>
        <img
          onClick={showHide2}
          src={isConfirmPassword ? show : hide}
          alt="toggle"
          className="pass1"
        />
         
        </div>

        {/* Error Message */}
        {passwordError && (
        <p className="text-red-500 text-sm mt-2">{passwordError}</p>
        )}

      {/* Mobile */}
     <div className="input-group">
       <input
        type="text"
        placeholder=""
        minLength={12}
        required
        name="mobile"
        value={userDetails.mobile}
        onChange={handleInput}
        onKeyDown={handleEnterKey}
      />
        <label>Mobile</label>
     </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !isFormValid}
        className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {isLoading ? <Spinner/> : "Join"}
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

      {/* Message */}
      <ToastContainer position="top-right" autoClose={3000} />
    </form>
  </section>
);

}