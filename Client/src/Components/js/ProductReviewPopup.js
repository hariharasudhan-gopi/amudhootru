import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import StarRatingInput from './StarRatingInput';
import '../css/ProductReviewPopup.css';

export default function ProductReviewPopup(props) {
  const [ratings, setRatings] = useState(() => {
    const initial = {};
    props.products.forEach((product) => {
      initial[product.productcode] = { rating: product.rating || 0, reviewtext: product.reviewtext || '' };
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  function setRating(code, rating) {
    setRatings((prev) => ({ ...prev, [code]: { ...prev[code], rating } }));
  }

  function setReviewText(code, reviewtext) {
    setRatings((prev) => ({ ...prev, [code]: { ...prev[code], reviewtext } }));
  }

  async function handleSubmit() {
    const reviews = props.products
      .map((product) => ({ productcode: product.productcode, ...ratings[product.productcode] }))
      .filter((review) => review.rating > 0);

    if (reviews.length === 0) {
      setError('Please rate at least one product before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await props.onSubmit(reviews);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="reviewPopupOverlay">
      <div className="reviewPopupCard">
        <button className="reviewPopupClose" onClick={props.onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
        <h2 className="reviewPopupTitle">How was your last order?</h2>
        <p className="reviewPopupSubtitle">Rate the products you received. Your feedback helps other shoppers.</p>

        <div className="reviewPopupProducts">
          {props.products.map((product) => (
            <div key={product.productcode} className="reviewPopupProductRow">
              {product.img_src && <img src={product.img_src} alt={product.productname} className="reviewPopupProductImage" />}
              <div className="reviewPopupProductDetails">
                <p className="reviewPopupProductName">{product.productname}</p>
                <StarRatingInput
                  value={ratings[product.productcode]?.rating || 0}
                  onChange={(rating) => setRating(product.productcode, rating)}
                />
                <textarea
                  className="reviewPopupTextarea"
                  placeholder="Share your experience (optional)"
                  value={ratings[product.productcode]?.reviewtext || ''}
                  onChange={(e) => setReviewText(product.productcode, e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="reviewPopupError">{error}</p>}

        <div className="reviewPopupActions">
          <button className="reviewPopupSkipBtn" onClick={props.onClose} disabled={submitting}>Maybe Later</button>
          <button className="reviewPopupSubmitBtn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
