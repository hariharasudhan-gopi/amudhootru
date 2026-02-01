import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthentication } from '../context/Authentication'
import { useField } from '../context/FieldList'
import HashImageComponent from '../DynamicComponent/HashImageComponent'
import HashTextComponent from '../DynamicComponent/HashTextComponent'
import './ProductPage.css'
import './BuyNowPage.css'


const BuyNowPage = () => {
    const {isLoggedIn} = useAuthentication();
    const {itemsToBuy,setItemsToBuy,listOfProducts} = useField();
    const navigate = useNavigate();
  
    var productMap = {}
    
    var userDetailsFieldList = [{type : "text", id : "FlatNo", label : "Enter FlatNo", isEditable : true, showLabel : true, requied : true, applicantType : "buyNow"},
                                {type : "text", id : "Street", label : "Enter Street", isEditable : true, showLabel : true, requied : true, applicantType : "buyNow"},
                                {type : "text", id : "City", label : "Enter City", isEditable : true, showLabel : true, requied : true, applicantType : "buyNow"},
                                {type : "text", id : "State", label : "Enter State", isEditable : true, showLabel : true, requied : true, applicantType : "buyNow"},
                                {type : "text", id : "Country", label : "Enter Country", isEditable : true, showLabel : true, requied : true, applicantType : "buyNow"}];

    listOfProducts.filter(function(prd){
      if(prd.imgUrl){
        var PrdDetail = {"name" : prd.name, "imgComp" : prd.imgUrl, "scale" : prd.scale, "purchaseQuantity" : prd.purchaseQuantity};
        productMap[prd.id] = PrdDetail;
      }
    })
  
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
      setItemsToBuy(itemsToBuy.filter(item => item !== productName));
    }

    function handlePlaceOrder(event){
        var enteredCredentials = {};
        var fieldLen = userDetailsFieldList.length;
        for (var i = 0; i < fieldLen; i++){
            var className = userDetailsFieldList[i].applicantType + "_" +userDetailsFieldList[i].id;
            var elem = document.getElementsByClassName(className);
            var val = elem[0].value;
            var enteredValue = {id : userDetailsFieldList[i].id, value : val, label : userDetailsFieldList[i].label};
            enteredCredentials[userDetailsFieldList[i].id] = enteredValue;
        }
        var address = enteredCredentials.FlatNo.value + ", " + enteredCredentials.Street.value + ",\n " + enteredCredentials.City.value + ",\n " + enteredCredentials.State.value + ",\n " + enteredCredentials.Country.value + "."
        var res = window.confirm("Please conform Your Address\n" + address);
        if(res){
            alert('OrderPlaced Successfully');
            setItemsToBuy([]);
        }
    }

    function handleIncrement(event){
      var product = event.target.classList[0];
      productMap[product].purchaseQuantity += 1;
    }

    function handleDecrement(event){
      var product = event.target.classList[0];
      productMap[product].purchaseQuantity -= 1;
    }
  
    return (
      <div>BuyNowPage..
        <div className='productsOuterContainer'>
        {itemsToBuy.map((item, index) => (
            <div className='productContainer'>
              <p>{productMap[item].name}</p>
              <HashImageComponent fieldClass= "productImage" imageUrl={productMap[item].imgComp}></HashImageComponent>
              <div className='productQuantityContainer'>Quantity in {productMap[item].scale}<div className={item + ' quantityControllers'} onClick={handleDecrement}>-</div>{productMap[item].purchaseQuantity}<div className={item + ' quantityControllers'} onClick={handleIncrement}>+</div></div>
              <button className = {productMap[item].name} onClick={goToEnquirePage}>ViewDetails</button>
              <button className = {item} onClick={handleBuyNow}>BuyNow</button>
            </div>
          ))}
        </div>
        {
            userDetailsFieldList.map((item) => (
                <HashTextComponent id={item.id} fieldClass={"fieldContainer_" + item.name} label={item.label} type="text" isEditable="true" showLabel="true" applicantType={item.applicantType}/>
            ))
        }
        <div>Verify your details before proceed further..</div>
        <button className = "placeOrder" onClick={handlePlaceOrder}>PlaceOrder</button>
      </div>
    )
}

export default BuyNowPage
