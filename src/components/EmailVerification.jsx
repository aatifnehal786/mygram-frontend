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
    if (!loggedUser) {
      navigate("/login", { replace: true });
      return;
    }
    const isVerified = loggedUser.isEmailVerified || loggedUser.user?.isEmailVerified;
    if (isVerified) {
      navigate("/home", { replace: true });
      return;
    }
    handleSendOtp();
    inputRefs.current[0]?.focus();
  }, []); // eslint-disable-line

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

  const verifyWithCode = async (code) => {
    if (code.length!== 6) return;
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

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      const chars = value.slice(0, 6).split("");
      chars.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (newOtp.join("").length === 6) verifyWithCode(newOtp.join(""));
      return;
    }

    newOtp[index] = value.slice(-1); // take last typed
    setOtp(newOtp);
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // auto verify when all 6 filled
    const fullCode = newOtp.join("");
    if (fullCode.length === 6) {
      verifyWithCode(fullCode);
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
    if (e.key === "Enter") {
      e.preventDefault();
      verifyWithCode(otp.join(""));
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyWithCode(otp.join(""));
  };

  return (
   <div className="min-h-screen flex flex-col items-center bg-[#ECE5DD] dark:bg-[#111B21] p-4">
  {/* WhatsApp Top Header Bar */}
  <div className="w-full bg-[#075E54] dark:bg-[#202C33] py-4 flex justify-center -m-4 mb-8">
    <div className="flex items-center gap-2 text-white">
      <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-2xl font-bold">✓</div>
      <h1 className="text-xl font-semibold tracking-wide">MyGram</h1>
    </div>
  </div>

  <div className="w-full max-w-sm">
    <div className="border border-[#dbdbdb] dark:border-[#374045] bg-white dark:bg-[#202C33] rounded-xl shadow-sm p-8 flex flex-col items-center text-center">
      {/* Lock Icon - WhatsApp Green */}
      <div className="w-24 h-24 rounded-full bg-[#DCF8C6] dark:bg-[#005C4B] flex items-center justify-center mb-4">
        <span className="text-5xl">🔒</span>
      </div>
      <h2 className="font-bold text- text-[#111B21] dark:text-white">Enter Confirmation Code</h2>
      <p className="text-sm text-[#8696A0] mt-2 mb-4 leading-5">
        Enter the 6-digit code we sent to <b className="text-[#111B21] dark:text-white">{email}</b>
        <br />
        <span className="text-xs">Check Inbox & Spam folder</span>
      </p>

      {success && <div className="w-full bg-[#DCF8C6] dark:bg-[#005C4B] text-[#075E54] dark:text-white text-xs font-medium rounded-lg py-2 px-3 mb-3">{success}</div>}
      {error && <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg py-2 px-3 mb-3">{error}</div>}

      <form onSubmit={handleVerify} className="w-full">
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-11 h-12 bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg text-center text- font-bold focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/30 focus:outline-none transition"
            />
          ))}
        </div>

        <button
          disabled={loading || otp.join("").length !== 6}
          className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-lg font-semibold text- disabled:opacity-60 disabled:bg-[#25D366] transition flex items-center justify-center"
        >
          {loading ? "Verifying..." : "Confirm"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        {timer > 0 ? (
          <span className="text-[#8696A0]">Resend in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
        ) : (
          <button onClick={handleSendOtp} disabled={sending} className="text-[#25D366] font-semibold hover:text-[#1EBE5A]">
            {sending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>
    </div>

    <div className="border border-[#dbdbdb] dark:border-[#374045] bg-white dark:bg-[#202C33] rounded-xl p-4 mt-3 text-center text-sm">
      <button onClick={() => { logout(); navigate("/login"); }} className="font-semibold text-[#111B21] dark:text-white hover:text-[#25D366]">
        Back to Login
      </button>
    </div>

    <p className="text- text-[#8696A0] text-center mt-3 leading-4">
      By verifying, you agree to MyGram's Terms & Privacy Policy
    </p>
  </div>
</div>
  );
}