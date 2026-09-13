import { useState } from 'react';
import "../css/BuyNowProductList.css";

function getEffectivePrice(product) {
    return product.offerprice && Number(product.offerprice) > 0 && Number(product.offerprice) < Number(product.price)
        ? Number(product.offerprice)
        : Number(product.price);
}

export default function BuyNowProductList(props) {
    const unitPrice = getEffectivePrice(props.products[0]);
    const basePrice = Number(props.products[0].price);
    const hasOffer = unitPrice < basePrice;
    const discountPercent = hasOffer ? Math.max(1, Math.round(((basePrice - unitPrice) / basePrice) * 100)) : 0;
    const initialQuantity = Number(props.products[0].quantity) || 1;
    const [productPrice, setProductPrice] = useState(unitPrice * initialQuantity);
    const [productQuantity, setProductQuantity] = useState(initialQuantity);
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
                    <label className="buyNowProductSelect" title="Include this product in the order">
                        <input
                            type="checkbox"
                            className="orderIncludeCheckbox"
                            checked={!!props.isSelected}
                            onChange={props.onToggleSelect}
                        />
                    </label>

                    <span className="buyNowProductImage">
                        {product.img_src && <img src={product.img_src} alt={product.name} width={product.dimensions.width} height={product.dimensions.height} />}
                    </span>

                    <span className="buyNowProductInfo">
                        <span className="buyNowProductNameRow">
                            <h3>{product.name}</h3>
                            {hasOffer && <span className="buyNowOfferBadge">{discountPercent}% OFF</span>}
                        </span>

                        <span className="buyNowPriceRow">
                            <span className="buyNowUnitPrice">₹{unitPrice}{product.unit ? '/' + product.unit : ''}</span>
                            {hasOffer && <span className="productOldPrice">₹{basePrice}</span>}
                        </span>

                        <span className="buyNowQuantityRow">
                            <span className="quantityInfo">
                                <span className="qtyLabel">Quantity:</span>
                                <span className="buyNowQtyStepper">
                                    <button
                                        type="button"
                                        className="buyNowQtyBtn"
                                        onClick={decreaseQuantity}
                                        disabled={productQuantity <= 1}
                                        title="Decrease quantity"
                                    >
                                        <i className="fa-solid fa-minus"></i>
                                    </button>
                                    <span className="qtyStepValue">{productQuantity}{product.unit ? ' ' + product.unit : ''}</span>
                                    <button
                                        type="button"
                                        className="buyNowQtyBtn"
                                        onClick={increaseQuantity}
                                        title="Increase quantity"
                                    >
                                        <i className="fa-solid fa-plus"></i>
                                    </button>
                                </span>
                            </span>
                            <span className="buyNowItemTotal">
                                Item Total: <strong>₹{productPrice}</strong>
                            </span>
                        </span>
                    </span>

                    <button className="removeFromCartBtn" onClick={() => props.onRemove(product.code)} title="Remove from cart">
                        <i className="fa-solid fa-trash"></i> Remove
                    </button>
                </div>
            ))}
        </div>
    )
}
