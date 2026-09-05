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
  return (
    <span className={`product_container product_${props.id}${unavailable ? ' product_unavailable' : ''}`}>
      <h2>{props.name}{props.userDetails?.isAdminUser && <span className="productCodeBadge"> ({props.code})</span>}</h2>
      {props.img_src && <img src={props.img_src} alt={props.name} className="product_image" width={props.dimensions?.width ?? 200} height={props.dimensions?.height ?? 200} />}
      <p>Price: ₹{props.price}{props.unit ? '/' + props.unit : ''}</p>
      <p>{props.description}</p>
      {unavailable && <p className="unavailableText">Temporarily Unavailable</p>}
      <span className="product_actions">
        <button className="addToCartButton" onClick={addToCart} disabled={unavailable}
          style={unavailable ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>Add to Cart</button>
        {props.count !== undefined && <p>count : {props.count}</p>}
      </span>
    </span>
  );
}
