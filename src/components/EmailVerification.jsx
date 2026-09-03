// pages/EmailVerification.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";
import { apiFetch } from "../api/apiFetch";

export default function EmailVerification() {
  const navigate = useNavigate();
  const { loggedUser, setLoggedUser, logout } = useUserStore();
  const email = loggedUser?.email || loggedUser?.user?.email;

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!loggedUser) return navigate("/login", { replace: true });
    const isVerified = loggedUser.isEmailVerified || loggedUser.user?.isEmailVerified;
    if (isVerified) return navigate("/home", { replace: true });

    handleSendOtp();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const id = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [timer]);

  const handleSendOtp = async () => {
    try {
      setSending(true); setError(""); setSuccess("");
      await apiFetch("api/otp/send-email-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(`Code sent to ${email}`);
      setTimer(300);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;
    const newOtp = [...otp];
    // handle paste of full code
    if (value.length > 1) {
      const chars = value.slice(0, 6).split("");
      chars.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      // Auto verify if all 6 filled via paste
      if (newOtp.join("").length === 6) {
        verifyWithCode(newOtp.join(""));
      }
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (index < 5) inputRefs.current[index + 1]?.focus();
    // Auto verify when last digit filled
    if (newOtp.join("").length === 6 && index === 4) {
      verifyWithCode(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify(e);
      verifyWithCode(otp.join(""));
    }
  };

  const verifyWithCode = async (code) => {
    try {
      setLoading(true); setError("");
      await apiFetch("api/otp/verify-email-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: code }),
      });

      const updatedUser = {
       ...loggedUser,
        isEmailVerified: true,
        user: loggedUser.user? {...loggedUser.user, isEmailVerified: true } : undefined,
      };
      setLoggedUser({ user: updatedUser, token: useUserStore.getState().token });
      setSuccess("Verified! Redirecting...");
      setTimeout(() => navigate("/home", { replace: true }), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyWithCode(otp.join(""));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-">
        {/* Instagram style lock icon */}
        <div className="border border-zinc-300 rounded-sm p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full border-2 border-black flex items-center justify-center mb-4">
            <span className="text-5xl">🔒</span>
          </div>
          <h2 className="font-semibold">Enter Confirmation Code</h2>
          <p className="text-sm text-zinc-500 mt-2 mb-4">
            Enter the 6-digit code we sent to <b className="text-black">{email}</b>
          </p>

          {success && <div className="text-xs text-green-600 mb-3">{success}</div>}
          {error && <div className="text-xs text-red-600 mb-3">{error}</div>}

          <form onSubmit={handleVerify} className="w-full">
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-10 h-11 border border-zinc-300 rounded-md text-center text-lg font-medium focus:border-zinc-400 focus:outline-none focus:bg-zinc-50"
                />
              ))}
            </div>

            <button
              disabled={loading || otp.join("").length!== 6}
              className="w-full bg-[#0095f6] text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:bg-[#b2dffc]"
            >
              {loading? "Verifying..." : "Confirm"}
            </button>
          </form>

          <div className="mt-4 text-sm">
            {timer > 0? (
              <span className="text-zinc-400">Resend in {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</span>
            ) : (
              <button onClick={handleSendOtp} onKeyDown={handleEnterKey} disabled={sending} className="text-[#0095f6] font-semibold">
                {sending? "Sending..." : "Resend Code"}
              </button>
            )}
          </div>
        </div>

        <div className="border border-zinc-300 rounded-sm p-4 mt-3 text-center text-sm">
          <button onClick={() => { logout(); navigate("/login"); }} className="font-semibold">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}