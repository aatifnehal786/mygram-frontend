import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import hide from '../assets/hide.png'
import show from '../assets/show.png'
import { apiFetch } from "../api/apiFetch";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";

export default function SignUp() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false)
  const [isConfirmPassword, setIsConfirmPassword] = useState(false)
  const [strength, setStrength] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleEnterKey = (e) => {
    if (e.key === "Enter") handleSubmit(e);
  };

  const handleInput = (e) => {
    setUserDetails((prev) => ({...prev, [e.target.name]: e.target.value }))
  }

  // Password strength logic
  const getPasswordStrength = (password) => {
    if (!password) return "";
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (password.length < 6) return "weak";
    if (score <= 2) return "weak";
    if (score === 3) return "medium";
    if (score === 4) return "strong";
    return "weak";
  };

  useEffect(() => {
    setStrength(getPasswordStrength(userDetails.password));
  }, [userDetails.password]);

  useEffect(() => {
    if (!userDetails.confirmPassword) {
      setPasswordError("");
      return;
    }
    if (userDetails.password!== userDetails.confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [userDetails.password, userDetails.confirmPassword]);

  const getStrengthColor = () => {
    switch (strength) {
      case "weak": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "strong": return "bg-green-500";
      default: return "bg-gray-200";
    }
  };

  const getStrengthWidth = () => {
    switch (strength) {
      case "weak": return "w-1/3";
      case "medium": return "w-2/3";
      case "strong": return "w-full";
      default: return "w-0";
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case "weak": return "Weak Password";
      case "medium": return "Medium Password";
      case "strong": return "Strong Password";
      default: return "";
    }
  };

  const showHide = () => setIsPassword((prev) =>!prev)
  const showHide2 = () => setIsConfirmPassword((prev) =>!prev)

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userDetails.username ||!userDetails.email ||!userDetails.password ||!userDetails.mobile ||!userDetails.confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (userDetails.password!== userDetails.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword,...payload } = userDetails;
      const data = await apiFetch("api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(data.message || "Account created successfully!");
      setTimeout(() => {
        setUserDetails({ username: "", email: "", password: "", mobile: "", confirmPassword: "" });
        setStrength("");
      },5000);
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  const isStrongPassword = strongRegex.test(userDetails.password);
  const isFormValid =
    isStrongPassword &&
    userDetails.password === userDetails.confirmPassword &&
    userDetails.username.trim()!== "" &&
    userDetails.email.trim()!== "" &&
    userDetails.mobile.trim()!== "";

  return (
    <section className="min-h-screen bg-[#ECE5DD] dark:bg-[#111B21] flex flex-col items-center">
  {/* 【entity-WhatsApp¦canonical_name=WhatsApp】 Top Header Bar */}
  <div className="w-full bg-[#075E54] dark:bg-[#202C33] py-4 flex justify-center">
    <div className="flex items-center gap-2 text-white">
      <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-2xl font-bold">✓</div>
      <h1 className="text-xl font-semibold tracking-wide">MyGram</h1>
    </div>
  </div>

  <div className="w-full max-w- flex flex-col gap-2.5 mt-6 px-4">
    <form className="bg-white dark:bg-[#202C33] border border-[#dbdbdb] dark:border-[#374045] rounded-xl shadow-sm flex flex-col items-center px-8 pt-7 pb-6">
      {/* 【entity-WhatsApp¦canonical_name=WhatsApp】 Logo - Replaces Instagram */}
      <div className="flex flex-col items-center mb-1">
        <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mb-2">
          <span className="text-3xl text-white">✆</span>
        </div>
        <h1 className="text- font-bold tracking-wide text-[#111B21] dark:text-white">MyGram</h1>
      </div>
      <h2 className="text- font-medium text-[#8696A0] text-center leading-5 mb-4">
        Sign up to see photos and videos from your friends.
      </h2>

      <button type="button" className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-lg text- font-semibold flex items-center justify-center gap-2 mb-4 transition">
        <span className="text- font-bold">f</span> Log in with Facebook
      </button>

      <div className="flex items-center w-full gap-4 mb-4">
        <div className="h- bg-[#D1D7DB] dark:bg-[#374045] flex-1" />
        <span className="text- font-semibold text-[#8696A0]">OR</span>
        <div className="h- bg-[#D1D7DB] dark:bg-[#374045] flex-1" />
      </div>

      <div className="w-full flex flex-col gap-3">
        <input type="text" placeholder="Mobile number" name="mobile" value={userDetails.mobile} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20" />
        <input type="email" placeholder="Email" name="email" value={userDetails.email} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20" />
        <input type="text" placeholder="Username" name="username" value={userDetails.username} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20" />

        {/* Password */}
        <div className="relative">
          <input type={isPassword ? "text" : "password"} placeholder="Password" maxLength={16} name="password" value={userDetails.password} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 pr-12 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20" />
          <button type="button" onClick={showHide} className="absolute right-3 top-1/2 -translate-y-1/2 text- font-semibold text-[#25D366]">
            {isPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* STRENGTH INDICATOR - WhatsApp Colors */}
        {userDetails.password && (
          <div className="w-full mt-1">
            <div className="w-full h-2 bg-gray-200 dark:bg-[#374045] rounded-full overflow-hidden">
              <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`}></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className={`text- font-semibold ${strength === "weak" ? "text-red-500" : strength === "medium" ? "text-yellow-600" : "text-[#25D366]"}`}>
                {getStrengthText()}
              </p>
              <p className="text- text-gray-400">
                {strength === "weak" && "Add uppercase, number & symbol"}
                {strength === "medium" && "Add number & symbol"}
                {strength === "strong" && "✓ Good to go"}
              </p>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative mt-1">
          <input type={isConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={userDetails.confirmPassword} onChange={handleInput} className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 pr-12 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20" />
          <button type="button" onClick={showHide2} className="absolute right-3 top-1/2 -translate-y-1/2 text- font-semibold text-[#25D366]">
            {isConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        {passwordError && <p className="text-red-500 text- text-center">{passwordError}</p>}

        <p className="text- text-[#8696A0] text-center leading-4 mt-2">
          People who use our service may have uploaded your contact information to MyGram. <span className="text-[#128C7E] dark:text-[#25D366]">Learn More</span>
        </p>
        <p className="text- text-[#8696A0] text-center leading-4 mt-2">
          By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
        </p>

        <button onClick={handleSubmit} disabled={isLoading || !isFormValid} className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-lg text- font-semibold mt-3 disabled:opacity-60 transition">
          {isLoading ? <Spinner /> : "Sign up"}
        </button>
      </div>
    </form>

    <div className="bg-white dark:bg-[#202C33] border border-[#dbdbdb] dark:border-[#374045] rounded-xl h- flex items-center justify-center text- text-[#111B21] dark:text-white">
      <p>Have an account? <Link to="/login" className="text-[#25D366] font-semibold">Log in</Link></p>
    </div>

    <p className="text- text-[#8696A0] text-center mt-1">
      By signing up, you will get an Email Verification OTP<br />on your first login to verify your account.
    </p>
  </div>
  <ToastContainer position="top-right" autoClose={3000} />
</section>
  );
}