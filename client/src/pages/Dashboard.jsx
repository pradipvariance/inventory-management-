import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package, AlertTriangle, Layers, Plus, ArrowLeftRight, CheckCircle, Truck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
// import { DollarSign, ShoppingCart, Package, AlertTriangle, Layers, Plus, ArrowLeftRight, CheckCircle } from 'lucide-react';
// import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';

const Dashboard = () => {
    const { user } = useAuth();
    const socket = useSocket();
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading dashboard insights...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
                </div>

                {/* Tab Switcher - Warehouse Admin & Inventory Manager */}
                {(user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'INVENTORY_MANAGER') && (
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start md:self-center">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'overview'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer'
                                }`}
                        >
                            Overview
                        </button>
                        {user?.role === 'WAREHOUSE_ADMIN' && (
                            <button
                                onClick={() => setActiveTab('transfers')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${activeTab === 'transfers'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer'
                                    }`}
                            >
                                Transfer Requests
                                {pendingTransfers.length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] h-4 w-4 flex items-center justify-center rounded-full animate-pulse">
                                        {pendingTransfers.length}
                                    </span>
                                )}
                            </button>
                        )}
                        {user?.role === 'INVENTORY_MANAGER' && (
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${activeTab === 'orders'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer'
                                    }`}
                            >
                                Pending Orders
                                {pendingOrders.length > 0 && (
                                    <span className="bg-indigo-500 text-white text-[10px] h-4 w-4 flex items-center justify-center rounded-full animate-pulse">
                                        {pendingOrders.length}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tab: Overview */}
            {((user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'INVENTORY_MANAGER') || activeTab === 'overview') && (
                <div className="space-y-8 animate-fade-in">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.filter(c => c.show).map((card, index) => (
                            <div
                                key={index}
                                className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${card.gradient}`}
                            >
                                <div className="p-6 text-white relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium opacity-90 mb-1">{card.title}</p>
                                            <h3 className="text-3xl font-bold">{card.value}</h3>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <card.icon size={24} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative Circle */}
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl z-0"></div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Sales Chart - Hidden for Warehouse Admin */}
                        {user.role !== 'WAREHOUSE_ADMIN' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                    Sales Statistics
                                </h2>
                                <div className="h-80" style={{ height: '320px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F3F4F6' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Legend iconType="circle" />
                                            <Bar dataKey="sales" fill="#6366F1" radius={[4, 4, 0, 0]} name="Sales ($)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Low Stock Alert */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                                    Low Stock Alerts
                                </h2>
                                <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-red-100">
                                    {lowStock.length} Items
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-50">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warehouse</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            {user.role === 'SUPER_ADMIN' && (
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {lowStock.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 mr-3">
                                                            <Package size={16} />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{item.product?.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.warehouse?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ring-1 ring-red-200">
                                                        Qty: {item.itemQuantity}
                                                    </span>
                                                </td>
                                                {user.role === 'SUPER_ADMIN' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleOpenQuickPO(item)}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition-colors cursor-pointer text-xs font-bold"
                                                        >
                                                            Order
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {lowStock.length === 0 && (
                                            <tr>
                                                <td colSpan={user.role === 'SUPER_ADMIN' ? "4" : "3"} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                                                            <CheckCircle size={24} className="text-green-500" />
                                                        </div>
                                                        <p className="font-medium text-gray-900">All stock levels are healthy.</p>
                                                        <p className="text-sm mt-1">No items require immediate attention.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Products & Inventory Sections - Warehouse Admin Only */}
                        {user.role === 'WAREHOUSE_ADMIN' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-50">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                                            Recent Products
                                        </h2>
                                    </div>
                                    <ul className="divide-y divide-gray-50">
                                        {products.map((product) => (
                                            <li key={product.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                        <Package size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{product.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                                    {product.category}
                                                </span>
                                            </li>
                                        ))}
                                        {products.length === 0 && (
                                            <li className="p-8 text-center text-gray-500">
                                                <p>No products found in this warehouse.</p>
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-50">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                                            My Inventory
                                        </h2>
                                    </div>
                                    <table className="min-w-full divide-y divide-gray-50">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {inventory.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded bg-amber-50 flex items-center justify-center text-amber-600 mr-3">
                                                                <Layers size={16} />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-900">{item.product?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 font-bold">{item.itemQuantity} Items</div>
                                                        <div className="text-xs text-gray-500">{item.boxQuantity} Boxes</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {inventory.length === 0 && (
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                                                        No inventory items found.
                                                    </td>
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
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-indigo-50/10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <ShoppingCart size={24} className="text-indigo-500" />
                                    Manage Customer Orders
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Review and process orders through their lifecycle (Ship/Deliver)</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    {pendingOrders.filter(o => o.status === 'PENDING').length} NEW
                                </span>
                                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    {pendingOrders.filter(o => o.status === 'PROCESSING').length} PROCESSING
                                </span>
                            </div>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="p-20 text-center text-gray-400">
                                <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No orders requiring action</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-50">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {pendingOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{order.customer?.name}</div>
                                                    <div className="text-xs text-gray-500">{order.customer?.type}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-600' :
                                                            order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-600' :
                                                                'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {order.orderItems?.length} Products
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    ${Number(order.totalAmount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        {order.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => handleOrderStatusUpdate(order.id, 'PROCESSING')}
                                                                className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                                                title="Process Order"
                                                            >
                                                                <CheckCircle size={14} /> Process
                                                            </button>
                                                        )}
                                                        {order.status === 'PROCESSING' && (
                                                            <button
                                                                onClick={() => handleOrderStatusUpdate(order.id, 'SHIPPED')}
                                                                className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                                                title="Ship Order"
                                                            >
                                                                <Truck size={14} /> Ship
                                                            </button>
                                                        )}
                                                        {order.status === 'SHIPPED' && (
                                                            <button
                                                                onClick={() => handleOrderStatusUpdate(order.id, 'DELIVERED')}
                                                                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                                                title="Mark as Delivered"
                                                            >
                                                                <Package size={14} /> Deliver
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')}
                                                            className="p-1.5 bg-white text-gray-400 border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                                            title="Cancel Order"
                                                        >
                                                            <XCircle size={14} /> Cancel
                                                        </button>
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

            {/* Tab: Transfer Requests */}
            {user?.role === 'WAREHOUSE_ADMIN' && activeTab === 'transfers' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <ArrowLeftRight size={24} className="text-indigo-600" />
                                    Incoming Transfer Requests
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Review and action stock transfers initiated by Super Admins</p>
                            </div>
                            <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full ring-1 ring-indigo-200">
                                {pendingTransfers.length} PENDING
                            </span>
                        </div>

                        {pendingTransfers.length === 0 ? (
                            <div className="p-20 text-center text-gray-400">
                                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ArrowLeftRight size={32} className="text-gray-300" />
                                </div>
                                <p className="text-lg font-bold text-gray-600">No pending transfer requests</p>
                                <p className="text-sm text-gray-400 mt-1">Check back later for new requests.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-50">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested By</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {pendingTransfers.map(transfer => (
                                            <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{transfer.product?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.fromWarehouse?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{transfer.itemQuantity} Items</div>
                                                    <div className="text-xs text-gray-500">{transfer.boxQuantity} Boxes</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{transfer.createdBy?.name || 'Super Admin'}</div>
                                                    <div className="text-xs text-gray-400 capitalize">{transfer.createdBy?.role?.replace('_', ' ').toLowerCase() || 'admin'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                    <button
                                                        onClick={() => handleApproveTransfer(transfer.id)}
                                                        className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-bold text-xs cursor-pointer shadow-sm hover:shadow-md"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectTransfer(transfer.id)}
                                                        className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-bold text-xs cursor-pointer"
                                                    >
                                                        Reject
                                                    </button>
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

            {/* Quick PO Modal */}
            {showQuickPOModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-scale-in border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Create Purchase Order</h2>
                            <button onClick={() => setShowQuickPOModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 cursor-pointer">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="mb-6 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Product</p>
                            <p className="text-lg font-extrabold text-gray-900">{selectedItem?.product?.name}</p>
                            <div className="flex justify-between mt-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Warehouse</p>
                                    <p className="text-sm font-bold text-gray-700">{selectedItem?.warehouse?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Current Stock</p>
                                    <p className="text-sm font-extrabold text-red-500">{selectedItem?.itemQuantity} units</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCreatePO} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Supplier</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-gray-800 shadow-inner focus:border-transparent"
                                    value={poForm.supplierId}
                                    onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
                                >
                                    <option value="">Select a reliable supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner focus:border-transparent"
                                        value={poForm.quantity}
                                        onChange={e => setPoForm({ ...poForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Unit Cost ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner focus:border-transparent"
                                        value={poForm.unitCost}
                                        onChange={e => setPoForm({ ...poForm, unitCost: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Est. Delivery Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium shadow-inner focus:border-transparent"
                                    value={poForm.deliveryDate}
                                    onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickPOModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all font-bold text-sm active:scale-95 cursor-pointer border border-transparent hover:border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingPO}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-all shadow-xl shadow-indigo-100 font-bold text-sm active:scale-95 cursor-pointer flex items-center justify-center border border-transparent"
                                >
                                    {creatingPO ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : 'Create Order'}
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
