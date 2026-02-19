import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import Loader from '../components/Loader';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://localhost:5000/api/inventory?page=${page}&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventory(data.inventory);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInventory();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [page, search]);

    if (loading) return <Loader text="Loading Inventory..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory Levels</h1>
                    <p className="text-gray-500 mt-1">Track stock availability across warehouses.</p>
                </div>
                <div className="relative group w-full sm:w-auto">
                    <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search product..."
                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-72 transition-all shadow-sm bg-gray-50 focus:bg-white relative z-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Warehouse</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Boxes</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Units</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {inventory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.product?.name || 'Unknown Product'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.product?.sku || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.warehouse?.name || 'Unknown Warehouse'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                                            {item.itemQuantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.boxQuantity > 0 ? (
                                            <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-bold">
                                                {item.boxQuantity}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {(item.itemQuantity || 0) + ((item.boxQuantity || 0) * (item.product?.boxSize || 0))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {inventory.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="text-lg font-medium">No inventory found.</p>
                        <p className="text-sm text-gray-400 mt-1">Try refining your search terms.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                <span className="text-sm font-medium text-gray-600">Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Inventory;
