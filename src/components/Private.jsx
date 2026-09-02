// routes/Private.jsx
import { Navigate, useLocation } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function Private({ children }) {
  const loggedUser = useUserStore((state) => state.loggedUser);
  const location = useLocation();

  if (!loggedUser) {
    return <Navigate to="/login" replace />;
  }

  // Check all possible shapes (you store user in different ways)
  const actualUser = loggedUser.user || loggedUser;

  const isGuest = actualUser.isGuest || actualUser.role === "guest";
  
  // Guest is always considered verified
  if (isGuest) {
    return children;
  }

  const isVerified = actualUser.isEmailVerified || actualUser.isVerified;

  // If not verified and not already on verify page -> redirect to verify
  if (!isVerified && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  // If verified but trying to go to verify page -> go home
  if (isVerified && location.pathname === "/verify-email") {
    return <Navigate to="/home" replace />;
  }

  return children;
}