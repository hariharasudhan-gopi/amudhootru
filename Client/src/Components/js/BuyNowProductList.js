import { useState } from 'react';
import "../css/BuyNowProductList.css";
export default function BuyNowProductList(props) {
    const [productPrice, setProductPrice] = useState(props.products[0].price);
    const [productQuantity, setProductQuantity] = useState(1);
    function increaseQuantity(){
        const maxQty = props.products[0].availablequantity;
        if (maxQty !== undefined && productQuantity >= maxQty) {
            alert(`Only ${maxQty} unit${maxQty === 1 ? '' : 's'} available in stock.`);
            return;
        }
        setProductQuantity(productQuantity + 1);
        setProductPrice(productPrice + props.products[0].price);
        props.setTotalPrice(prevTotal => prevTotal + props.products[0].price);
        props.updateProductQuantity(props.products[0].code, productQuantity + 1);
    }
    function decreaseQuantity(){
        if(productQuantity > 1){
            setProductQuantity(productQuantity - 1);
            setProductPrice(productPrice - props.products[0].price);
            props.setTotalPrice(prevTotal => prevTotal - props.products[0].price);
            props.updateProductQuantity(props.products[0].code, productQuantity - 1);
        }
    }
    return (
        <div className="buyNowProductListContainer">
            {props.products.map((product) => (
                <div key={product.id} className="buyNowProduct">
                    <h3>{product.name}</h3>
                    <span className="productDetails">
                        <span className="priceDetails">
                            <span className="productPrice">
                                <p>Price: ₹{productPrice}</p>
                            </span>
                            <span className="quantityInfo">
                                <p>Quantity:</p>
                                <i className="fa-solid fa-plus" onClick={increaseQuantity}></i>
                                <p>{productQuantity}</p>
                                <i className="fa-solid fa-minus" onClick={decreaseQuantity}></i>
                            </span>    
                        </span>
                        <span className="productImage">
                            {product.img_src && <img src={product.img_src} alt={product.name} width={product.dimensions.width} height={product.dimensions.height} />}
                        </span>
                    </span>
                </div>
            ))}
        </div>
    )
}