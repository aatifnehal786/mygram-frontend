import { useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../api/apiFetch";
export default function EmailOtp() {
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading1, setIsLoading1] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);


    const sendOtp = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage({ type: "error", text: "Email is required" });
            setTimeout(() => {setMessage({ type: "", text: "" }),setEmail("")}, 5000);
            return;
        }

        try {
            setIsLoading1(true);

            const data = await apiFetch("api/otp/send-email-otp", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            setMessage({ type: "success", text: data.message });
            setTimeout(() => setMessage({ type: "", text: "" }), 5000);
        } catch (err) {
            console.error("Send OTP error:", err);
            setMessage({ type: "error", text: "Failed to send OTP" });
        } finally {
            setIsLoading1(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();

        if (!email || !otp) {
            setMessage({ type: "error", text: "Email and OTP are required" });
            setTimeout(() => {
                setMessage({ type: "", text: "" });
                setEmail("");
                setOtp("");
            }, 5000);
            return;
        }

        try {
            setIsLoading2(true);

            const data = await apiFetch("api/otp/verify-email-otp", {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            setMessage({ type: "success", text: "OTP verified successfully" });
             setTimeout(() => {
                setMessage({ type: "", text: "" });
                setEmail("");
                setOtp("");
            }, 5000);
        } catch (err) {
            console.error("Verify OTP error:", err);
            setMessage({ type: "error", text: err.message || "Failed to verify OTP" });
        } finally {
            setIsLoading2(false);
        }
    };

    return (
  <section className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <form className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md space-y-4">

      <h2 className="text-lg font-semibold text-center">
        Email Verification
      </h2>

      {/* Email */}
      <input
        type="email"
        placeholder="Enter email"
        required
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="
          w-full px-4 py-2 rounded-lg border
          text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      <button
        type="button"
        onClick={sendOtp}
        disabled={isLoading1}
        className="
          w-full bg-blue-600 text-white py-2 rounded-lg text-sm
          hover:bg-blue-700 transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading1 ? "Sending OTP..." : "Send OTP"}
      </button>

      {/* OTP */}
      <input
        type="text"
        placeholder="Enter OTP"
        name="otp"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="
          w-full px-4 py-2 rounded-lg border
          text-sm tracking-widest
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      <button
        type="button"
        onClick={verifyOtp}
        disabled={isLoading2}
        className="
          w-full bg-green-600 text-white py-2 rounded-lg text-sm
          hover:bg-green-700 transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading2 ? "Verifying..." : "Verify OTP"}
      </button>

      {/* Message */}
      {message.text && (
        <p
          className={`
            text-center text-sm mt-2
            ${message.type === "success"
              ? "text-green-600"
              : "text-red-600"}
          `}
        >
          {message.text}
        </p>
      )}

      {/* Link */}
      <p className="text-center text-sm text-gray-500">
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to login page
        </Link>
      </p>
    </form>
  </section>
);

}
