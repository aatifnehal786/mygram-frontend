import { Navigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function Private({ children }) {
  const loggedUser = useUserStore(
    (state) => state.loggedUser
  );

  if (!loggedUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}