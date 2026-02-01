import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthentication } from '../context/Authentication';

const PrivateRoute = ({children}) => {
  // Check authentication state
  const {isLoggedIn} = useAuthentication();

  return (
    isLoggedIn ? (
        children
    ) : (
      <Navigate to="/Login" />
    )
  );
};

export default PrivateRoute;
