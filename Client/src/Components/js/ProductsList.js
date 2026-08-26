import Product from './Product.js';
import product1Image from '../../assets/images/product1.png';
import groundNutOilImage from '../../assets/images/ground_nut_oil.png';
import coconutOilImage from '../../assets/images/coconut_oil.png';
import '../../Components/css/ProductList.css';

import { useEffect, useState } from "react";


export default function ProductsList(props) {

  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
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
  const products1 = [
    { id: 1, name: 'Product 1', price: 100, description: 'This is product 1', img_src: product1Image, dimensions: { width: 200, height: 200 } },
    { id: 2, name: 'Product 2', price: 200, description: 'This is product 2', img_src: groundNutOilImage, dimensions: { width: 200, height: 200 } },
    { id: 3, name: 'Product 3', price: 300, description: 'This is product 3', img_src: coconutOilImage, dimensions: { width: 200, height: 200 } },
    { id: 4, name: 'Product 4', price: 400, description: 'This is product 4', img_src: product1Image, dimensions: { width: 200, height: 200 } },
    { id: 5, name: 'Product 5', price: 500, description: 'This is product 5', img_src: groundNutOilImage, dimensions: { width: 200, height: 200 } },
    { id: 6, name: 'Product 6', price: 600, description: 'This is product 6', img_src: coconutOilImage, dimensions: { width: 200, height: 200 } },
  ];
  return (
    <div className="productsPageContainer">
      {/* <h1>Products List</h1> */}
      <span className="productsList">
        {products.map(product => (
          <Product key={product.id} {...product} isLoggedIn={props.isLoggedIn} userDetails={props.userDetails} setUserDetails={props.setUserDetails} setCartToast={props.setCartToast} /> 
        ))}
      </span>
    </div>
  );
}