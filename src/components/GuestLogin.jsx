import React from "react";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import Spinner from "../Spinner";
import useUserStore from "../store/useUserStore";
import {useState} from 'react'

export default function GuestLogin() {
    
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const navigate = useNavigate();
    const setLoggedUser = useUserStore((state) => state.setLoggedUser);

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("api/auth/guest-login", {
                method: "POST",
                body: JSON.stringify({ fullName }),
            }); 
            console.log("Guest login response:", response);

            if (response.success) {
                setLoggedUser(response);
                toast.success("Logged in as guest!");
                navigate("/home");
            }
        } catch (error) {
            console.error("Error during guest login:", error);
            toast.error("Failed to log in as guest. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="container">
            <div className="form">
                <h2 className="text-2xl font-bold mb-6 text-center">Guest Login</h2>
                <p className="text-red-600 mb-4 text-center text-xl">
                    You are logging in as a guest. Some features may be limited.
                </p>
                 <div className="mt-4 text-center text-gray-600 text-sm px-4 max-w-md mx-auto">
                <h2 className="text-purple-600 text-lg">Please enter a username for guest access.</h2>
                <input
                    type="text"
                    placeholder="Enter a username"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border mt-2 border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    className="btn btn-1"
                    onClick={handleGuestLogin}
                    disabled={loading}
                >
                    {loading ? <Spinner /> : "Continue as Guest"}
                </button>
            </div>
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 mt-4 block text-center">
                    Go Back to Login Page
                </Link>
            </div>
           
        </div>
    );
}