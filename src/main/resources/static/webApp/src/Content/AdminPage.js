import React from 'react'
import { useAuthentication } from '../context/Authentication'
import { useField } from '../context/FieldList'
import HashTextComponent from '../DynamicComponent/HashTextComponent';
import HashPickListComponent from '../DynamicComponent/HashPickListComponent';
import HashImageComponent from '../DynamicComponent/HashImageComponent';
import { useState } from "react";
import './AdminPage.css';
import axios from 'axios';

const AdminPage = () => {

  const {isLoggedIn,isAdminProfile} = useAuthentication();
  const {listOfProducts,setProductList} = useField();
  var [addNewProduct, setAddNewProduct] = useState(false);
  var measurementScale = [{value : "kilogram"},{value : "liter"}];

  function hndleAddNewProduct(event){
    // var newProduct = {name : "name", id : "name", scale : "kilogram"};
    // listOfProducts.push(newProduct)
    setAddNewProduct(true);
  }
  function handleSubmitAction(){
    var ProductName = document.getElementsByClassName("NewProcudt_ProductName")[0].value;
    var ProductScale = document.getElementsByClassName("NewProcudt_ProductScale")[0].value;
    var ProductQuantity = document.getElementsByClassName("NewProcudt_ProductQuantity")[0].value;
    var ProductImage = document.getElementsByClassName("fieldContainer_ProductImage")[0].src;
    var NewProduct = {name : ProductName, id : ProductName, scale : ProductScale, isDefault : false, imgUrl : ProductImage, availableQantity : ProductQuantity};
    listOfProducts.push(NewProduct);
    setProductList(listOfProducts);
    setAddNewProduct(false);
    var addedProduct =  {
                          "productname"       : ProductName,
                          "quantity"          : parseInt(ProductQuantity),
                          "scale"             : ProductScale,
                          "availablestatus"   : true,
                          "availablequantity" : parseInt(ProductQuantity),
                          "imagesrc"          : ProductImage
                        }
    axios.post("http://localhost:8080/products/addProduct", addedProduct).then(function(){
      alert("Product Added Successfully");
    }).catch(function(err){
      debugger
    })
  }

  return (
    <div>AdminPage.
      {isAdminProfile && !addNewProduct ? <button onClick={hndleAddNewProduct}>AddNewProduct</button> : null}
      {isAdminProfile && addNewProduct ? 
        <div  className="AddNewProductContainer">
          <HashTextComponent id="ProductName" fieldClass="fieldContainer_ProductName" label="Enter New Product Name" type="text" applicantType="NewProcudt" isEditable="true" showLabel="true" />
          <HashPickListComponent id="ProductScale" fieldClass="fieldContainer_ProductScale" label="Enter New Product Scale" type="text" applicantType="NewProcudt" isEditable="true" showLabel="true" picklistValue={measurementScale}></HashPickListComponent>
          <HashTextComponent id="ProductQuantity" fieldClass="fieldContainer_ProductName" label="Enter Available Quantity" type="text" applicantType="NewProcudt" isEditable="true" showLabel="true" />
          <HashImageComponent id="ProductImage" fieldClass={"fieldContainer_ProductImage hashFieldContainer"} type="file" applicantType="NewProcudt" isEditable="true"/>
          <button onClick={handleSubmitAction}>Add</button>
        </div> 
        : null}
    </div>
  )
}

export default AdminPage
