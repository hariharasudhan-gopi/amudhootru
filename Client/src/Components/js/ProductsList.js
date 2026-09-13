import Product from './Product.js';
import '../../Components/css/ProductList.css';
import heroImage from '../../assets/images/background_image.png';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';


export default function ProductsList(props) {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCodes, setCartCodes] = useState(new Set());
  const [cartQuantities, setCartQuantities] = useState(new Map());

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchCartCodes = useCallback(async () => {
    if (!props.isLoggedIn) {
      setCartCodes(new Set());
      setCartQuantities(new Map());
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products/getcart`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.status === 404) {
        setCartCodes(new Set());
        setCartQuantities(new Map());
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch cart items');
      }

      const data = await response.json();
      const items = data.products || [];
      setCartCodes(new Set(items.map((product) => product.code || product.productcode)));
      setCartQuantities(new Map(items.map((product) => [product.code || product.productcode, Number(product.quantity) || 1])));
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  }, [props.isLoggedIn]);

  useEffect(() => {
    fetchCartCodes();
  }, [fetchCartCodes]);

  useEffect(() => {
    window.addEventListener('cart-count-changed', fetchCartCodes);
    return () => window.removeEventListener('cart-count-changed', fetchCartCodes);
  }, [fetchCartCodes]);

  function handleAddedToCart(code) {
    setCartCodes(prev => {
      const next = new Set(prev);
      next.add(code);
      return next;
    });
    setCartQuantities(prev => new Map(prev).set(code, 1));
  }

  async function incrementCartItem(code) {
    const current = cartQuantities.get(code) || 1;
    const next = current + 1;
    setCartQuantities(prev => new Map(prev).set(code, next));
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/products/updatecartquantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productCode: code, quantity: next })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Error increasing cart quantity:', error);
      setCartQuantities(prev => new Map(prev).set(code, current));
    }
  }

  async function decrementCartItem(code) {
    const current = cartQuantities.get(code) || 1;
    if (current <= 1) return;
    const next = current - 1;
    setCartQuantities(prev => new Map(prev).set(code, next));
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/products/updatecartquantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productCode: code, quantity: next })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Error decreasing cart quantity:', error);
      setCartQuantities(prev => new Map(prev).set(code, current));
    }
  }

  async function removeCartItem(code) {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/products/removefromcart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productCode: code })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      setCartCodes(prev => {
        const next = new Set(prev);
        next.delete(code);
        if (props.setUserDetails) {
          props.setUserDetails(u => ({ ...u, isCartItemsAvailable: next.size > 0 }));
        }
        window.dispatchEvent(new CustomEvent('cart-count-changed', { detail: { count: next.size } }));
        return next;
      });
      setCartQuantities(prev => {
        const next = new Map(prev);
        next.delete(code);
        return next;
      });
    } catch (error) {
      console.error('Error removing product from cart:', error);
    }
  }

  useEffect(() => {
    function handleCatalogSearch(event) {
      setSearchTerm((event.detail || '').toLowerCase().trim());
      const section = document.getElementById('products-grid');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    window.addEventListener('catalog-search', handleCatalogSearch);
    return () => window.removeEventListener('catalog-search', handleCatalogSearch);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }

      const data = await response.json();
      setProducts(data.products); // Assuming the response contains a "products" array
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;

    return products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();
      const code = String(product.code || '').toLowerCase();
      return name.includes(searchTerm) || desc.includes(searchTerm) || code.includes(searchTerm);
    });
  }, [products, searchTerm]);

  function scrollToProducts() {
    const section = document.getElementById('products-grid');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="productsPageContainer">
      <section className="marketHeroSection">
        <div className="marketHeroContent">
          <span className="marketHeroPill">
            <i className="fa-solid fa-leaf"></i>
            <span>Good for You. Good for Nature.</span>
          </span>
          <h1 className="marketHeroTitle">Fresh from Nature, Delivered to You</h1>
          <p className="marketHeroSubtitle">
            Discover farm-fresh groceries, wholesome essentials, and naturally crafted products for your healthy lifestyle.
          </p>
          <div className="marketHeroActions">
            <button className="heroPrimaryBtn" onClick={scrollToProducts}>Shop Now</button>
            <button className="heroSecondaryBtn" onClick={() => navigate('/about')}>Explore Story</button>
          </div>
        </div>

        <div className="marketHeroImageWrap">
          <img src={heroImage} alt="Organic products basket" className="marketHeroImage" />
          <div className="heroInfoCard heroInfoTop">
            <i className="fa-solid fa-shield-heart"></i>
            <span>100% Natural</span>
          </div>
          <div className="heroInfoCard heroInfoBottom">
            <i className="fa-solid fa-truck-fast"></i>
            <span>Same Day Delivery</span>
          </div>
        </div>
      </section>

      <section className="marketTrustRow">
        <div className="marketTrustItem"><i className="fa-regular fa-circle-check"></i><span>100% Organic Produce</span></div>
        <div className="marketTrustItem"><i className="fa-solid fa-lock"></i><span>Secure Payments</span></div>
        <div className="marketTrustItem"><i className="fa-solid fa-recycle"></i><span>Sustainable Packaging</span></div>
        <div className="marketTrustItem"><i className="fa-regular fa-face-smile"></i><span>Trusted by Customers</span></div>
      </section>

      <section id="products-grid" className="productsListWrap">
        {searchTerm && (
          <p className="searchResultText">
            Showing results for "{searchTerm}" ({filteredProducts.length})
          </p>
        )}
        <span className="productsList">
          {filteredProducts.map(product => (
            <Product key={product.id} {...product} isLoggedIn={props.isLoggedIn} userDetails={props.userDetails} setUserDetails={props.setUserDetails} setCartToast={props.setCartToast} isInCart={cartCodes.has(product.code)} onAddedToCart={handleAddedToCart} cartQuantity={cartQuantities.get(product.code) || 1} onIncrementCart={incrementCartItem} onDecrementCart={decrementCartItem} onRemoveFromCart={removeCartItem} /> 
          ))}
        </span>
      </section>
    </div>
  );
}
