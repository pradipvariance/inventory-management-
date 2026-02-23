import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package, AlertTriangle, Layers, Plus, ArrowLeftRight, CheckCircle, Truck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Loader from '../components/Loader';

const Dashboard = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        orderCount: 0,
        productCount: 0,
        lowStockCount: 0,
        inventoryCount: 0
    });
    const [salesData, setSalesData] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [pendingTransfers, setPendingTransfers] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Open tab from notification redirect (bell icon → orders or transfers)
    useEffect(() => {
        const tab = location.state?.tab;
        if (tab === 'orders' && (user?.role === 'INVENTORY_MANAGER')) {
            setActiveTab('orders');
            navigate(location.pathname, { replace: true, state: {} });
        } else if (tab === 'transfers' && (user?.role === 'WAREHOUSE_ADMIN')) {
            setActiveTab('transfers');
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.tab, user?.role, navigate, location.pathname]);

    // Quick PO Modal State
    const [showQuickPOModal, setShowQuickPOModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [poForm, setPoForm] = useState({ supplierId: '', quantity: 1, unitCost: 0, deliveryDate: '' });
    const [creatingPO, setCreatingPO] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch basic stats
                try {
                    const [statsRes, salesRes, stockRes, supplierRes] = await Promise.all([
                        axios.get('http://localhost:5000/api/reports/stats', config),
                        axios.get('http://localhost:5000/api/reports/sales', config),
                        axios.get('http://localhost:5000/api/reports/low-stock', config),
                        axios.get('http://localhost:5000/api/suppliers', config).catch(() => ({ data: [] }))
                    ]);
                    setStats(prev => ({ ...prev, ...statsRes.data }));
                    setSalesData(salesRes.data || []);
                    setLowStock(stockRes.data || []);
                    setSuppliers(supplierRes.data || []);
                } catch (err) {
                    console.error("Failed to load core stats", err);
                }

                if (user?.role === 'WAREHOUSE_ADMIN' && user.warehouseId) {
                    try {
                        const [prodRes, invRes, transferRes] = await Promise.all([
                            axios.get('http://localhost:5000/api/products?limit=5', config),
                            axios.get(`http://localhost:5000/api/inventory?limit=5&warehouseId=${user.warehouseId}`, config),
                            axios.get('http://localhost:5000/api/transfers/pending-count', config)
                        ]);
                        setProducts(prodRes.data.products || []);
                        setInventory(invRes.data.inventory || []);
                        setPendingTransfers(transferRes.data.transfers || []);
                    } catch (err) {
                        console.error("Failed to load warehouse specific data", err);
                    }
                }

                if (user?.role === 'INVENTORY_MANAGER') {
                    const fetchOrders = async () => {
                        try {
                            const orderRes = await axios.get('http://localhost:5000/api/orders/pending-count', config);
                            setPendingOrders(orderRes.data.orders || []);
                        } catch (err) {
                            console.error("Failed to load pending orders", err);
                        }
                    };
                    fetchOrders();
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }

        if (socket && user?.role === 'INVENTORY_MANAGER') {
            const handleOrderUpdate = () => {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                axios.get('http://localhost:5000/api/orders/pending-count', config)
                    .then(res => setPendingOrders(res.data.orders || []))
                    .catch(err => console.error("Real-time order refresh failed", err));
            };

            socket.on('new_order', handleOrderUpdate);
            socket.on('order_updated', handleOrderUpdate);

            // Listen for Stock Transfers
            const handleTransferUpdate = () => {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                if (user?.role === 'WAREHOUSE_ADMIN') {
                    axios.get('http://localhost:5000/api/transfers/pending-count', config)
                        .then(res => setPendingTransfers(res.data.transfers || []))
                        .catch(err => console.error("Real-time transfer refresh failed", err));
                }
            };

            socket.on('new_transfer', handleTransferUpdate);
            socket.on('transfer_updated', handleTransferUpdate);

            return () => {
                socket.off('new_order', handleOrderUpdate);
                socket.off('order_updated', handleOrderUpdate);
                socket.off('new_transfer', handleTransferUpdate);
                socket.off('transfer_updated', handleTransferUpdate);
            };
        }
    }, [user, socket]);

    if (loading) return <Loader text="Loading Dashboard..." />;

    const handleOpenQuickPO = (item) => {
        setSelectedItem(item);
        setPoForm({
            supplierId: '',
            quantity: Math.max(1, (item.product?.minStockLevel || 0) - item.itemQuantity),
            unitCost: item.product?.amount || 0,
            deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days
        });
        setShowQuickPOModal(true);
    };

    const handleCreatePO = async (e) => {
        e.preventDefault();
        setCreatingPO(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post('http://localhost:5000/api/purchase-orders', {
                supplierId: poForm.supplierId,
                warehouseId: selectedItem.warehouseId,
                deliveryDate: poForm.deliveryDate,
                items: [{
                    productId: selectedItem.productId,
                    quantity: parseInt(poForm.quantity),
                    unitCost: parseFloat(poForm.unitCost)
                }]
            }, config);

            alert('Purchase Order created successfully!');
            setShowQuickPOModal(false);
        } catch (error) {
            console.error('Error creating PO:', error);
            alert(error.response?.data?.message || 'Error creating PO');
        } finally {
            setCreatingPO(false);
        }
    };

    const handleApproveTransfer = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/transfers/${id}/approve`, {}, config);
            alert('Transfer approved successfully!');
            // Refresh dashboard data
            window.location.reload();
        } catch (error) {
            console.error('Error approving transfer:', error);
            alert(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleRejectTransfer = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/transfers/${id}/reject`, {}, config);
            alert('Transfer rejected.');
            // Refresh dashboard data
            window.location.reload();
        } catch (error) {
            console.error('Error rejecting transfer:', error);
        }
    };

    const handleOrderStatusUpdate = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: newStatus }, config);

            // We don't need to manually refresh here because the socket will trigger it,
            // but we can update local state for immediate feedback
            setPendingOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

            if (newStatus === 'CANCELLED') alert('Order cancelled and stock restored.');
        } catch (error) {
            console.error('Error updating order status:', error);
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    // Fallback constants if stats are missing
    const safeStats = stats || { totalRevenue: 0, orderCount: 0, productCount: 0, lowStockCount: 0, inventoryCount: 0 };

    const statCards = [
        {
            title: 'Total Revenue',
            value: `$${(safeStats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            iconColor: 'text-white',
            show: true
        },
        {
            title: 'Total Orders',
            value: (safeStats.orderCount || 0).toLocaleString(),
            icon: ShoppingCart,
            gradient: 'from-blue-500 to-indigo-600',
            iconColor: 'text-white',
            show: true
        },
        {
            title: 'Products',
            value: safeStats.productCount || 0,
            icon: Package,
            gradient: 'from-violet-500 to-purple-600',
            iconColor: 'text-white',
            show: true
        },
        {
            title: 'Low Stock Items',
            value: safeStats.lowStockCount || 0,
            icon: AlertTriangle,
            gradient: 'from-pink-500 to-rose-600',
            iconColor: 'text-white',
            show: true
        },
        {
            title: 'Inventory Count',
            value: safeStats.inventoryCount || 0,
            icon: Layers,
            gradient: 'from-amber-400 to-orange-500',
            iconColor: 'text-white',
            show: user.role === 'WAREHOUSE_ADMIN'
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header strip - consistent with Customer pages */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="px-4 sm:px-6 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                            <p className="text-sm text-indigo-600 mt-0.5">Welcome back. Here’s what’s happening today.</p>
                        </div>

                        {(user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'INVENTORY_MANAGER') && (
                            <div className="flex bg-white/80 backdrop-blur-sm border border-indigo-100 p-1 rounded-xl w-fit shadow-sm">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'overview'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                >
                                    Overview
                                </button>
                                {user?.role === 'WAREHOUSE_ADMIN' && (
                                    <button
                                        onClick={() => setActiveTab('transfers')}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'transfers'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                    >
                                        Transfers
                                        {pendingTransfers.length > 0 && (
                                            <span className="bg-rose-500 text-white text-[10px] min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full">
                                                {pendingTransfers.length}
                                            </span>
                                        )}
                                    </button>
                                )}
                                {user?.role === 'INVENTORY_MANAGER' && (
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'orders'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                    >
                                        Orders
                                        {pendingOrders.length > 0 && (
                                            <span className="bg-indigo-500 text-white text-[10px] min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full">
                                                {pendingOrders.length}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">

                {/* Tab: Overview */}
                {((user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'INVENTORY_MANAGER') || activeTab === 'overview') && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Grid - white cards with accent */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {statCards.filter(c => c.show).map((card, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{card.title}</p>
                                            <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                                        </div>
                                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                                            <card.icon size={22} className="text-white" strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* Sales Chart - Hidden for Warehouse Admin */}
                            {user.role !== 'WAREHOUSE_ADMIN' && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                                        Sales statistics
                                    </h2>
                                    <div className="h-80" style={{ height: '320px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                                <Legend iconType="circle" />
                                                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sales ($)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Low Stock Alert */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-rose-500 rounded-full" />
                                        Low stock alerts
                                    </h2>
                                    <span className="bg-rose-50 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-rose-100">
                                        {lowStock.length} items
                                    </span>
                                </div>
                                <div className="hide-scrollbar-x max-h-96">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                {user.role === 'SUPER_ADMIN' && (
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {lowStock.map(item => (
                                                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                <Package size={18} strokeWidth={2} />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-900">{item.product?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{item.warehouse?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                                                            Qty: {item.itemQuantity}
                                                        </span>
                                                    </td>
                                                    {user.role === 'SUPER_ADMIN' && (
                                                        <td className="px-6 py-3 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => handleOpenQuickPO(item)}
                                                                className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                            >
                                                                Order
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {lowStock.length === 0 && (
                                                <tr>
                                                    <td colSpan={user.role === 'SUPER_ADMIN' ? 4 : 3} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center text-slate-500">
                                                            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                                                                <CheckCircle size={24} className="text-emerald-500" />
                                                            </div>
                                                            <p className="font-medium text-slate-900">All stock levels are healthy.</p>
                                                            <p className="text-sm mt-1">No items require immediate attention.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Products & Inventory - Warehouse Admin Only */}
                            {user.role === 'WAREHOUSE_ADMIN' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                                                Recent products
                                            </h2>
                                        </div>
                                        <ul className="divide-y divide-slate-100">
                                            {products.map((product) => (
                                                <li key={product.id} className="px-6 py-4 hover:bg-indigo-50/30 transition-colors flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <Package size={20} strokeWidth={2} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                                                            <p className="text-xs text-slate-500 font-mono">SKU: {product.sku}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                                        {product.category}
                                                    </span>
                                                </li>
                                            ))}
                                            {products.length === 0 && (
                                                <li className="px-6 py-10 text-center text-slate-500 text-sm">No products in this warehouse.</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-1 h-5 bg-violet-500 rounded-full" />
                                                My inventory
                                            </h2>
                                        </div>
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-100">
                                                {inventory.map(item => (
                                                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="px-6 py-3 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                                                                    <Layers size={18} strokeWidth={2} />
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-900">{item.product?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-slate-900">{item.itemQuantity} items</span>
                                                            <span className="text-xs text-slate-500 block">{item.boxQuantity} boxes</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {inventory.length === 0 && (
                                                    <tr>
                                                        <td colSpan={2} className="px-6 py-10 text-center text-slate-500 text-sm">No inventory items.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Pending Orders - Inventory Manager Only */}
                {user?.role === 'INVENTORY_MANAGER' && activeTab === 'orders' && (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <ShoppingCart size={22} className="text-indigo-500" strokeWidth={2} />
                                        Manage customer orders
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Review and process orders (ship / deliver).</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-100">
                                        {pendingOrders.filter(o => o.status === 'PENDING').length} new
                                    </span>
                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                                        {pendingOrders.filter(o => o.status === 'PROCESSING').length} processing
                                    </span>
                                </div>
                            </div>

                            {pendingOrders.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <ShoppingCart size={28} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-600 font-medium">No orders requiring action</p>
                                </div>
                            ) : (
                                <div className="hide-scrollbar-x">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {pendingOrders.map(order => (
                                                <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-slate-900">{order.customer?.name}</div>
                                                        <div className="text-xs text-slate-500">{order.customer?.type}</div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' : order.status === 'PROCESSING' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : order.status === 'SHIPPED' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-slate-100 text-slate-600'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{order.orderItems?.length} products</td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">${Number(order.totalAmount).toLocaleString()}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2 flex-wrap">
                                                            {order.status === 'PENDING' && (
                                                                <button onClick={() => handleOrderStatusUpdate(order.id, 'PROCESSING')} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-xs font-semibold flex items-center gap-1" title="Process"><CheckCircle size={14} /> Process</button>
                                                            )}
                                                            {order.status === 'PROCESSING' && (
                                                                <button onClick={() => handleOrderStatusUpdate(order.id, 'SHIPPED')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1" title="Ship"><Truck size={14} /> Ship</button>
                                                            )}
                                                            {order.status === 'SHIPPED' && (
                                                                <button onClick={() => handleOrderStatusUpdate(order.id, 'DELIVERED')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-xs font-semibold flex items-center gap-1" title="Deliver"><Package size={14} /> Deliver</button>
                                                            )}
                                                            <button onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-rose-600 hover:border-rose-200 text-xs font-semibold flex items-center gap-1" title="Cancel"><XCircle size={14} /> Cancel</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Transfer Requests - Warehouse Admin Only */}
                {user?.role === 'WAREHOUSE_ADMIN' && activeTab === 'transfers' && (
                    <div className="animate-fade-in">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <ArrowLeftRight size={22} className="text-indigo-600" strokeWidth={2} />
                                        Incoming transfer requests
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-0.5">Review and approve or reject stock transfers.</p>
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                                    {pendingTransfers.length} pending
                                </span>
                            </div>

                            {pendingTransfers.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <ArrowLeftRight size={28} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-600 font-medium">No pending transfer requests</p>
                                    <p className="text-sm text-slate-500 mt-1">Check back later for new requests.</p>
                                </div>
                            ) : (
                                <div className="hide-scrollbar-x">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested by</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {pendingTransfers.map(transfer => (
                                                <tr key={transfer.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-slate-900">{transfer.product?.name}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{transfer.fromWarehouse?.name}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-slate-900">{transfer.itemQuantity} items</span>
                                                        <span className="text-xs text-slate-500 block">{transfer.boxQuantity} boxes</span>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-slate-900">{transfer.createdBy?.name || 'Super Admin'}</div>
                                                        <div className="text-xs text-slate-500 capitalize">{transfer.createdBy?.role?.replace('_', ' ').toLowerCase() || 'admin'}</div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleApproveTransfer(transfer.id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-xs font-semibold">Approve</button>
                                                            <button onClick={() => handleRejectTransfer(transfer.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold">Reject</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick PO Modal */}
            {showQuickPOModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in border border-slate-200 overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                                    <Plus size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Create Purchase Order</h2>
                                    <p className="text-indigo-200 text-xs mt-0.5">Restock low-stock product from a supplier.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowQuickPOModal(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" aria-label="Close">
                                <Plus size={18} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePO} className="flex flex-col">
                            <div className="p-6 space-y-4">

                                {/* Product info card */}
                                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-violet-50/50 p-4">
                                    <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                                        Product
                                    </p>
                                    <p className="text-base font-bold text-slate-900">{selectedItem?.product?.name}</p>
                                    <div className="flex justify-between mt-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Warehouse</p>
                                            <p className="text-sm font-medium text-slate-800 mt-0.5">{selectedItem?.warehouse?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Stock</p>
                                            <p className="text-sm font-bold text-rose-600 mt-0.5">{selectedItem?.itemQuantity} units</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form fields card */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Details</p>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Supplier <span className="text-rose-400">*</span></label>
                                        <select
                                            required
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all"
                                            value={poForm.supplierId}
                                            onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
                                        >
                                            <option value="">Select supplier</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Quantity <span className="text-rose-400">*</span></label>
                                            <input type="number" min="1" required className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-500" value={poForm.quantity} onChange={e => setPoForm({ ...poForm, quantity: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Unit Cost ($) <span className="text-rose-400">*</span></label>
                                            <input type="number" min="0" step="0.01" required className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-500" value={poForm.unitCost} onChange={e => setPoForm({ ...poForm, unitCost: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Est. Delivery Date <span className="text-rose-400">*</span></label>
                                        <input type="date" required className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all" value={poForm.deliveryDate} onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                                <button type="button" onClick={() => setShowQuickPOModal(false)} className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creatingPO} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                                    {creatingPO
                                        ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <Plus size={15} strokeWidth={2.5} />
                                    }
                                    {creatingPO ? 'Creating…' : 'Create Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
