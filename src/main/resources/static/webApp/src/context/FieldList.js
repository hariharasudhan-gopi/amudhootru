import { createContext, useContext, useState, useRef } from "react";
import ProductImg1 from '../Images/Product1.png'
import ProductImg2 from '../Images/Product2.png'
import ProductImg3 from '../Images/Product3.png'
import ProductImg4 from '../Images/Product4.png'

const fieldContext = createContext();

//Provider
const FieldProvider = ({children}) => {
    var signUpFields = [{label : "Name", type : "text", id : "Name", isEditable : true, showLabel : true, requied : true},
                        {label : "Email", type : "email", id : "Email", isEditable : true, showLabel : true, requied : true},
                        {label : "PhoneNo", type : "tel", id : "PhoneNo", isEditable : true, showLabel : true, requied : true},
                        {label : "Date Of Birth", type : "date", id : "DateOfBirth", isEditable : true, showLabel : true, requied : true},
                        {label : "Password", type : "password", id : "Password", isEditable : true, showLabel : true, requied : true},
                        {label : "Confirm Password", type : "password", id : "ConfirmPassword", isEditable : true, showLabel : true, requied : true}];
    var signInFields = [{label : "UserName", type : "email", placeHolder : "Enter Your Email", id : "UserName", isEditable : true, showLabel : false, requied : true},
                        {label : "Password", type : "password", placeHolder : "Enter Your Password", id : "Password", isEditable : true, showLabel : false, requied : true}];
    var listOfProducts = [  {name : "GrountNut", id : "Product1", imgUrl : ProductImg1, scale : "kilogram", isDefault : true, availableQantity : 100, purchaseQuantity : 1},
                            {name : "GrountNut Oil", id : "Product2", imgUrl : ProductImg2, scale : "liter", isDefault : true, availableQantity : 100, purchaseQuantity : 1},
                            {name : "Gingelly Oil", id : "Product3", imgUrl : ProductImg3, scale : "liter", isDefault : true, availableQantity : 100, purchaseQuantity : 1},
                            {name : "GrountNut Cake", id : "Product4", imgUrl : ProductImg4, scale : "kilogram", isDefault : true, availableQantity : 100, purchaseQuantity : 1}
                        ];
    var [fieldList, setFieldList] = useState();
    var [initialLoad, setInitialLoad] = useState(0);
    var [actionState, setActionState] = useState("");
    var [errorMessage, setErrorMessage] = useState({});
    var [cartItems, setCartItems] = useState([]);
    var [itemsToBuy, setItemsToBuy] = useState([]);
    var [productList, setProductList] = useState(listOfProducts);
    const cartCount = useRef(0);

    return(
        <fieldContext.Provider value={{signInFields,signUpFields,listOfProducts,fieldList,setFieldList,initialLoad,setInitialLoad,actionState,setActionState,errorMessage,setErrorMessage,cartItems,setCartItems,cartCount,itemsToBuy,setItemsToBuy,productList,setProductList}}>
            {children}
        </fieldContext.Provider>
    );
}

//Consumer
const useField = () => useContext(fieldContext);
export {useField, FieldProvider};
