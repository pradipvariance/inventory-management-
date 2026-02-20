import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Status updated to ${status}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24 bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-600" />
            </div>
        );
    }

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'INVENTORY_MANAGER';

    const getStatusIcon = (status) => {
        switch (status) {
            case 'DELIVERED': return <CheckCircle size={18} strokeWidth={2} />;
            case 'SHIPPED': return <Truck size={18} strokeWidth={2} />;
            case 'CANCELLED': return <XCircle size={18} strokeWidth={2} />;
            default: return <Clock size={18} strokeWidth={2} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'SHIPPED': return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const statusSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    if (orders.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 animate-fade-in bg-gradient-to-b from-violet-50/50 to-white">
                <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
                    <Package size={40} className="text-violet-500" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
                <p className="text-slate-500 text-sm text-center max-w-sm mb-8">
                    Orders you place will appear here.
                </p>
                <button
                    onClick={() => navigate('/shop')}
                    className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-500/25"
                >
                    <ShoppingBag size={18} strokeWidth={2} />
                    Go to Shop
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-indigo-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your orders</h1>
                    <p className="text-sm text-indigo-600 mt-0.5">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
                </div>
                <div className="text-sm text-slate-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                    Total: <span className="font-semibold text-indigo-700">{orders.length}</span>
                </div>
            </div>

            <div className="space-y-6">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
                    >
                        {/* Order header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</p>
                                    <p className="text-sm font-mono font-medium text-slate-900">{order.id.slice(0, 8)}…</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</p>
                                    <p className="text-sm text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                                    <p className="text-sm font-semibold text-indigo-600">${order.totalAmount}</p>
                                </div>
                                {isAdmin && order.customer && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</p>
                                        <p className="text-sm text-slate-900">{order.customer.name}</p>
                                    </div>
                                )}
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusClass(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {order.status}
                            </span>
                        </div>

                        {/* Order body */}
                        <div className="p-6">
                            {order.status !== 'CANCELLED' && (
                                <div className="mb-6 hidden sm:block w-full max-w-xl mx-auto">
                                    <div className="relative flex justify-between">
                                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-indigo-100 rounded-full" />
                                        <div
                                            className="absolute top-4 left-0 h-0.5 bg-indigo-500 rounded-full transition-all duration-300"
                                            style={{ width: `${(Math.max(0, statusSteps.indexOf(order.status)) / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                        {statusSteps.map((step, i) => {
                                            const isActive = statusSteps.indexOf(order.status) >= i;
                                            return (
                                                <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                        {i + 1}
                                                    </div>
                                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {step}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Package size={18} className="text-indigo-500" strokeWidth={2} />
                                Items
                            </h4>
                            <ul className="space-y-3">
                                {order.orderItems.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors -mx-3"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                {item.product?.image ? (
                                                    <img src={`/${item.product.image}`} alt={item.product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package size={18} className="text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{item.product?.name}</p>
                                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-slate-900 shrink-0 ml-4">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </li>
                                ))}
                            </ul>

                            {isAdmin && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <div className="mt-6 pt-5 border-t border-indigo-100 flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600 mr-1">Update status:</span>
                                    <button onClick={() => updateStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 text-xs font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">Processing</button>
                                    <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="px-3 py-1.5 text-xs font-semibold border border-sky-200 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors">Shipped</button>
                                    <button onClick={() => updateStatus(order.id, 'DELIVERED')} className="px-3 py-1.5 text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">Delivered</button>
                                    <span className="w-px h-4 bg-slate-200 mx-1" />
                                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-3 py-1.5 text-xs font-semibold border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
