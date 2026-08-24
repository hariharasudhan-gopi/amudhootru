export default function Product(props) {
  function addToCart() {
    var productCode = props.code;
    var productName = props.name;
    var userId = props.userDetails && props.userDetails.userId; // Assuming you have a user ID to associate with the cart item

    if (!userId) {
      console.error('User ID is not available. Cannot add to cart.');
      return;
    }

    try {
      const response = fetch(
        `http://localhost:8080/products/addtocart`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productCode, productName, userId })
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
        // mark cart as having items so the header cart icon navigates correctly
        if (props.setUserDetails) {
          props.setUserDetails(prev => ({ ...prev, isCartItemsAvailable: true }));
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
      <p>Price: ₹{props.price}</p>
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