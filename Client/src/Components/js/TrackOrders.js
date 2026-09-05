import "../css/TrackOrders.css";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

export function TrackOrders(props) {
    const [orders, setOrders] = useState([]);

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

    const navigate = useNavigate();

    function goToProductPage() {
        navigate('/');
    }

  return (
    <>
    <p className="backtoProductPage" onClick={goToProductPage}>&#8592; Back to Shop</p>
    <div className="trackOrdersWrapper">
      <h1 className="trackOrdersTitle">My Orders</h1>
        <table className="ordersTable">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date of Order</th>
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
                <td>
                    <table className="productsInnerTable">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.products.map(p => (
                                <tr key={p.productcode}>
                                    <td>{p.productname}</td>
                                    <td>{p.quantity}{p.unit ? ' ' + p.unit : ''}</td>
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
