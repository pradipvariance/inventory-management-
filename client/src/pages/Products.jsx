import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit, Search, Filter } from 'lucide-react';
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
            // ... existing warehouse fetch logic ...
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

        if (user?.role !== 'WAREHOUSE_ADMIN') fetchWarehouses();
        fetchCategories();
    }, [user]);

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

        if (items && units > 0) {
            const calculatedBoxes = Math.floor(items / units);
            setFormData(prev => ({ ...prev, boxQuantity: calculatedBoxes }));
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
                            {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
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
                                    {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
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
                                        {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-slate-200 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close">
                            <Plus size={24} className="rotate-45" />
                        </button>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add new product</h2>
                            <p className="text-slate-500 text-sm mt-0.5">Enter product details to add to catalog.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Product image</label>
                                <div className="flex items-center gap-4">
                                    <div className="h-24 w-24 rounded-xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> : <span className="text-indigo-400 text-xs">No image</span>}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" onChange={handleFileChange} />
                                        <p className="text-xs text-slate-400 mt-2">PNG, JPG up to 5MB</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product name</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wireless Mouse" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SKU</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. WM-001" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Barcode</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan code" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Electronics" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Price ($)</label>
                                <input type="number" step="0.01" min="0" required className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unit type</label>
                                <select className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}>
                                    <option value="ITEM">Item</option>
                                    <option value="BOX">Box</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Min. stock level</label>
                                <input type="number" className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.minStockLevel} onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })} placeholder="10" />
                            </div>
                            {formData.unitType === 'BOX' && (
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Items per box</label>
                                    <input type="number" className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.boxSize} onChange={(e) => setFormData({ ...formData, boxSize: e.target.value })} placeholder="e.g. 12" />
                                </div>
                            )}
                            <div className="col-span-1 md:col-span-2 border-t border-slate-200 pt-6 mt-2">
                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                                    Initial inventory
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse</label>
                                        <select className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.warehouseId} onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })} disabled={user?.role === 'WAREHOUSE_ADMIN'}>
                                            <option value="">Select warehouse</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial items</label>
                                        <input type="number" min="0" className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.initialStock} onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial boxes</label>
                                        <input type="number" min="0" className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900" value={formData.boxQuantity} onChange={(e) => setFormData({ ...formData, boxQuantity: e.target.value })} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25">Create product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
