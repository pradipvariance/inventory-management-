import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package, AlertTriangle, Layers, Plus } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
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

                // Fetch basic stats - handle errors individually if needed or as a group
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
                        const [prodRes, invRes] = await Promise.all([
                            axios.get('http://localhost:5000/api/products?limit=5', config),
                            axios.get(`http://localhost:5000/api/inventory?limit=5&warehouseId=${user.warehouseId}`, config)
                        ]);
                        setProducts(prodRes.data.products || []);
                        setInventory(invRes.data.inventory || []);
                    } catch (err) {
                        console.error("Failed to load warehouse specific data", err);
                    }
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    if (loading) return <div>Loading Dashboard...</div>;

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
        <div className="space-y-8 animate-fade-in p-2">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
            </header>

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
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
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
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                            Low Stock Alerts
                        </h2>
                        <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {lowStock.length} Items
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50">
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
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Qty: {item.itemQuantity}
                                            </span>
                                        </td>
                                        {user.role === 'SUPER_ADMIN' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleOpenQuickPO(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition-colors"
                                                >
                                                    Order
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {lowStock.length === 0 && (
                                    <tr>
                                        <td colSpan={user.role === 'SUPER_ADMIN' ? "4" : "3"} className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                                                    <Layers size={24} className="text-green-500" />
                                                </div>
                                                <p>All stock levels are healthy.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Products Section - Warehouse Admin Only */}
                {user.role === 'WAREHOUSE_ADMIN' && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                                Recent Products
                            </h2>
                        </div>
                        <ul className="divide-y divide-gray-50">
                            {products.map((product) => (
                                <li key={product.id} className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded">
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
                )}

                {/* Inventory Section - Warehouse Admin Only */}
                {user.role === 'WAREHOUSE_ADMIN' && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                                My Inventory
                            </h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {inventory.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded bg-amber-50 flex items-center justify-center text-amber-600 mr-3">
                                                    <Layers size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{item.product?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-semibold">{item.itemQuantity} Items</div>
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
                )}
            </div>

            {/* Quick PO Modal */}
            {showQuickPOModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Create Purchase Order</h2>
                            <button onClick={() => setShowQuickPOModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Product</p>
                            <p className="font-semibold text-gray-900">{selectedItem?.product?.name}</p>
                            <div className="flex justify-between mt-2">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Warehouse</p>
                                    <p className="text-sm font-medium">{selectedItem?.warehouse?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase">Current Stock</p>
                                    <p className="text-sm font-medium text-red-600">{selectedItem?.itemQuantity} units</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCreatePO} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Supplier</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    value={poForm.supplierId}
                                    onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={poForm.quantity}
                                        onChange={e => setPoForm({ ...poForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Unit Cost ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={poForm.unitCost}
                                        onChange={e => setPoForm({ ...poForm, unitCost: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Estimated Delivery</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={poForm.deliveryDate}
                                    onChange={e => setPoForm({ ...poForm, deliveryDate: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickPOModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingPO}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-lg shadow-indigo-200 font-bold"
                                >
                                    {creatingPO ? 'Creating...' : 'Create PO'}
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
