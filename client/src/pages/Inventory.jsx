import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter } from 'lucide-react';
import Loader from '../components/Loader';
import AuthContext from '../context/AuthContext';

const Inventory = () => {
    const { user } = useContext(AuthContext);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredCategories = categories.filter(c =>
        c.toLowerCase().includes(category.toLowerCase())
    );

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://localhost:5000/api/products/categories', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const fetchInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = new URL('http://localhost:5000/api/inventory');
            url.searchParams.append('page', page);
            url.searchParams.append('search', search);
            if (category) url.searchParams.append('category', category);

            const { data } = await axios.get(url.toString(), {
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
    }, [page, search, category]);

    // Smooth scroll to top when page changes (Previous/Next)
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    if (loading) return <Loader text="Loading Inventory..." />;

    return (
        <div className="min-h-screen bg-white animate-fade-in">
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
                            <p className="text-sm text-indigo-600 mt-0.5">Track stock levels across warehouses.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Search product..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:w-56 pl-10 pr-4 py-2.5 text-sm bg-white border border-indigo-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Category"
                                    value={category}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onChange={(e) => {
                                        setCategory(e.target.value);
                                        setPage(1);
                                        setShowSuggestions(true);
                                    }}
                                    className="w-full sm:w-48 pl-10 pr-4 py-2.5 text-sm bg-white border border-indigo-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                                />
                                {showSuggestions && filteredCategories.length > 0 && (
                                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20 max-h-56 overflow-y-auto animate-fade-in">
                                        {filteredCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-50 last:border-0"
                                                onMouseDown={() => {
                                                    setCategory(cat);
                                                    setPage(1);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="hide-scrollbar-x">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Boxes</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total units</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <Link to={`/products/${item.product?.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                                                {item.product?.name || 'Unknown'}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">{item.product?.sku || 'N/A'}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                                            {user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_ADMIN' ? (
                                                <Link to={`/warehouses/${item.warehouse?.id}`} className="hover:text-indigo-600 transition-colors">
                                                    {item.warehouse?.name || 'Unknown'}
                                                </Link>
                                            ) : (
                                                <span>{item.warehouse?.name || 'Unknown'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {item.itemQuantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            {item.boxQuantity > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                                    {item.boxQuantity}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-slate-900">
                                            {(item.itemQuantity || 0) + ((item.boxQuantity || 0) * (item.product?.boxSize || 0))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {inventory.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <Search size={28} className="text-indigo-500" />
                            </div>
                            <p className="text-slate-900 font-semibold">No inventory found</p>
                            <p className="text-sm text-slate-500 mt-1">Try different search or category.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600">
                        Page <span className="font-semibold text-indigo-600">{page}</span> of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
