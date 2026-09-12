import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Product(props) {
  const navigate = useNavigate();
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  function addToCart() {
    if (!props.isLoggedIn) {
      navigate('/login');
      return;
    }

    var productCode = props.code;
    var productName = props.name;

    try {
      const response = fetch(
        `${process.env.REACT_APP_API_URL}/products/addtocart`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ productCode, productName })
        }
      );

      response.then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }

        return res.json();
      })
      .then((data) => {
        if (props.setUserDetails) {
          props.setUserDetails(prev => ({ ...prev, isCartItemsAvailable: true }));
        }
        if (props.setCartToast) {
          props.setCartToast(props.name);
        }
        if (props.onAddedToCart) {
          props.onAddedToCart(props.code);
        }
      })
      .catch((error) => {
        console.error('Error adding product to cart:', error);
      });
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }

  function goToCart() {
    navigate('/buynow');
  }

  async function notifyMe() {
    if (!props.isLoggedIn) {
      navigate('/login');
      return;
    }

    setNotifyError('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/products/notifyme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productCode: props.code })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      setNotifyRequested(true);
    } catch (error) {
      console.error('Error requesting stock notification:', error);
      setNotifyError('Something went wrong. Please try again.');
    }
  }

  const availableQty = Number(props.availablequantity || 0);
  const lowStockThreshold = Number(props.lowstockthreshold ?? 5);
  const unavailable = availableQty <= 0;
  const isLimitedStock = !unavailable && availableQty <= lowStockThreshold;
  const unitLabel = props.unit || 'kg';
  const organicTag = props.description?.toLowerCase().includes('organic') ? 'Organic-certified' : 'Farm fresh produce';
  const productRating = 4.6;
  const reviewsCount = 1204;
  const basePrice = Number(props.price || 0);
  const hasOffer = props.offerprice !== undefined && props.offerprice !== null && props.offerprice !== ''
    && Number(props.offerprice) > 0 && Number(props.offerprice) < basePrice;
  const displayPrice = hasOffer ? Number(props.offerprice) : basePrice;
  const discountPercent = hasOffer ? Math.max(1, Math.round(((basePrice - Number(props.offerprice)) / basePrice) * 100)) : 0;

  return (
    <span className={`product_container product_${props.id}${unavailable ? ' product_unavailable' : ''}`}>
      <div className="product_visualArea">
        <div className="product_pill organicPill">100% Organic</div>
        <div className="product_pill stockPill">
          <span className={`stockDot${isLimitedStock ? ' stockDot_limited' : ''}${unavailable ? ' stockDot_out' : ''}`} aria-hidden="true"></span>
          {unavailable ? 'Out of stock' : isLimitedStock ? 'Limited stock' : 'In stock'}
        </div>
        {props.img_src && <img src={props.img_src} alt={props.name} className="product_image" width={props.dimensions?.width ?? 200} height={props.dimensions?.height ?? 200} />}
      </div>

      <div className="product_detailsArea">
        <h2 className="product_title">{props.name}{props.userDetails?.isAdminUser && <span className="productCodeBadge"> ({props.code})</span>}</h2>
        <p className="product_description">{props.description}</p>

        <p className="product_ratingRow" aria-label={`Rated ${productRating} out of 5`}>
          <span className="stars">★★★★☆</span>
          <span className="ratingText">{productRating} • {reviewsCount.toLocaleString()} ratings</span>
        </p>

        <div className="product_divider" aria-hidden="true"></div>

        <div className="priceAndOfferRow">
          <p className="product_price">
            <span className="priceNow">₹{displayPrice}</span>
            <span className="priceUnit"> / {unitLabel}</span>
            {hasOffer && <span className="priceOld">₹{basePrice}</span>}
          </p>
          {hasOffer && <span className="saveBadge">Save {discountPercent}%</span>}
        </div>

        <div className="product_metaInfo">
          <p><i className="fa-solid fa-truck-fast"></i> Delivery by <strong>Tomorrow</strong></p>
          <p><i className="fa-regular fa-shield"></i> {organicTag}</p>
          {isLimitedStock && <p className="stockWarning"><i className="fa-regular fa-square"></i> Limited stock, order soon!</p>}
          {unavailable && <p className="unavailableText"><i className="fa-solid fa-circle-xmark"></i> Temporarily Unavailable</p>}
        </div>

        <span className="product_actions">
          {unavailable ? (
            <button className={`addToCartButton notifyMeButton${notifyRequested ? ' notifyMeButton_done' : ''}`} onClick={notifyMe} disabled={notifyRequested}>
              <i className={`fa-${notifyRequested ? 'solid fa-circle-check' : 'regular fa-bell'}`}></i>
              {notifyRequested ? ' We\'ll notify you' : ' Notify Me'}
            </button>
          ) : (
            <button className={`addToCartButton${props.isInCart ? ' addToCartButton_inCart' : ''}`} onClick={props.isInCart ? goToCart : addToCart}>
              {props.isInCart ? (<><i className="fa-solid fa-cart-shopping"></i> In Cart</>) : 'Add to Cart'}
            </button>
          )}
          {notifyError && <span className="notifyMeError">{notifyError}</span>}
        </span>
        {props.count !== undefined && <p className="product_countText">count : {props.count}</p>}
      </div>
    </span>
  );
}
