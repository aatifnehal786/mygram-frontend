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
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return;
        }

        try {
            setIsLoading1(true);

            const data = await apiFetch("/send-email-otp", {
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
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return;
        }

        try {
            setIsLoading2(true);

            const data = await apiFetch("/verify-email-otp", {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            setMessage({ type: "success", text: "OTP verified successfully" });
            setTimeout(() => setMessage({ type: "", text: "" }), 5000);
        } catch (err) {
            console.error("Verify OTP error:", err);
            setMessage({ type: "error", text: err.message || "Failed to verify OTP" });
        } finally {
            setIsLoading2(false);
        }
    };

    return (
        <section className="container">
            <form className="form">
                <h2>Enter Email For Verification</h2>
                <input
                    className="inp"
                    type="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email"
                    required
                    name="email"
                    value={email}
                />
                <button type="submit" className="btn" disabled={isLoading1} onClick={sendOtp}>
                    {isLoading1 ? "Loading..." : "send otp"}
                </button>
                <input
                    className="inp"
                    type="text"
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    name="otp"
                    value={otp}
                />

                <button type="submit" className="btn" disabled={isLoading2} onClick={verifyOtp}>
                    {isLoading2 ? "Loading..." : "verify otp"}
                </button>
                {message.text && <div><p className={message.type}>{message.text}</p></div>}
                <p><Link className="link1" to="/login">Go to login page</Link></p>
            </form>
        </section>
    );
}
