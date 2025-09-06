// src/pages/ApproveLogin.js
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ApproveLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Approving login...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setMessage("❌ Invalid or missing approval token.");
      return;
    }

   fetch(`https://mygram-1-1nua.onrender.com/approve-device?token=${token}`)
  .then((res) => res.json())
  .then((data) => {
    setMessage(data.message);
    if (data.success) {
      setTimeout(() => navigate("/login"), 2500);
    }
  })
  .catch(() => setMessage("⚠️ Something went wrong. Please try again."));

  }, [navigate, searchParams]);

  return (
    <section className="container">
      <h2>{message}</h2>
    </section>
  );
}
