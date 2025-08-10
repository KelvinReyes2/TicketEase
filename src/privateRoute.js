// src/privateRoute.js

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "./firebase";  // Import the auth object from firebaseConfig

const PrivateRoute = ({ element: Component, ...rest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Track auth state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  if (isAuthenticated === null) {
    return <div></div>;  // Show loading if auth state is being checked
  }

  return isAuthenticated ? <Component {...rest} /> : <Navigate to="/login" />;
};

export default PrivateRoute;
