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
            toast.error("Failed to load orders");
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
            toast.success(`Order status updated to ${status}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'INVENTORY_MANAGER';

    const getStatusIcon = (status) => {
        switch (status) {
            case 'DELIVERED': return <CheckCircle size={18} />;
            case 'SHIPPED': return <Truck size={18} />;
            case 'CANCELLED': return <XCircle size={18} />;
            default: return <Clock size={18} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
            case 'SHIPPED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const statusSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="bg-indigo-50 p-6 rounded-full mb-4">
                    <Package size={48} className="text-indigo-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
                <p className="text-gray-500 mb-8">You haven't placed any orders yet. Start shopping to fill this page!</p>
                <button
                    onClick={() => navigate('/shop')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <ShoppingBag size={20} /> Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900">Your Orders</h1>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-500 text-sm font-medium">
                    Total Orders: <span className="text-indigo-600 font-bold">{orders.length}</span>
                </div>
            </div>

            <div className="grid gap-6">
                {orders.map((order, index) => (
                    <div
                        key={order.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Order Header */}
                        <div className="bg-gray-50/50 p-6 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Order #</p>
                                    <p className="text-sm font-bold text-gray-900 font-mono">{order.id.slice(0, 8)}...</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Date Placed</p>
                                    <p className="text-sm font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Total</p>
                                    <p className="text-sm font-bold text-indigo-600">${order.totalAmount}</p>
                                </div>
                                {isAdmin && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Customer</p>
                                        <p className="text-sm font-medium text-gray-900">{order.customer?.name || 'Unknown'}</p>
                                    </div>
                                )}
                            </div>

                            <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusClass(order.status)}`}>
                                {getStatusIcon(order.status)} {order.status}
                            </span>
                        </div>

                        {/* Order Body */}
                        <div className="p-6">
                            {/* Visual Status Timeline (Simplified) */}
                            {order.status !== 'CANCELLED' && (
                                <div className="mb-8 hidden sm:flex items-center justify-between w-full max-w-2xl mx-auto relative px-4">
                                    {/* Line connecting steps */}
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 -translate-y-1/2 rounded-full"></div>
                                    <div
                                        className="absolute top-1/2 left-0 h-1 bg-indigo-500 -z-0 -translate-y-1/2 rounded-full transition-all duration-500"
                                        style={{ width: `${(Math.max(0, statusSteps.indexOf(order.status)) / (statusSteps.length - 1)) * 100}%` }}
                                    ></div>

                                    {statusSteps.map((step, i) => {
                                        const isActive = statusSteps.indexOf(order.status) >= i;
                                        return (
                                            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 text-gray-300'}`}>
                                                    {i + 1}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-gray-300'}`}>{step}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Package size={20} className="text-gray-400" /> Items in Order
                            </h4>
                            <div className="space-y-4">
                                {order.orderItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center py-2 hover:bg-gray-50 px-3 rounded-xl transition-colors -mx-3 border border-transparent hover:border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                                                {item.product.image ? (
                                                    <img src={`/${item.product.image}`} alt={item.product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package size={20} className="text-gray-300" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{item.product.name}</p>
                                                <p className="text-sm text-gray-500">Qty: <span className="font-medium text-gray-900">{item.quantity}</span></p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {isAdmin && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3 flex-wrap bg-gray-50/50 p-4 rounded-xl">
                                    <span className="text-sm font-bold text-gray-500 mr-2">Update Order Status:</span>
                                    <button onClick={() => updateStatus(order.id, 'PROCESSING')} className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">Processing</button>
                                    <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="px-4 py-2 text-xs font-bold border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all shadow-sm">Shipped</button>
                                    <button onClick={() => updateStatus(order.id, 'DELIVERED')} className="px-4 py-2 text-xs font-bold border border-green-200 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-all shadow-sm">Delivered</button>
                                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-4 py-2 text-xs font-bold border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-all shadow-sm">Cancel Order</button>
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
