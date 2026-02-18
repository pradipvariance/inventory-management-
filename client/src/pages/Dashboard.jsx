import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [statsRes, salesRes, stockRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/reports/stats', config),
                    axios.get('http://localhost:5000/api/reports/sales', config),
                    axios.get('http://localhost:5000/api/reports/low-stock', config)
                ]);

                setStats(statsRes.data);
                setSalesData(salesRes.data);
                setLowStock(stockRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading Dashboard...</div>;
    if (!stats) return <div>Error loading data.</div>;

    const statCards = [
        { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Total Orders', value: stats.orderCount, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Products', value: stats.productCount, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { title: 'Low Stock Items', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
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
                {/* Sales Chart */}
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
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.product.name}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500">{item.warehouse.name}</td>
                                        <td className="px-3 py-2 text-sm text-red-600 font-bold">{item.itemQuantity}</td>
                                    </tr>
                                ))}
                                {lowStock.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-gray-500">No low stock items.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
