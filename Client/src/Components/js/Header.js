import "../css/Header.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileImage from "../../assets/images/profile_image_template.png";
import Logo from "../../assets/images/logo.png";
import ProfileInfo from "../js/ProfileInfo";
export default function Header(props) {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        if (!props.cartToast) return;
        const t = setTimeout(() => props.setCartToast(null), 2500);
        return () => clearTimeout(t);
    }, [props.cartToast]);
    function userLogin() {
        navigate('/login');
    }
    async function userLogout() {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            props.setIsLoggedIn(false);
            props.setUserDetails(null);
            setIsProfileOpen(false);
            navigate('/');
        }
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
            <img src={Logo} alt="Amudhootru logo" className="header_logo" />
            <span className="header_actions">
                <p className="header_loginButton" onClick={() => navigate('/about')}>About Us</p>
                {props.isLoggedIn && <p className="header_loginButton" onClick={() => navigate('/track-orders')}>Track Orders</p>}
                {props.isLoggedIn && props.userDetails?.isAdminUser && (
                    <p className="header_loginButton" onClick={() => navigate('/add-products')}>Edit Products</p>
                )}
                {props.isLoggedIn && props.userDetails?.isAdminUser && (
                    <p className="header_loginButton" onClick={() => navigate('/manage-orders')}>Manage Orders</p>
                )}
                {!props.isLoggedIn && <button className="header_loginButton" onClick={userLogin}>Login</button>}
                {props.isLoggedIn && (
                    <span className="cartIconWrapper">
                        <i className="cartIcon fa-solid fa-cart-shopping cart-icon" onClick={goToCart}></i>
                        {props.userDetails?.isCartItemsAvailable && <span className="cartBadge"></span>}
                        {props.cartToast && (
                            <span className="cartToast">
                                <i className="fa-solid fa-circle-check cartToastCheck"></i>
                                <span><strong>{props.cartToast}</strong> added to cart!</span>
                            </span>
                        )}
                    </span>
                )}
                <img
                    src={props.userDetails && props.userDetails.profileimage ? props.userDetails.profileimage : ProfileImage}
                    alt="Profile"
                    className="profileImage"
                    onClick={profileImageClick}
                />
            </span>
            {isProfileOpen && <ProfileInfo userDetails={props.userDetails} setIsProfileOpen={setIsProfileOpen} setUserDetails={props.setUserDetails} onLogout={userLogout} />}
        </div>
    );
}
