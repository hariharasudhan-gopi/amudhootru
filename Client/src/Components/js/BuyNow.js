import BuyNowProductList from "./BuyNowProductList";
import product1Image from '../../assets/images/product1.png';
import groundNutOilImage from '../../assets/images/ground_nut_oil.png';
import coconutOilImage from '../../assets/images/coconut_oil.png';
import "../css/BuyNow.css";
import DeliveryAddress from "./DeliveryAddress";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export default function BuyNow(props) {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [showDeliveryAddress, setShowDeliveryAddress] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState(props.userDetails && props.userDetails.deliveryAddress && props.userDetails.deliveryAddress.length ? props.userDetails.deliveryAddress[0] : null);

    function updateProductQuantity(productId, newQuantity) {
        setProducts(prevProducts => {
            return prevProducts.map(product => {
                if (product.code === productId) {
                    return { ...product, quantity: newQuantity };
                }
                return product;
            });
        });
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/products/getcart?userId=` + props.userDetails.userId, {
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
            const normalised = data.products.map(p => ({
                ...p,
                dimensions: p.dimensions ?? { width: 50, height: 50 }
            }));
            setProducts(normalised);
            const total = normalised.reduce((sum, product) => sum + product.price * (product.quantity || 1), 0);
            setTotalPrice(total);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    async function removeFromCart(productCode) {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/products/removefromcart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productCode, userId: props.userDetails.userId })
            });
            if (!res.ok) throw new Error(await res.text());
            setProducts(prev => {
                const removed = prev.find(p => p.code === productCode);
                if (removed) setTotalPrice(t => t - removed.price * (removed.quantity || 1));
                const updated = prev.filter(p => p.code !== productCode);
                if (updated.length === 0 && props.setUserDetails) {
                    props.setUserDetails(u => ({ ...u, isCartItemsAvailable: false }));
                }
                return updated;
            });
        } catch (err) {
            alert('Failed to remove item: ' + err.message);
        }
    }

    function goToProductPage() {
        navigate('/');
    }

    function changeAddress() {
        setShowDeliveryAddress(true);
    }

    function loadRazorpayScript() {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    async function placeOrder() {
        if (!deliveryAddress) {
            alert("Please provide a delivery address before placing the order.");
            return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
            alert("Failed to load payment gateway. Please try again.");
            return;
        }

        try {
            // Step 1: Create Razorpay order on the server
            const createResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders/create-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    products: products.map(product => ({
                        productId: product.code,
                        quantity: product.quantity || 1
                    }))
                })
            });

            if (!createResponse.ok) {
                const text = await createResponse.text();
                throw new Error(text);
            }

            const { orderId, amount, currency, razor_key_id } = await createResponse.json();
            debugger;

            // Step 2: Open Razorpay checkout; handler is called after user pays
            const options = {
                key: razor_key_id,
                amount,
                currency,
                order_id: orderId,
                prefill: { email: props.userDetails.email },
                handler: async function(response) {
                    // Step 3: Verify signature and place order
                    try {
                        const placeResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders/place`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: props.userDetails.userId,
                                usermail: props.userDetails.email,
                                products: products.map(product => ({
                                    productId: product.code,
                                    quantity: product.quantity || 1,
                                    price: product.price * (product.quantity || 1),
                                    name: product.name
                                })),
                                deliveryAddress,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (!placeResponse.ok) {
                            const text = await placeResponse.text();
                            throw new Error(text);
                        }

                        alert("Order placed successfully!");
                        navigate('/');
                    } catch (error) {
                        console.error("Error placing order:", error);
                        alert("Payment succeeded but order saving failed. Please contact support.");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Error initiating payment:", error);
            alert("Failed to initiate payment. Please try again.");
        }
    }

    // const products = [
    //     { id: 1, name: 'Product 1', price: 100, description: 'This is product 1', img_src: product1Image, dimensions: { width: 50, height: 50 } },
    //     { id: 2, name: 'Product 2', price: 200, description: 'This is product 2', img_src: groundNutOilImage, dimensions: { width: 50, height: 50 } },
    //     { id: 3, name: 'Product 3', price: 300, description: 'This is product 3', img_src: coconutOilImage, dimensions: { width: 50, height: 50 } }
    // ];
    return (
        <>
        <p className="backtoProductPage" onClick={goToProductPage}>&#8592; Back to Shop</p>
        <div className="buyNowContainer">
            <span className="buyNowContent">
                <span className="buyNowLeftContainer">
                    <span>
                        <h3>Products Added to Place Order</h3>
                    </span>
                    {products.map(product => (
                        <BuyNowProductList key={product.id} products={[product]} setTotalPrice={setTotalPrice} updateProductQuantity={updateProductQuantity} onRemove={removeFromCart} />
                    ))}
                </span>
                <span className="buyNowRightContainer">
                    <h2>Invoice and Address Details</h2>
                    <span className="invoiceDetails">
                        <span>
                            <h4>Invoice Details</h4>
                            <p>Total Amount: ₹{totalPrice}</p>
                        </span>
                        <span>
                            <span className="addressSection">
                                <h4>Address Details</h4>
                                <p className="changeAddress" onClick={changeAddress}>Change Address</p>
                            </span>
                            <p>Address: {deliveryAddress ? `${deliveryAddress.dno}, ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.zip}, ${deliveryAddress.country}` : 'N/A'}</p>
                            <p>Phone: {deliveryAddress && deliveryAddress.contact ? deliveryAddress.contact : 'N/A'}</p>
                            <p>Email: {props.userDetails && props.userDetails.email ? props.userDetails.email : 'N/A'}</p>
                        </span>
                    </span>
                </span>
            </span>
            <span>
                <button className="placeOrderButton" onClick={placeOrder}>Place Order</button>
            </span>
        </div>
        {showDeliveryAddress && <DeliveryAddress userDetails={props.userDetails} deliveryAddress={deliveryAddress} setDeliveryAddress={setDeliveryAddress} setShowDeliveryAddress={setShowDeliveryAddress} setUserDetails={props.setUserDetails} />}
        </>
    );
}
