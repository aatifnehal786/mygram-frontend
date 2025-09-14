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
    const data = await apiFetch("/otp/send-otp", {
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
    const data = await apiFetch("/otp/verify-otp", {
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
        <section className="container">
            <form className="form">
                <input
                    className="inp"
                    type="text"
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter Mobile"
                    required
                    name="mobile"
                    value={mobile}
                />
                <input
                    className="inp"
                    type="text"
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    name="otp"
                    value={otp}
                />
                <button type="submit" className="btn" disabled={isLoading} onClick={sendOtp}>
                {isLoading ? "Loading..." : "send otp"}
                </button>
                <button type="submit" className="btn" disabled={isLoading2} onClick={verifyOtp}>
                {isLoading2 ? "Loading..." : "verify otp"}
                </button>
                {message.text && <div><p className={message.type}>{message.text}</p></div>}
                <p><Link to="/profile">Go back to Profile page</Link></p>
            </form>
        </section>
    );
}
