import '../css/Accounts.css';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import StarRatingInput from './StarRatingInput';

const STATUS_LABELS = { 0: 'Order Placed', 1: 'Order Shipped', 2: 'Out for Delivery', 3: 'Delivered' };

function formatAddress(address) {
    if (!address) return '—';
    if (typeof address === 'string') return address;
    const { dno, street, city, zip, state, country } = address;
    return [dno, street, city, zip, state, country].filter(Boolean).join(', ') || '—';
}

export default function Accounts() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userDetail, setUserDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [togglingPrivilege, setTogglingPrivilege] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/users`, { credentials: 'include' });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load customers.');
        } finally {
            setLoading(false);
        }
    }

    async function openUserDetail(userId) {
        setSelectedUserId(userId);
        setUserDetail(null);
        setDetailError('');
        setDetailLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, { credentials: 'include' });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setUserDetail(data);
        } catch (err) {
            console.error('Error fetching user detail:', err);
            setDetailError('Failed to load customer details.');
        } finally {
            setDetailLoading(false);
        }
    }

    function closeUserDetail() {
        setSelectedUserId(null);
        setUserDetail(null);
        setDetailError('');
    }

    async function togglePrivilege() {
        if (!userDetail) return;
        const nextValue = !userDetail.user.isprivilege;
        setTogglingPrivilege(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${selectedUserId}/privilege`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isPrivilege: nextValue })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setUserDetail(prev => ({ ...prev, user: { ...prev.user, isprivilege: data.isprivilege } }));
            setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, isprivilege: data.isprivilege } : u));
        } catch (err) {
            console.error('Error updating privilege status:', err);
            alert('Failed to update privilege status. Please try again.');
        } finally {
            setTogglingPrivilege(false);
        }
    }

    return (
        <div className="accountsPage">
            <p className="backtoProductPage" onClick={() => navigate('/')}>&#8592; Back to Shop</p>
            <div className="accountsWrapper">
                <h1 className="accountsTitle">Customer Accounts</h1>

                {loading ? (
                    <p className="loadingText">Loading customers...</p>
                ) : error ? (
                    <p className="accountsError">{error}</p>
                ) : (
                    <table className="accountsTable">
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Privilege</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={5} className="noAccountsCell">No customers found.</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="accountsRow" onClick={() => openUserDetail(user.id)}>
                                    <td className="accountsNameCell">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '—'}</td>
                                    <td className="accountsAddressCell">{formatAddress(user.address)}</td>
                                    <td>
                                        {user.isprivilege
                                            ? <span className="privilegeBadge">Privilege</span>
                                            : <span className="privilegeBadgeMuted">Regular</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedUserId && createPortal(
                <div className="accountDetailOverlay" onClick={closeUserDetail}>
                    <div className="accountDetailCard" onClick={(e) => e.stopPropagation()}>
                        <button className="accountDetailClose" onClick={closeUserDetail} title="Close">
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        {detailLoading && <p className="loadingText">Loading customer details...</p>}
                        {!detailLoading && detailError && <p className="accountsError">{detailError}</p>}

                        {!detailLoading && !detailError && userDetail && (
                            <>
                                <div className="accountDetailHeader">
                                    <div>
                                        <h2 className="accountDetailName">{userDetail.user.name}</h2>
                                        <p className="accountDetailMeta"><i className="fa-regular fa-envelope"></i> {userDetail.user.email}</p>
                                        <p className="accountDetailMeta"><i className="fa-solid fa-phone"></i> {userDetail.user.phone || '—'}</p>
                                        <p className="accountDetailMeta"><i className="fa-solid fa-location-dot"></i> {formatAddress(userDetail.user.address)}</p>
                                    </div>
                                    <button
                                        className={`privilegeToggleBtn${userDetail.user.isprivilege ? ' privilegeToggleBtn_active' : ''}`}
                                        onClick={togglePrivilege}
                                        disabled={togglingPrivilege}
                                    >
                                        <i className={`fa-solid ${userDetail.user.isprivilege ? 'fa-star' : 'fa-star-half-stroke'}`}></i>
                                        {userDetail.user.isprivilege ? ' Unmark Privilege Customer' : ' Mark as Privilege Customer'}
                                    </button>
                                </div>

                                <h3 className="accountDetailOrdersTitle">Order History (last {userDetail.orders.length})</h3>
                                {userDetail.orders.length === 0 ? (
                                    <p className="noAccountsCell">No past orders yet.</p>
                                ) : (
                                    <div className="accountOrdersList">
                                        {userDetail.orders.map(order => (
                                            <div key={order.invoiceid} className="accountOrderCard">
                                                <div className="accountOrderHeader">
                                                    <span className="accountOrderInvoice">{order.invoiceid}</span>
                                                    <span className="accountOrderDate">{new Date(order.dateoforder).toLocaleDateString()}</span>
                                                    <span className="accountOrderStatus">{STATUS_LABELS[order.deliverystatus] ?? order.deliverystatus}</span>
                                                </div>
                                                <ul className="accountOrderProducts">
                                                    {order.products.map(p => (
                                                        <li key={p.productcode} className="accountOrderProductItem">
                                                            <span className="accountOrderProductName">{p.productname} × {p.quantity}{p.unit ? ` ${p.unit}` : ''}</span>
                                                            {p.rating ? (
                                                                <span className="accountOrderProductReview">
                                                                    <StarRatingInput value={p.rating} readOnly />
                                                                    {p.reviewtext && <span className="accountOrderReviewText">"{p.reviewtext}"</span>}
                                                                </span>
                                                            ) : (
                                                                <span className="accountOrderNoReview">No review yet</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
