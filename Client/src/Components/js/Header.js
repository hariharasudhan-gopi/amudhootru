import "../css/Header.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Routes, Route } from "react-router-dom";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileImage from "../../assets/images/profile_image_template.png";
import ProfileInfo from "../js/ProfileInfo";
export default function Header(props) {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    function userLogin() {
        navigate('/login');
    }
    function userLogout() {
        props.setIsLoggedIn(false);
        props.setUserDetails(null);
        navigate('/');
    }
    function profileImageClick() {
        if(props.isLoggedIn){
            setIsProfileOpen(!isProfileOpen);
        }else{
            setIsProfileOpen(false);
        }
    }
    function goToCart() {
        if(props.userDetails && props.userDetails.isCartItemsAvailable){
            navigate('/buynow');
        }else{
            alert('No items in cart, Add your item to cart to proceed');
        }
    }
    return (
        <div className="header_container">
            <h1 className="header_title">Amudhootru</h1>
            <span className="header_actions">
                {props.isLoggedIn && <p className="header_loginButton" onClick={() => navigate('/track-orders')}>Track Orders</p>}
                {props.isLoggedIn && props.userDetails?.isAdminUser && (
                    <p className="header_loginButton" onClick={() => navigate('/add-products')}>Edit Products</p>
                )}
                {props.isLoggedIn && props.userDetails?.isAdminUser && (
                    <p className="header_loginButton" onClick={() => navigate('/manage-orders')}>Manage Orders</p>
                )}
                {!props.isLoggedIn ? <button className="header_loginButton" onClick={userLogin}>Login</button> : <button className="header_loginButton" onClick={userLogout}>Logout</button>}
                {props.isLoggedIn && <i className=" cartIcon fa-solid fa-cart-shopping cart-icon" onClick={goToCart}></i>}
                <img
                    src={props.userDetails && props.userDetails.profileimage ? props.userDetails.profileimage : ProfileImage}
                    alt="Profile"
                    className="profileImage"
                    onClick={profileImageClick}
                />
            </span>
            {isProfileOpen && <ProfileInfo userDetails={props.userDetails} setIsProfileOpen={setIsProfileOpen} setUserDetails={props.setUserDetails} />}
        </div>
    );
}