// components/Private.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

export default function Private({ children }) {
  const { loggedUser } = useContext(UserContext);

  if (!loggedUser) {
    // not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  return children; // render private component
}
