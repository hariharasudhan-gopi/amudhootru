import { useNavigate } from 'react-router-dom';

export default function Product(props) {
  const navigate = useNavigate();

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
        console.log(data.message);
        if (props.setUserDetails) {
          props.setUserDetails(prev => ({ ...prev, isCartItemsAvailable: true }));
        }
        if (props.setCartToast) {
          props.setCartToast(props.name);
        }
      })
      .catch((error) => {
        console.error('Error adding product to cart:', error);
      });
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }
  const unavailable = !props.availablequantity || props.availablequantity <= 0;
  const unitLabel = props.unit || 'kg';
  const organicTag = props.description?.toLowerCase().includes('organic') ? 'Organic-certified' : 'Farm fresh produce';
  const productRating = 4.6;
  const reviewsCount = 1204;
  const oldPrice = Math.ceil(Number(props.price || 0) * 1.2);
  const discountPercent = oldPrice > 0 ? Math.max(1, Math.round(((oldPrice - Number(props.price || 0)) / oldPrice) * 100)) : 0;

  return (
    <span className={`product_container product_${props.id}${unavailable ? ' product_unavailable' : ''}`}>
      <div className="product_visualArea">
        <div className="product_pill organicPill">100% Organic</div>
        <div className="product_pill stockPill">
          <span className="stockDot" aria-hidden="true"></span>
          {unavailable ? 'Out of stock' : 'In stock'}
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
            <span className="priceNow">₹{props.price}</span>
            <span className="priceUnit"> / {unitLabel}</span>
            <span className="priceOld">₹{oldPrice}</span>
          </p>
          <span className="saveBadge">Save {discountPercent}%</span>
        </div>

        <div className="product_metaInfo">
          <p><i className="fa-solid fa-truck-fast"></i> Delivery by <strong>Tomorrow</strong></p>
          <p><i className="fa-regular fa-shield"></i> {organicTag}</p>
          {!unavailable && <p className="stockWarning"><i className="fa-regular fa-square"></i> Only {props.availablequantity} {unitLabel} left in stock</p>}
          {unavailable && <p className="unavailableText"><i className="fa-solid fa-circle-xmark"></i> Temporarily Unavailable</p>}
        </div>

        <span className="product_actions">
          <button className="addToCartButton" onClick={addToCart} disabled={unavailable}
            style={unavailable ? { opacity: 0.45, cursor: 'not-allowed' } : {}}>Add to Cart</button>
        </span>
        {props.count !== undefined && <p className="product_countText">count : {props.count}</p>}
      </div>
    </span>
  );
}
