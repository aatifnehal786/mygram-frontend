import { Navigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function PublicRoute({ children }) {
  const loggedUser = useUserStore(
    (state) => state.loggedUser
  );

  if (loggedUser) {
    return <Navigate to="/home" replace />;
  }

  return children;
}