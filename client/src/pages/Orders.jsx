import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
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
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'SHIPPED': return 'bg-blue-100 text-blue-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <Package size={48} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
                <p className="text-gray-500 mb-8">You haven't placed any orders yet. Start shopping to fill this page!</p>
                <button
                    onClick={() => navigate('/shop')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    <ShoppingBag size={20} /> Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Your Orders</h1>
                <div className="text-gray-500">
                    Total Orders: <span className="font-semibold text-gray-800">{orders.length}</span>
                </div>
            </div>

            <div className="space-y-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 p-6 flex flex-wrap justify-between items-center gap-4 border-b border-gray-200">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Order Placed</p>
                                    <p className="text-sm font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
                                    <p className="text-sm font-medium text-gray-900">${order.totalAmount}</p>
                                </div>
                                {isAdmin && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Customer</p>
                                        <p className="text-sm font-medium text-gray-900">{order.customer?.name || 'Unknown'}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Order # {order.id.slice(0, 8)}</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusClass(order.status)}`}>
                                    {getStatusIcon(order.status)} {order.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Package size={18} className="text-gray-400" /> Order Items
                            </h4>
                            <div className="space-y-3">
                                {order.orderItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg -mx-2">
                                        <div className="flex items-center gap-4">
                                            {item.product.image ? (
                                                <img src={`/${item.product.image}`} alt={item.product.name} className="h-12 w-12 object-cover rounded-md border border-gray-200" />
                                            ) : (
                                                <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                                                    <Package size={20} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {isAdmin && (
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                    <span className="text-sm font-medium text-gray-500">Update Status:</span>
                                    <button onClick={() => updateStatus(order.id, 'PROCESSING')} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Processing</button>
                                    <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">Shipped</button>
                                    <button onClick={() => updateStatus(order.id, 'DELIVERED')} className="px-3 py-1.5 text-xs font-medium border border-green-200 text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors">Delivered</button>
                                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Cancel</button>
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
