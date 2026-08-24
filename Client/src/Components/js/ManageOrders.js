import '../css/ManageOrders.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = [
    { value: 0, label: 'Order Placed' },
    { value: 1, label: 'Order Shipped' },
    { value: 2, label: 'Out for Delivery' },
    { value: 3, label: 'Delivered' },
];

const STATUS_COLORS = { 0: '#b07d12', 1: '#185e87', 2: '#8e44ad', 3: '#1a7a4a' };

export default function ManageOrders(props) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
    const [updateMsg, setUpdateMsg] = useState({});

    useEffect(() => {
        fetchOrders({ status: '', dateFrom: '', dateTo: '' });
    }, []);

    async function fetchOrders(filterParams) {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterParams.status !== '') params.append('status', filterParams.status);
            if (filterParams.dateFrom) params.append('dateFrom', filterParams.dateFrom);
            if (filterParams.dateTo) params.append('dateTo', filterParams.dateTo);

            const res = await fetch(`http://localhost:8080/orders/all?${params.toString()}`);
            if (!res.ok) throw new Error(await res.text());
            setOrders(await res.json());
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        const empty = { status: '', dateFrom: '', dateTo: '' };
        setFilters(empty);
        fetchOrders(empty);
    }

    async function updateStatus(invoiceid, newStatus) {
        try {
            const res = await fetch('http://localhost:8080/orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceid, status: Number(newStatus) })
            });
            if (!res.ok) throw new Error(await res.text());
            setOrders(prev => prev.map(o => o.invoiceid === invoiceid ? { ...o, deliverystatus: Number(newStatus) } : o));
            setUpdateMsg(prev => ({ ...prev, [invoiceid]: 'Updated!' }));
            setTimeout(() => setUpdateMsg(prev => { const n = { ...prev }; delete n[invoiceid]; return n; }), 2000);
        } catch (err) {
            setUpdateMsg(prev => ({ ...prev, [invoiceid]: 'Failed: ' + err.message }));
        }
    }

    return (
        <div className="manageOrdersPage">
            <p className="backtoProductPage" onClick={() => navigate('/')}>&#8592; Back to Shop</p>
            <div className="manageOrdersWrapper">
                <h1 className="manageOrdersTitle">Manage Orders</h1>

                <div className="ordersFilterBar">
                    <label className="filterLabel">
                        Status
                        <select className="filterSelect" value={filters.status}
                            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                            <option value="">All</option>
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </label>
                    <label className="filterLabel">
                        From
                        <input type="date" className="filterInput" value={filters.dateFrom}
                            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                    </label>
                    <label className="filterLabel">
                        To
                        <input type="date" className="filterInput" value={filters.dateTo}
                            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                    </label>
                    <button className="filterApplyBtn" onClick={() => fetchOrders(filters)}>Apply</button>
                    <button className="filterResetBtn" onClick={handleReset}>Reset</button>
                </div>

                {loading ? (
                    <p className="loadingText">Loading orders...</p>
                ) : (
                    <table className="ordersTable">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Delivery Address</th>
                                <th>Products</th>
                                <th>Current Status</th>
                                <th>Update Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr><td colSpan={7} className="noOrdersCell">No orders found.</td></tr>
                            ) : orders.map(order => (
                                <tr key={order.invoiceid}>
                                    <td className="orderIdCell">{order.invoiceid}</td>
                                    <td>
                                        <span className="custName">{order.username}</span>
                                        <br />
                                        <span className="custEmail">{order.useremail}</span>
                                    </td>
                                    <td className="orderDateCell">
                                        {new Date(order.dateoforder).toLocaleDateString()}
                                    </td>
                                    <td className="deliveryAddressCell">{order.deliveryaddress || '—'}</td>
                                    <td>
                                        <ul className="manageProductList">
                                            {(order.products || []).map(p => (
                                                <li key={p.productcode}>{p.productname} × {p.quantity}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>
                                        <span className="statusBadge"
                                            style={{ backgroundColor: STATUS_COLORS[order.deliverystatus] ?? '#555' }}>
                                            {STATUS_OPTIONS.find(s => s.value === order.deliverystatus)?.label ?? order.deliverystatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="statusUpdateCell">
                                            <select className="statusSelect"
                                                value={order.deliverystatus}
                                                onChange={e => updateStatus(order.invoiceid, e.target.value)}>
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                            {updateMsg[order.invoiceid] && (
                                                <span className={`updateMsg${updateMsg[order.invoiceid].startsWith('Failed') ? ' updateMsgError' : ''}`}>
                                                    {updateMsg[order.invoiceid]}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
