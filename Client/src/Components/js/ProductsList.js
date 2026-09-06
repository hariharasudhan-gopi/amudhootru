import Product from './Product.js';
import '../../Components/css/ProductList.css';
import heroImage from '../../assets/images/background_image.png';

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';


export default function ProductsList(props) {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

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
            <Product key={product.id} {...product} isLoggedIn={props.isLoggedIn} userDetails={props.userDetails} setUserDetails={props.setUserDetails} setCartToast={props.setCartToast} /> 
          ))}
        </span>
      </section>
    </div>
  );
}