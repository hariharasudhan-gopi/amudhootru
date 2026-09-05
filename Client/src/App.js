import './App.css';
import { TrackOrders } from './Components/js/TrackOrders.js';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductsList from './Components/js/ProductsList.js';
import Login from './Components/js/Login.js';
import SignUp from './Components/js/SignUp.js';
import BuyNow from './Components/js/BuyNow.js';
import Header from './Components/js/Header.js';
import AddProducts from './Components/js/AddProducts.js';
import ManageOrders from './Components/js/ManageOrders.js';
import About from './Components/js/About.js';

function App() {

  const [userDetails, setUserDetails] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartToast, setCartToast] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unable to restore session');
        }

        const data = await response.json();
        setIsLoggedIn(Boolean(data.isLoggedIn));
        setUserDetails(data.userDetails || null);
      } catch (error) {
        setIsLoggedIn(false);
        setUserDetails(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  function ProtectedRoute({ element }) {
    if (isAuthLoading) {
      return <div className="app_container">Loading...</div>;
    }

    return isLoggedIn ? element : <Navigate to="/login" replace />;
  }

  function AdminRoute({ element }) {
    if (isAuthLoading) {
      return <div className="app_container">Loading...</div>;
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }

    if (!userDetails?.isAdminUser) {
      return <Navigate to="/" replace />;
    }

    return element;
  }

  return (
    <div className="app_container">
      {/* <Header isLoggedIn={isLoggedIn}/> */}
      {/* <ProfileInfo /> */}

      <BrowserRouter>
        <Header isLoggedIn={isLoggedIn} userDetails={userDetails} setUserDetails={setUserDetails} setIsLoggedIn={setIsLoggedIn} cartToast={cartToast} setCartToast={setCartToast}/>
        <Routes>
          <Route path="/" element={<ProductsList isLoggedIn={isLoggedIn} userDetails={userDetails} setUserDetails={setUserDetails} setCartToast={setCartToast}/>} />
          <Route path="/login" element={<Login setUserDetails={setUserDetails} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<SignUp setUserDetails={setUserDetails} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/buynow" element={<ProtectedRoute element={<BuyNow isLoggedIn={isLoggedIn} userDetails={userDetails} setUserDetails={setUserDetails} />} />} />
          <Route path="/track-orders" element={<ProtectedRoute element={<TrackOrders userDetails={userDetails} />} />} />
          <Route path="/add-products" element={<AdminRoute element={<AddProducts userDetails={userDetails} setUserDetails={setUserDetails} />} />} />
          <Route path="/manage-orders" element={<AdminRoute element={<ManageOrders userDetails={userDetails} />} />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </BrowserRouter>  
      
    </div>
  );
}

export default App;
