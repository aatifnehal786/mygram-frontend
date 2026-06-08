// components/Private.jsx

import { Navigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function Private({ children }) {
  // const { loggedUser } = useContext(UserContext);
    const loggedUser = useUserStore.getState((state) => state.loggedUser);


  if (!loggedUser) {
    // not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  return children; // render private component
}
