import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit, Search, Filter, Package } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';

const Products = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Local state for input
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]); // Available categories
    const [category, setCategory] = useState(''); // Selected category filter
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filter categories for the custom dropdown
    const filteredCategories = categories.filter(c =>
        c.toLowerCase().includes(category.toLowerCase())
    );

    // -------------------

    const [formData, setFormData] = useState({
        name: '', sku: '', barcode: '', category: '', unitType: 'ITEM', boxSize: '', minStockLevel: '', amount: '', image: null,
        warehouseId: '', initialStock: '', boxQuantity: ''
    });

    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://localhost:5000/api/warehouses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWarehouses(data);
                // Set default warehouse if available
                if (data.length > 0 && !formData.warehouseId) {
                    setFormData(prev => ({ ...prev, warehouseId: data[0].id }));
                }
            } catch (error) {
                console.error('Error fetching warehouses:', error);
            }
        };

        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://localhost:5000/api/products/categories', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories", error);
            }
        }

        fetchWarehouses();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            const url = new URL('http://localhost:5000/api/products');
            url.searchParams.append('page', page);
            url.searchParams.append('search', search);
            if (category) url.searchParams.append('category', category);

            const { data } = await axios.get(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            console.log("Fetched products:", data.products);
            setProducts(data.products);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError("Failed to load products. " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Debounce Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setSearch(searchTerm);
        }, 500); // Wait 500ms after user stops typing
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Fetch when search logic (debounced) or page/category changes
    useEffect(() => {
        fetchProducts();
    }, [page, search, category]);

    // Smooth scroll to top when page changes (Previous/Next)
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // Auto-calculate Box Quantity based on Initial Items and Units Per Box
    useEffect(() => {
        const units = parseInt(formData.boxSize);
        const items = parseInt(formData.initialStock);

        if (units > 0 && !isNaN(items)) {
            const calculatedBoxes = Math.floor(items / units);
            setFormData(prev => ({ ...prev, boxQuantity: calculatedBoxes }));
        } else if (isNaN(items) || units <= 0) {
            setFormData(prev => ({ ...prev, boxQuantity: '' }));
        }
    }, [formData.initialStock, formData.boxSize]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('name', formData.name);
            data.append('sku', formData.sku);
            data.append('barcode', formData.barcode);
            data.append('category', formData.category);
            data.append('unitType', formData.unitType);
            if (formData.boxSize) data.append('boxSize', formData.boxSize);
            if (formData.minStockLevel) data.append('minStockLevel', formData.minStockLevel);
            if (formData.amount) data.append('amount', formData.amount);
            if (formData.image) data.append('image', formData.image);

            // New fields
            if (formData.warehouseId) data.append('warehouseId', formData.warehouseId);
            if (formData.initialStock) data.append('initialStock', formData.initialStock);
            if (formData.boxQuantity) data.append('boxQuantity', formData.boxQuantity);


            await axios.post('http://localhost:5000/api/products', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setFormData({ name: '', sku: '', barcode: '', category: '', unitType: 'ITEM', boxSize: '', minStockLevel: '', amount: '', image: null, warehouseId: '', initialStock: '', boxQuantity: '' });
            setImagePreview(null);
            setShowModal(false);
            fetchProducts();
            alert('Product created successfully');
        } catch (error) {
            console.error('Error creating product:', error);
            const errorData = error.response?.data?.message;
            if (Array.isArray(errorData)) {
                // Formatting Zod errors
                const formattedErrors = errorData.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
                alert(`Validation Error:\n${formattedErrors}`);
            } else {
                alert(errorData || 'Error creating product');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Simulate delete or actual delete if API supports
            await axios.delete(`http://localhost:5000/api/products/${id}`, config);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(error.response?.data?.message || 'Error deleting product');
        }
    }

    if (loading) return <Loader text="Loading Products..." />;
    if (error) return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium text-center animate-fade-in">
                {error}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white animate-fade-in">
            {/* Header - same structure as Inventory */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
                            <p className="text-sm text-indigo-600 mt-0.5">Manage your product catalog.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Search product..."
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
                            {user?.role !== 'WAREHOUSE_ADMIN' && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-indigo-500/25"
                                >
                                    <Plus size={20} strokeWidth={2} /> Add product
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - same layout as Inventory */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="hide-scrollbar-x">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Image</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                                    {user?.role !== 'WAREHOUSE_ADMIN' && (
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            {product.image ? (
                                                <img src={`/${product.image}`} alt={product.name} loading="lazy" className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                                            ) : (
                                                <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-300 text-xs font-medium">No img</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <Link to={`/products/${product.id}`} className="block hover:text-indigo-600 transition-colors">
                                                <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {product.sku}</div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">${product.amount}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {product.unitType}
                                            </span>
                                        </td>
                                        {user?.role !== 'WAREHOUSE_ADMIN' && (
                                            <td className="px-6 py-3 whitespace-nowrap text-right">
                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete product">
                                                    <Trash2 size={18} strokeWidth={2} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {products.length === 0 && !loading && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <Search size={28} className="text-indigo-500" />
                            </div>
                            <p className="text-slate-900 font-semibold">No products found</p>
                            <p className="text-sm text-slate-500 mt-1">Try different search or category, or add a new product.</p>
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

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-scale-in border border-slate-200 overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                                    <Package size={18} strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Add New Product</h2>
                                    <p className="text-indigo-200 text-xs mt-0.5">Fill in the details below to add to your catalog.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" aria-label="Close">
                                <Plus size={18} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col">

                            {/* Two-column body */}
                            <div className="grid grid-cols-2 divide-x divide-slate-100">

                                {/* ── LEFT COLUMN ── */}
                                <div className="p-6 space-y-4">

                                    {/* Image Upload */}
                                    <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4">
                                        <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-3">Product Image</label>
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-xl bg-white border border-indigo-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                                {imagePreview
                                                    ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                                    : <Package size={24} className="text-indigo-300" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <input type="file" accept="image/*"
                                                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                                    onChange={handleFileChange}
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1.5">PNG, JPG or WEBP · Max 5MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basic Information</p>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Product Name <span className="text-rose-400">*</span></label>
                                            <input type="text" required
                                                className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-300"
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wireless Mouse"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">SKU <span className="text-rose-400">*</span></label>
                                                <input type="text" required
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 font-mono transition-all placeholder-slate-300"
                                                    value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="WM-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Barcode <span className="text-rose-400">*</span></label>
                                                <input type="text" required
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 font-mono transition-all placeholder-slate-300"
                                                    value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan or enter"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Category <span className="text-rose-400">*</span></label>
                                                <input type="text" required
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-300"
                                                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Electronics"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Price <span className="text-rose-400">*</span></label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">$</span>
                                                    <input type="number" step="0.01" min="0" required
                                                        className="block w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all"
                                                        value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── RIGHT COLUMN ── */}
                                <div className="p-6 space-y-4">

                                    {/* Stock Config */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Configuration</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Unit Type</label>
                                                <select
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all"
                                                    value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                                                >
                                                    <option value="ITEM">Item</option>
                                                    <option value="BOX">Box</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Min Stock</label>
                                                <input type="number"
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all"
                                                    value={formData.minStockLevel} onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })} placeholder="10"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Items / Box <span className="text-rose-400">*</span></label>
                                                <input type="number" required
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all"
                                                    value={formData.boxSize} onChange={(e) => setFormData({ ...formData, boxSize: e.target.value })} placeholder="12"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400">Items per Box auto-calculates initial boxes and manages box-level inventory.</p>
                                    </div>

                                    {/* Initial Inventory */}
                                    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-violet-50/50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                                                Initial Inventory
                                            </h3>
                                            <span className="text-[9px] font-semibold text-indigo-500 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">Optional</span>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Warehouse</label>
                                            <select
                                                className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all disabled:opacity-60"
                                                value={formData.warehouseId} onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })} disabled={user?.role === 'WAREHOUSE_ADMIN'}
                                            >
                                                <option value="">Select warehouse...</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Initial Items</label>
                                                <input type="number" min="0"
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 text-center transition-all"
                                                    value={formData.initialStock} onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })} placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Initial Boxes</label>
                                                <input type="number" min="0"
                                                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 text-center transition-all"
                                                    value={formData.boxQuantity} onChange={(e) => setFormData({ ...formData, boxQuantity: e.target.value })} placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-indigo-400">Boxes are auto-calculated from Initial Items ÷ Items per Box.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                                    <Plus size={15} strokeWidth={2.5} />
                                    Create Product
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
