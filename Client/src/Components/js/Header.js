import "../css/Header.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileImage from "../../assets/images/profile_image_template.png";
import Logo from "../../assets/images/logo.png";
import ProfileInfo from "../js/ProfileInfo";

export default function Header({
    isLoggedIn,
    userDetails,
    setIsLoggedIn,
    setUserDetails,
    cartToast,
    setCartToast,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [cartItemsCount, setCartItemsCount] = useState(0);

    useEffect(() => {
        if (!cartToast) return;
        const t = setTimeout(() => setCartToast(null), 2500);
        return () => clearTimeout(t);
    }, [cartToast, setCartToast]);

    // Header is fixed to the viewport; broadcast its height so the page content can offset itself.
    useEffect(() => {
        const node = headerRef.current;
        if (!node || typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver(() => {
            // Use the rendered border-box height; contentRect excludes padding/border and underreports it.
            const height = node.getBoundingClientRect().height;
            if (height) {
                window.dispatchEvent(new CustomEvent('header-height-changed', { detail: { height } }));
            }
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        async function fetchCartCount() {
            if (!isLoggedIn) {
                setCartItemsCount(0);
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/products/getcart`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (response.status === 404) {
                    setCartItemsCount(0);
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch cart count');
                }

                const data = await response.json();
                setCartItemsCount((data.products || []).length);
            } catch (error) {
                console.error('Failed to load cart items count:', error);
            }
        }

        fetchCartCount();
    }, [isLoggedIn, location.pathname, cartToast]);

    useEffect(() => {
        function handleCartCountChanged(event) {
            const nextCount = Number(event.detail?.count);
            if (!Number.isNaN(nextCount)) {
                setCartItemsCount(nextCount);
            }
        }

        window.addEventListener('cart-count-changed', handleCartCountChanged);
        return () => window.removeEventListener('cart-count-changed', handleCartCountChanged);
    }, []);

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
            setIsLoggedIn(false);
            setUserDetails(null);
            setIsProfileOpen(false);
            navigate('/');
        }
    }

    function profileImageClick() {
        if(isLoggedIn){
            setIsProfileOpen(!isProfileOpen);
        }else{
            setIsProfileOpen(false);
        }
    }

    function searchProducts(event) {
        event.preventDefault();
        const term = searchText.trim();
        navigate('/');
        window.dispatchEvent(new CustomEvent('catalog-search', { detail: term }));
    }

    function clearSearch() {
        setSearchText('');
        navigate('/');
        window.dispatchEvent(new CustomEvent('catalog-search', { detail: '' }));
    }

    const cartCount = cartItemsCount;
    const isAboutActive = location.pathname === '/about';

    function goToCart() {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (cartCount > 0) {
            navigate('/buynow');
        } else {
            alert('No items in cart, Add your item to cart to proceed');
        }
    }

    return (
        <div className="header_container" ref={headerRef}>
            <span className="header_brand" onClick={() => navigate('/')}>
                <img src={Logo} alt="Amudhootru logo" className="header_logo" />
            </span>

            <nav className="header_navLinks">
                <button className={`header_navItem${!isAboutActive ? ' header_navItemActive' : ''}`} onClick={() => navigate('/')}>Home</button>
                <button className={`header_navItem${isAboutActive ? ' header_navItemActive' : ''}`} onClick={() => navigate('/about')}>About</button>
            </nav>

            <span className="header_actions">
                <form className="header_searchWrap" onSubmit={searchProducts}>
                    <input
                        className="header_searchInput"
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search products..."
                        aria-label="Search products"
                    />
                    {searchText && (
                        <button className="header_searchClearBtn" type="button" aria-label="Clear search" onClick={clearSearch}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}
                    <button className="header_searchBtn" type="submit" aria-label="Search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </button>
                </form>

                {isLoggedIn && <button className="header_loginButton" onClick={() => navigate('/track-orders')}>Track Orders</button>}
                {isLoggedIn && userDetails?.isAdminUser && (
                    <button className="header_loginButton" onClick={() => navigate('/add-products')}>Edit Products</button>
                )}
                {isLoggedIn && userDetails?.isAdminUser && (
                    <button className="header_loginButton" onClick={() => navigate('/manage-orders')}>Manage Orders</button>
                )}
                {!isLoggedIn && <button className="header_loginButton" onClick={userLogin}>Login</button>}

                <button className="header_cartButton" onClick={goToCart}>
                    <i className="cartIcon fa-solid fa-cart-shopping cart-icon"></i>
                    <span>Cart ({cartCount})</span>
                    {cartCount > 0 && <span className="cartBadge"></span>}
                </button>

                <img
                    src={userDetails && userDetails.profileimage ? userDetails.profileimage : ProfileImage}
                    alt="Profile"
                    className="profileImage"
                    onClick={profileImageClick}
                />

                {cartToast && (
                    <span className="cartToast">
                        <i className="fa-solid fa-circle-check cartToastCheck"></i>
                        <span><strong>{cartToast}</strong> added to cart!</span>
                    </span>
                )}
            </span>

            {isProfileOpen && <ProfileInfo userDetails={userDetails} setIsProfileOpen={setIsProfileOpen} setUserDetails={setUserDetails} onLogout={userLogout} />}
        </div>
    );
}
