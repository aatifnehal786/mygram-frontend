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
      setUserDetails({ username: "", email: "", password: "", mobile: "", confirmPassword: "" });
      setStrength("");
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
    <section className="min-h-screen bg-[#fafafa] flex flex-col items-center pt-3">
      <div className="w-full max-w- flex flex-col gap-2.5 mt-3">
        <form className="bg-white border border-[#dbdbdb] flex flex-col items-center px-10 pt-7 pb-6">
          <h1 style={{ fontFamily: "'Grand Hotel', cursive" }} className="text- mb-1">Instagram</h1>
          <h2 className="text- font-semibold text-[#8e8e8e] text-center leading-4 mb-4">
            Sign up to see photos and videos from your friends.
          </h2>

          <button type="button" className="w-full h-8 bg-[#0095f6] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 mb-4">
            <span className="text-">f</span> Log in with Facebook
          </button>

          <div className="flex items-center w-full gap-4 mb-4">
            <div className="h- bg-[#dbdbdb] flex-1" />
            <span className="text- font-semibold text-[#8e8e8e]">OR</span>
            <div className="h- bg-[#dbdbdb] flex-1" />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <input type="text" placeholder="Mobile number" name="mobile" value={userDetails.mobile} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h-9 bg-[#fafafa] border border-[#dbdbdb] rounded-sm px-2 text-xs outline-none focus:border-[#a8a8a8]" />
            <input type="email" placeholder="Email" name="email" value={userDetails.email} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h-9 bg-[#fafafa] border border-[#dbdbdb] rounded-sm px-2 text-xs outline-none focus:border-[#a8a8a8]" />
            <input type="text" placeholder="Username" name="username" value={userDetails.username} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h-9 bg-[#fafafa] border border-[#dbdbdb] rounded-sm px-2 text-xs outline-none focus:border-[#a8a8a8]" />

            {/* Password */}
            <div className="relative">
              <input type={isPassword? "text" : "password"} placeholder="Password" maxLength={16} name="password" value={userDetails.password} onChange={handleInput} onKeyDown={handleEnterKey} className="w-full h-9 bg-[#fafafa] border border-[#dbdbdb] rounded-sm px-2 pr-10 text-xs outline-none focus:border-[#a8a8a8]" />
              <img onClick={showHide} src={isPassword? show : hide} alt="toggle" className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-60" />
            </div>

            {/* STRENGTH INDICATOR */}
            {userDetails.password && (
              <div className="w-full mt-1">
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`}></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className={`text- font-semibold ${strength === "weak"? "text-red-500" : strength === "medium"? "text-yellow-600" : "text-green-600"}`}>
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
              <input type={isConfirmPassword? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={userDetails.confirmPassword} onChange={handleInput} className="w-full h-9 bg-[#fafafa] border border-[#dbdbdb] rounded-sm px-2 pr-10 text-xs outline-none focus:border-[#a8a8a8]" />
              <img onClick={showHide2} src={isConfirmPassword? show : hide} alt="toggle" className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-60" />
            </div>

            {passwordError && <p className="text-red-500 text-xs text-center">{passwordError}</p>}

            <p className="text- text-[#8e8e8e] text-center leading-4 mt-2">
              People who use our service may have uploaded your contact information to Instagram. <span className="text-[#00376b]">Learn More</span>
            </p>
            <p className="text- text-[#8e8e8e] text-center leading-4 mt-2">
              By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
            </p>

            <button onClick={handleSubmit} disabled={isLoading ||!isFormValid} className="w-full h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg text-sm font-semibold mt-3 disabled:opacity-60">
              {isLoading? <Spinner /> : "Sign up"}
            </button>
          </div>
        </form>

        <div className="bg-white border border-[#dbdbdb] h- flex items-center justify-center text-">
          <p>Have an account? <Link to="/login" className="text-[#0095f6] font-semibold">Log in</Link></p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </section>
  );
}