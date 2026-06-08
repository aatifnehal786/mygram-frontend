// components/PublicRoute.jsx
// import { useContext } from "react";
import { Navigate } from "react-router-dom";
// import { UserContext } from "../contexts/UserContext";
import useUserStore from '../store/useUserStore'

export default function PublicRoute({ children }) {
  
   const loggedUser = useUserStore.getState((state) => state.loggedUser);

  if (loggedUser) {
    // if logged in → redirect away from login/register
    return <Navigate to="/home" replace />;
  }

  return children; // otherwise render the child component (e.g. Login)
}
