import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import StarRatingInput from './StarRatingInput';
import '../css/ProductReviewsListPopup.css';

export default function ProductReviewsListPopup(props) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/reviews/product/${props.productcode}`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }
        const data = await res.json();
        if (!cancelled) setReviews(data.reviews || []);
      } catch (err) {
        console.error('Error fetching product reviews:', err);
        if (!cancelled) setError('Failed to load reviews. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReviews();
    return () => { cancelled = true; };
  }, [props.productcode]);

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  return createPortal(
    <div className="reviewsListPopupOverlay" onClick={props.onClose}>
      <div className="reviewsListPopupCard" onClick={(e) => e.stopPropagation()}>
        <button className="reviewsListPopupClose" onClick={props.onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
        <h2 className="reviewsListPopupTitle">Customer Reviews</h2>
        <p className="reviewsListPopupSubtitle">{props.productname}</p>

        {loading && <p className="reviewsListPopupStatus">Loading reviews...</p>}
        {!loading && error && <p className="reviewsListPopupStatus reviewsListPopupError">{error}</p>}
        {!loading && !error && reviews.length === 0 && (
          <p className="reviewsListPopupStatus">No reviews yet. Be the first to share your experience!</p>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="reviewsListPopupItems">
            {reviews.map((review, index) => (
              <div key={index} className="reviewsListPopupItem">
                <div className="reviewsListPopupItemHeader">
                  <span className="reviewsListPopupReviewer">{review.reviewername || 'Anonymous'}</span>
                  <span className="reviewsListPopupDate">{formatDate(review.createdat)}</span>
                </div>
                <StarRatingInput value={review.rating} readOnly />
                {review.reviewtext && <p className="reviewsListPopupText">{review.reviewtext}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
