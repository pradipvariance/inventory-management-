import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import CartContext from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import toast, { Toaster } from 'react-hot-toast';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);
    const socket = useSocket();

    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
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
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const params = new URLSearchParams({ page, limit: 8, search });
                if (category) params.append('category', category);

                const { data } = await axios.get(`http://localhost:5000/api/products?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProducts(data.products);
                setTotalPages(data.totalPages);

                if (socket) {
                    data.products.forEach(p => socket.emit('subscribe_product', p.id));
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [page, search, category, socket]);

    useEffect(() => {
        if (!socket) return;
        const handleStockUpdate = (data) => {
            setProducts(prevProducts => prevProducts.map(p => {
                if (p.id === data.productId) {
                    return { ...p, totalStock: p.totalStock + data.change };
                }
                return p;
            }));
        };
        socket.on('stock_update', handleStockUpdate);
        return () => socket.off('stock_update', handleStockUpdate);
    }, [socket]);

    const handleAddToCart = (product) => {
        addToCart({ ...product, price: parseFloat(product.amount) });
        toast.success((t) => (
            <div className="flex items-center gap-2">
                <span className="font-semibold">Added to cart</span>
                <span className="text-sm text-slate-500">{product.name}</span>
            </div>
        ), {
            icon: '🛒',
            style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
        });
    };

    return (
        <div className="animate-fade-in min-h-screen pb-16 bg-white">
            <Toaster position="bottom-center" reverseOrder={false} />

            {/* Header strip with accent */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shop</h1>
                            <p className="text-sm text-indigo-600/90 mt-0.5">Browse and add items to your cart.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                    onChange={(e) => { setCategory(e.target.value); setPage(1); setShowSuggestions(true); }}
                                    className="w-full sm:w-48 pl-10 pr-4 py-2.5 text-sm bg-white border border-indigo-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                                />
                                {showSuggestions && filteredCategories.length > 0 && (
                                    <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden z-50 max-h-56 overflow-y-auto animate-fade-in">
                                        {filteredCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-50 last:border-0"
                                                onMouseDown={() => { setCategory(cat); setPage(1); setShowSuggestions(false); }}
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
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-100 border-t-indigo-600" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <article
                                    key={product.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
                                >
                                    <div className="aspect-[4/3] bg-indigo-50/50 flex items-center justify-center overflow-hidden relative">
                                        {product.image ? (
                                            <img
                                                src={`/${product.image}`}
                                                alt={product.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-indigo-200 text-sm font-medium">No image</span>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            {product.totalStock > 0 ? (
                                                <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                                                    In stock
                                                </span>
                                            ) : (
                                                <span className="bg-rose-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                                                    Sold out
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                                            {product.category}
                                        </p>
                                        <h3 className="font-semibold text-slate-900 leading-snug mb-3 flex-1">
                                            {product.name}
                                        </h3>

                                        <div className="flex items-end justify-between gap-3 pt-4 border-t border-slate-100">
                                            <div>
                                                <span className="text-xs text-slate-500 block">Price</span>
                                                <span className="text-xl font-bold text-indigo-600">
                                                    ${parseFloat(product.amount).toFixed(2)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.totalStock <= 0}
                                                className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all ${product.totalStock > 0
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-500/25'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                title={product.totalStock > 0 ? 'Add to cart' : 'Out of stock'}
                                            >
                                                <ShoppingCart size={20} strokeWidth={2} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                    <Search size={28} className="text-indigo-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No products found</h3>
                                <p className="text-slate-500 text-sm mt-1">Try different search or category.</p>
                                <button
                                    onClick={() => { setSearchTerm(''); setCategory(''); }}
                                    className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-3 mt-12 pt-8 border-t border-slate-100">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-600 px-4">
                                    Page <span className="font-semibold text-indigo-600">{page}</span> of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Shop;
