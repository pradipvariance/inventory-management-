import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package, AlertTriangle, Layers } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Fetch basic stats - handle errors individually if needed or as a group
                try {
                    const [statsRes, salesRes, stockRes] = await Promise.all([
                        axios.get('http://localhost:5000/api/reports/stats', config),
                        axios.get('http://localhost:5000/api/reports/sales', config),
                        axios.get('http://localhost:5000/api/reports/low-stock', config)
                    ]);
                    setStats(prev => ({ ...prev, ...statsRes.data }));
                    setSalesData(salesRes.data || []);
                    setLowStock(stockRes.data || []);
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

    // Fallback constants if stats are missing (though state init covers most)
    const safeStats = stats || { totalRevenue: 0, orderCount: 0, productCount: 0, lowStockCount: 0, inventoryCount: 0 };

    const statCards = [
        { title: 'Total Revenue', value: `$${(safeStats.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', show: user.role !== 'WAREHOUSE_ADMIN' },
        { title: 'Total Orders', value: safeStats.orderCount || 0, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100', show: user.role !== 'WAREHOUSE_ADMIN' },
        { title: 'Products', value: safeStats.productCount || 0, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100', show: true },
        { title: 'Low Stock Items', value: safeStats.lowStockCount || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', show: true },
        { title: 'Inventory Count', value: safeStats.inventoryCount || 0, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-100', show: user.role === 'WAREHOUSE_ADMIN' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.filter(c => c.show).map((card, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6 flex items-center">
                        <div className={`p-3 rounded-full ${card.bg} ${card.color} mr-4`}>
                            <card.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart - Hidden for Warehouse Admin */}
                {user.role !== 'WAREHOUSE_ADMIN' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Sales - Last 7 Days</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="sales" fill="#4F46E5" name="Sales ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Low Stock Alert */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Low Stock Alerts</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lowStock.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.product?.name || 'Unknown'}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500">{item.warehouse?.name || 'Unknown'}</td>
                                        <td className="px-3 py-2 text-sm text-red-600 font-bold">{item.itemQuantity}</td>
                                    </tr>
                                ))}
                                {lowStock.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-gray-500">No low stock items.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Products Section - Warehouse Admin Only */}
                {user.role === 'WAREHOUSE_ADMIN' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Recent Products</h2>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {products.map((product) => (
                                <li key={product.id} className="py-3 flex justify-between">
                                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                    <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                                </li>
                            ))}
                            {products.length === 0 && <li className="py-3 text-center text-gray-500">No products found.</li>}
                        </ul>
                    </div>
                )}

                {/* Inventory Section - Warehouse Admin Only */}
                {user.role === 'WAREHOUSE_ADMIN' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">My Inventory</h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inventory.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.product?.name || 'Unknown'}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500">{item.itemQuantity} / {item.boxQuantity} Boxes</td>
                                    </tr>
                                ))}
                                {inventory.length === 0 && <tr><td colSpan="2" className="text-center py-4 text-gray-500">No inventory found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
