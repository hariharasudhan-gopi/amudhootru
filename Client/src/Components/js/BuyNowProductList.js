import { useState } from 'react';
import "../css/BuyNowProductList.css";

function getEffectivePrice(product) {
    return product.offerprice && Number(product.offerprice) > 0 && Number(product.offerprice) < Number(product.price)
        ? Number(product.offerprice)
        : Number(product.price);
}

export default function BuyNowProductList(props) {
    const unitPrice = getEffectivePrice(props.products[0]);
    const hasOffer = unitPrice < Number(props.products[0].price);
    const [productPrice, setProductPrice] = useState(unitPrice);
    const [productQuantity, setProductQuantity] = useState(1);
    function increaseQuantity(){
        const maxQty = props.products[0].availablequantity;
        if (maxQty !== undefined && productQuantity >= maxQty) {
            alert(`Only ${maxQty} unit${maxQty === 1 ? '' : 's'} available in stock.`);
            return;
        }
        setProductQuantity(productQuantity + 1);
        setProductPrice(productPrice + unitPrice);
        props.setTotalPrice(prevTotal => prevTotal + unitPrice);
        props.updateProductQuantity(props.products[0].code, productQuantity + 1);
    }
    function decreaseQuantity(){
        if(productQuantity > 1){
            setProductQuantity(productQuantity - 1);
            setProductPrice(productPrice - unitPrice);
            props.setTotalPrice(prevTotal => prevTotal - unitPrice);
            props.updateProductQuantity(props.products[0].code, productQuantity - 1);
        }
    }
    return (
        <div className="buyNowProductListContainer">
            {props.products.map((product) => (
                <div key={product.id} className={`buyNowProduct${props.isSelected ? '' : ' buyNowProductUnselected'}`}>
                    <span className="buyNowProductHeader">
                        <span className="buyNowProductSelect">
                            <input
                                type="checkbox"
                                className="orderIncludeCheckbox"
                                checked={!!props.isSelected}
                                onChange={props.onToggleSelect}
                                title="Include this product in the order"
                            />
                            <h3>{product.name}</h3>
                        </span>
                        <button className="removeFromCartBtn" onClick={() => props.onRemove(product.code)} title="Remove from cart">
                            <i className="fa-solid fa-trash"></i> Remove
                        </button>
                    </span>
                    <span className="productDetails">
                        <span className="priceDetails">
                            <span className="productPrice">
                                <p>
                                    ₹{unitPrice}{props.products[0].unit ? '/' + props.products[0].unit : ''}
                                    {hasOffer && <span className="productOldPrice">₹{props.products[0].price}</span>}
                                </p>
                                {productQuantity > 1 && <p className="productSubtotal">Subtotal: ₹{productPrice}</p>}
                            </span>
                            <span className="quantityInfo">
                                <p>Quantity:</p>
                                <i className="fa-solid fa-plus" onClick={increaseQuantity}></i>
                                <p>{productQuantity}{props.products[0].unit ? ' ' + props.products[0].unit : ''}</p>
                                <i className="fa-solid fa-minus"
                                        onClick={decreaseQuantity}
                                        style={productQuantity <= 1 ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : {}}></i>
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
