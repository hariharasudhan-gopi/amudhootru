import logo from './logo.svg';
import './App.css';
import { TrackOrders } from './Components/js/TrackOrders.js';
import ProfileInfo from './Components/js/ProfileInfo.js';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
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
          <Route path="/buynow" element={<BuyNow isLoggedIn={isLoggedIn} userDetails={userDetails} setUserDetails={setUserDetails} />} />
          <Route path="/track-orders" element={<TrackOrders userDetails={userDetails} />} />
          <Route path="/add-products" element={<AddProducts userDetails={userDetails} setUserDetails={setUserDetails} />} />
          <Route path="/manage-orders" element={<ManageOrders userDetails={userDetails} />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </BrowserRouter>  
      
    </div>
  );
}

export default App;
