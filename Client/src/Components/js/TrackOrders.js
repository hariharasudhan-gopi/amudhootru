import "../css/TrackOrders.css";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRatingInput from './StarRatingInput';
import ProductReviewPopup from './ProductReviewPopup';

const STATUS_CONFIG = {
    delivered:  { label: 'Delivered',   color: '#1a7a4a' },
    shipped:    { label: 'Shipped',     color: '#185e87' },
    processing: { label: 'Processing',  color: '#b07d12' },
    cancelled:  { label: 'Cancelled',   color: '#c0392b' },
};

function StatusBadge({ status }) {
    const key = (status || '').toLowerCase();
    const cfg = STATUS_CONFIG[key] || { label: status, color: '#555' };
    return (
        <span className="statusBadge" style={{ backgroundColor: cfg.color }}>
            {cfg.label}
        </span>
    );
}

function PaymentStatusBadge({ status }) {
    const key = (status || '').toLowerCase();
    let className = 'paymentBadge';
    if (key.includes('pending')) className += ' paymentPending';
    if (key.includes('paid')) className += ' paymentPaid';

    return <span className={className}>{status || 'Pending'}</span>;
}

function ReviewCell({ invoiceid, productcode, review, onSaved }) {
    const [editing, setEditing] = useState(!review);
    const [rating, setRating] = useState(review?.rating || 0);
    const [reviewtext, setReviewtext] = useState(review?.reviewtext || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function save() {
        if (!rating) {
            setError('Please select a rating.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/reviews/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ invoiceid, reviews: [{ productcode, rating, reviewtext }] })
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }
            onSaved({ rating, reviewtext });
            setEditing(false);
        } catch (err) {
            setError('Failed to save review. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (!editing) {
        return (
            <span className="reviewCell">
                <StarRatingInput value={rating} readOnly />
                {reviewtext && <p className="reviewCellText">{reviewtext}</p>}
                <button className="reviewCellEditBtn" onClick={() => setEditing(true)}>
                    <i className="fa-solid fa-pen"></i> Edit
                </button>
            </span>
        );
    }

    return (
        <span className="reviewCell reviewCell_editing">
            <StarRatingInput value={rating} onChange={setRating} />
            <textarea
                className="reviewCellTextarea"
                rows={2}
                placeholder="Write a review (optional)"
                value={reviewtext}
                onChange={(e) => setReviewtext(e.target.value)}
            />
            {error && <p className="reviewCellError">{error}</p>}
            <span className="reviewCellActions">
                <button className="reviewCellSaveBtn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                {review && (
                    <button
                        className="reviewCellCancelBtn"
                        onClick={() => {
                            setEditing(false);
                            setRating(review.rating || 0);
                            setReviewtext(review.reviewtext || '');
                            setError('');
                        }}
                    >
                        Cancel
                    </button>
                )}
            </span>
        </span>
    );
}

export function TrackOrders(props) {
    const [orders, setOrders] = useState([]);
    const [pendingReview, setPendingReview] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/orders/placed`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                    }
                );

                if (!response.ok) {
                    const msg = await response.text();
                    throw new Error(msg);
                }

                const data = await response.json();
                setOrders(data.sort((a, b) => new Date(b.dateoforder) - new Date(a.dateoforder)));
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        };
        fetchOrders();
    }, [props.userDetails.userId]);

    useEffect(() => {
        const fetchPendingReview = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/reviews/pending`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (!response.ok) return;

                const data = await response.json();
                if (data.pending) {
                    setPendingReview(data);
                }
            } catch (error) {
                console.error('Error fetching pending review:', error);
            }
        };
        fetchPendingReview();
    }, [props.userDetails.userId]);

    function updateOrderReview(invoiceid, productcode, review) {
        setOrders((prev) => prev.map((order) => {
            if (order.invoiceid !== invoiceid) return order;
            return {
                ...order,
                products: order.products.map((p) => (p.productcode === productcode ? { ...p, review } : p))
            };
        }));
    }

    async function submitPendingReviews(reviews) {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/reviews/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ invoiceid: pendingReview.invoiceid, reviews })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg);
        }

        reviews.forEach((review) => updateOrderReview(pendingReview.invoiceid, review.productcode, review));
        setPendingReview(null);
    }

    const navigate = useNavigate();

    function goToProductPage() {
        navigate('/');
    }

  return (
    <>
    <p className="backtoProductPage" onClick={goToProductPage}>&#8592; Back to Shop</p>
    {pendingReview && (
        <ProductReviewPopup
            products={pendingReview.products}
            onSubmit={submitPendingReviews}
            onClose={() => setPendingReview(null)}
        />
    )}
    <div className="trackOrdersWrapper">
      <h1 className="trackOrdersTitle">My Orders</h1>
        <table className="ordersTable">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date of Order</th>
                            <th>Payment Status</th>
              <th>Product</th>
              <th>Delivery Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="orderIdCell">{order.invoiceid}</td>
                <td className="orderDateCell">{new Date(order.dateoforder).toLocaleDateString()}</td>
                                <td><PaymentStatusBadge status={order.paymentstatus} /></td>
                <td>
                    <table className="productsInnerTable">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Quantity</th>
                                <th>Bill Amount</th>
                                <th>Your Review</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.products.map(p => (
                                <tr key={p.productcode}>
                                    <td>{p.productname}</td>
                                    <td>{p.quantity}{p.unit ? ' ' + p.unit : ''}</td>
                                    <td>₹{(Number(p.price) || 0) * (Number(p.quantity) || 1)}</td>
                                    <td>
                                        <ReviewCell
                                            invoiceid={order.invoiceid}
                                            productcode={p.productcode}
                                            review={p.review}
                                            onSaved={(review) => updateOrderReview(order.invoiceid, p.productcode, review)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </td>
                <td className="deliveryAddressCell">
                    {(() => {
                        try {
                            const a = typeof order.deliveryaddress === 'string'
                                ? JSON.parse(order.deliveryaddress)
                                : order.deliveryaddress;
                            if (!a) return '—';
                            return (
                                <span>
                                    {a.dno && a.street ? <>{a.dno}, {a.street}<br /></> : null}
                                    {a.city && a.zip ? <>{a.city}, {a.zip}<br /></> : null}
                                    {a.state && a.country ? <>{a.state}, {a.country}<br /></> : null}
                                    {a.contact ? <>{a.contact}</> : null}
                                </span>
                            );
                        } catch {
                            return order.deliveryaddress || '—';
                        }
                    })()}
                </td>
                <td><StatusBadge status={order.deliverystatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
    </>
  );
}
