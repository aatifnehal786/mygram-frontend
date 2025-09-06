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
      setMessage("Invalid approval link");
      return;
    }

    fetch(`https://mygram-1-1nua.onrender.com/approve-login?token=${token}`)
      .then((res) => res.text())
      .then((data) => {
        setMessage(data);
        setTimeout(() => navigate("/login"), 2000); // redirect back to login
      })
      .catch(() => setMessage("Error approving login"));
  }, [navigate, searchParams]);

  return (
    <section className="container">
      <h2>{message}</h2>
    </section>
  );
}
