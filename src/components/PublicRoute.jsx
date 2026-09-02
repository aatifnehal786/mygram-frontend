// routes/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function PublicRoute({ children }) {
  const loggedUser = useUserStore((state) => state.loggedUser);

  if (loggedUser) {
    const isVerified = loggedUser.isEmailVerified || loggedUser.user?.isEmailVerified;

    // If logged in but NOT verified -> force to verify page
    if (!isVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    // If logged in and verified -> go home
    return <Navigate to="/home" replace />;
  }

  return children;
}