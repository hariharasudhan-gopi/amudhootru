import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthentication } from '../context/Authentication'
import { useField } from '../context/FieldList'
import HashImageComponent from '../DynamicComponent/HashImageComponent'
import HashCheckBoxComponent from '../DynamicComponent/HashCheckBoxComponent'
import './ProductPage.css'
import BuyNowPage from './BuyNowPage'
import { useEffect } from 'react';
import axios from 'axios';


const ProductPage = () => {

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const response = await axios.get("http://localhost:8080/products/getProducts");
        const result = await response.data;
        var resultLen = result.length;
        for(var i = 0; i < resultLen; i++){
          result[i].availableQantity = result[i].availablequantity;
          result[i].name = result[i].productname;
          result[i].imgUrl = result[i].imagesrc;
        }
        setProductList(result);
      } catch (err) {
        debugger
      }
    };

    fetchProductsData();
  }, []);

  const {isLoggedIn,isAdminProfile} = useAuthentication();
  const {cartItems,setCartItems,cartCount,listOfProducts,itemsToBuy,setItemsToBuy,productList,setProductList} = useField();
  
  var productMap = {}
  
  productList.filter(function(prd){
    if(prd.imgUrl){
      var PrdDetail = {"name" : prd.name, "imgComp" : prd.imgUrl};
      productMap[prd.id] = PrdDetail;
    }
  })
  
  const navigate = useNavigate();
  const goToEnquirePage = (event) => {
    var sevciceId = event.target.className;
    if(isLoggedIn){
      navigate('/Enquire/'+sevciceId);
    }else{
      navigate('/Login');
    }
  }
  function handleAddToCart(event){
    var currentuserProfile = localStorage.getItem('currentUserProfile');
    currentuserProfile = JSON.parse(currentuserProfile);
    var userId = currentuserProfile.id;
    var product = {
      "userid"      : userId,
      "productname" : event.target.classList[0],
      "status"      : 1
    }
    axios.post("http://localhost:8080/products/addToCart", product).then(function(resp){
      alert(resp.data);
      if(!isLoggedIn){
        navigate('/Login');
      }
    }).catch(function(err){
      debugger
    })
    // var productName = event.target.classList[0];
    // setCartItems((prevItems) => [...prevItems, productName]);
    // cartCount.current = cartCount.current + 1;
    // if(!isLoggedIn){
    //   navigate('/Login');
    // }
  }
  function handleRemoveFromCart(event){
    // var productName = event.target.classList[0];
    // setCartItems(cartItems.filter(item => item !== productName));
    // cartCount.current = cartCount.current - 1;
  }
  function handleBuyNow(event){
    // var productName = event.target.classList[0];
    // setItemsToBuy((prevItems) => [...prevItems, productName]);
    // event.target.closest('.productContainer').classList.add('disableProduct')
  }
  function handleRemoveItem(event){
    // var productName = event.target.classList[0];
    // var updatedProductList = productList.map((item) => item.id === productName ? { ...item, isNotAvailable: true } : item);
    // setProductList(updatedProductList);
  }
  function handleOutOfStock(event){
    // var productName = event.target.classList[0];
    // var updatedProductList = productList.map((item) => item.id === productName ? { ...item, isOutOfStock: true } : item);
    // setProductList(updatedProductList);
  }
  function handleMarkAsAvailable(event){
    // var productName = event.target.classList[0];
    // var updatedProductList = productList.map((item) => item.id === productName ? { ...item, isOutOfStock: false } : item);
    // setProductList(updatedProductList);
  }
  
  return (
    <div>
      <h1> Choose your product... </h1>
      <div className='productsOuterContainer'>
        {productList.map((item) => (
          !item.isNotAvailable ? (<div className={'productContainer ' + (itemsToBuy.includes(item.id) ? 'disableProduct' : '')}>
            <div className='productTitle'>
              {itemsToBuy.includes(item.id) ? <HashCheckBoxComponent fieldClass={item.id} isChecked={cartItems.includes(item.id) ? "true" : "false"} type="checkbox"></HashCheckBoxComponent> : null}
              <p>{item.name}</p>
            </div>
            <HashImageComponent fieldClass= "productImage" imageUrl={productMap[item.id].imgComp}></HashImageComponent>
            <button className = {item.id} onClick={goToEnquirePage}>ViewDetails</button>
            {!isAdminProfile ? 
            (<div className='buttonContainer'>{cartItems.includes(item.id) ? <button className = {item.id} onClick={handleRemoveFromCart}>RemoveFromCart</button> : <button className = {item.id} onClick={handleAddToCart}>AddToCart</button>}
              <button className = {item.id} onClick={handleBuyNow}>BuyNow</button></div>) 
            : ( <div>
                  <button className = {item.id} onClick={handleRemoveItem}>RemoveItem</button>
                  {!item.isOutOfStock ? <button className = {item.id} onClick={handleOutOfStock}>OutOfStock</button> : 
                                        <button className = {item.id} onClick={handleMarkAsAvailable}>MarkAsAvailable</button>  }
                </div>)}
          </div>) : null
        ))}
      </div>
      {itemsToBuy.length > 0 ? <BuyNowPage></BuyNowPage> : null}
    </div>
  )
}

export default ProductPage
