import { useState } from "react";
import { Link } from "react-router-dom";
import {apiFetch} from '../api/apiFetch'


export default function Otp() {
    const [otp, setOtp] = useState("");
    const [mobile, setMobile] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);


// HANDLE MOBILE SENDING OTP

const sendOtp = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const data = await apiFetch("api/otp/send-otp", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    });

    setMessage({ type: "success", text: data.message });

    setTimeout(() => {
      setIsLoading(false);
      setIsLoading2(false);
      setMessage({ type: "", text: "" });
    }, 10000);
  } catch (err) {
    console.error(err);
    setMessage({ type: "error", text: "Failed to send OTP" });
    setIsLoading(false);
  }
};


// VERIFY MOBILE OTP

const verifyOtp = async (e) => {
  e.preventDefault();
  setIsLoading2(true);

  try {
    const data = await apiFetch("api/otp/verify-otp", {
      method: "POST",
      body: JSON.stringify({ mobile, otp }),
    });

    localStorage.setItem("mobileVerified", "true");

    setMessage({ type: "success", text: "OTP verified successfully" });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 10000);
  } catch (err) {
    console.error(err);

    setMessage({
      type: "error",
      text:
        err.message.includes("404") 
          ? "User not found. Please login again." 
          : err.message.includes("401") 
          ? "Wrong OTP" 
          : "Failed to verify OTP",
    });
  } finally {
    setIsLoading(false);
    setIsLoading2(false);
  }
};


    return (
  <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
    <form className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
      
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Verify Mobile Number
      </h2>

      {/* Mobile Input */}
      <input
        type="text"
        onChange={(e) => setMobile(e.target.value)}
        placeholder="Enter Mobile Number"
        required
        name="mobile"
        value={mobile}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* OTP Input */}
      <input
        type="text"
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        name="otp"
        value={otp}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Send OTP */}
      <button
        type="submit"
        disabled={isLoading}
        onClick={sendOtp}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
      >
        {isLoading ? "Sending OTP..." : "Send OTP"}
      </button>

      {/* Verify OTP */}
      <button
        type="submit"
        disabled={isLoading2}
        onClick={verifyOtp}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
      >
        {isLoading2 ? "Verifying..." : "Verify OTP"}
      </button>

      {/* Message */}
      {message?.text && (
        <p
          className={`text-center text-sm ${
            message.type === "error"
              ? "text-red-500"
              : "text-green-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Back Link */}
      <p className="text-center text-sm">
        <Link
          to="/profile"
          className="text-indigo-600 hover:underline font-medium"
        >
          Go back to Profile page
        </Link>
      </p>
    </form>
  </section>
);

}
