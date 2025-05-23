import { useState } from "react";
import { Link } from "react-router-dom";
export default function Otp() {
    const [otp, setOtp] = useState("");
    const [mobile, setMobile] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);

    const sendOtp = (e) => {
        setIsLoading(true)
        e.preventDefault();
        fetch("https://mygram-1-1nua.onrender.com/send-otp", {
            method: "POST",
            body: JSON.stringify({ mobile }),
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then((res)=>{
            return res.json()
            })
        .then((data) => {
                setMessage({ type: "success", text: data.message });

                setTimeout(()=>{
                    setIsLoading(false)
                    setIsLoading2(false)
                    setMessage({type:"",text:""})
                },5000)
            })
            .catch((err) => {
                console.log(err);
                setMessage({ type: "error", text: "Failed to send OTP" });
            });
    };

    const verifyOtp = (e) => {
        setIsLoading2(true)
        e.preventDefault();
        fetch("https://mygram-1-1nua.onrender.com/verify-otp", {
            method: "POST",
            body: JSON.stringify({ mobile, otp }),
            headers: {
                "Content-Type": "application/json",
            },
        })
           .then((res)=>{
            setIsLoading(false);
                if (!res.ok) {
                    if (res.status === 404) {
                        setMessage({ type: "error", text: "User Not Found With this Email, Please Login Again" });
                    } else if (res.status === 401) {
                        setMessage({ type: "error", text: "Wrong Password" });
                    } else {
                        setMessage({ type: "error", text: "Something went wrong. Please try again later." });
                    }
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
           })
            .then((data) => {
                if (data) {
                    localStorage.setItem("mobileVerified", "true");

                   
                    setMessage({ type: "success", text: "OTP verified successfully" });
                    setTimeout(()=>{
                        setMessage({type:"",text:""})
                    },5000)
                } else {
                    setMessage({ type: "error", text: data.error });
                }
            })
            .catch((err) => {
                console.log(err);
                setMessage({ type: "error", text: "Failed to verify OTP" });
            });
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
