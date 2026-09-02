// routes/Private.jsx
import { Navigate, useLocation } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function Private({ children }) {
  const loggedUser = useUserStore((state) => state.loggedUser);
  const location = useLocation();

  if (!loggedUser) {
    return <Navigate to="/login" replace />;
  }

  const isVerified = loggedUser.isEmailVerified || loggedUser.user?.isEmailVerified;

  // If trying to access home but not verified -> to verify page
  if (!isVerified && location.pathname!== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}