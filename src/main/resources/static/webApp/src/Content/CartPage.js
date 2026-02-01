import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthentication } from '../context/Authentication'
import { useField } from '../context/FieldList'
import ProductImg1 from '../Images/Product1.png'
import ProductImg2 from '../Images/Product2.png'
import ProductImg3 from '../Images/Product3.png'
import ProductImg4 from '../Images/Product4.png'
import HashImageComponent from '../DynamicComponent/HashImageComponent'
import './ProductPage.css'
import BuyNowPage from './BuyNowPage'

const CartPage = () => {

  const {isLoggedIn} = useAuthentication();
  const {cartItems,setCartItems,cartCount,itemsToBuy,setItemsToBuy} = useField();
  const navigate = useNavigate();
  const Product1 = ProductImg1
  const Product2 = ProductImg2
  const Product3 = ProductImg3
  const Product4 = ProductImg4

  var productMap = {"Product1" : {"name" : "Product1", "imgComp" : Product1},
                    "Product2" : {"name" : "Product2", "imgComp" : Product2},
                    "Product3" : {"name" : "Product3", "imgComp" : Product3},
                    "Product4" : {"name" : "Product4", "imgComp" : Product4}}

  const goToEnquirePage = (event) => {
    var sevciceId = event.target.className;
    if(isLoggedIn){
      navigate('/Enquire/'+sevciceId);
    }else{
      navigate('/Login');
    }
  }
    
  function handleBuyNow(event){
    var productName = event.target.classList[0];
    setCartItems(cartItems.filter(item => item !== productName));
    cartCount.current = cartCount.current - 1;
    setItemsToBuy((prevItems) => [...prevItems, productName]);
  }

  return (
    <div>
      {cartItems.length === 0 ? <div>Your Cart Is Empty.</div> :
        <div className='productsOuterContainer'>
        {cartItems.map((item, index) => (
            <div className={'productContainer ' + (itemsToBuy.includes(item.id) ? 'disableProduct' : '')}>
              <p>{productMap[item].name}</p>
              <HashImageComponent fieldClass= "productImage" imageUrl={productMap[item].imgComp}></HashImageComponent>
              <button className = {productMap[item].name} onClick={goToEnquirePage}>ViewDetails</button>
              <button className = {item} onClick={handleBuyNow}>BuyNow</button>
            </div>
          ))}
        </div>
      }
      {itemsToBuy.length > 0 ? <BuyNowPage></BuyNowPage> : null}
    </div>
  )
}

export default CartPage
