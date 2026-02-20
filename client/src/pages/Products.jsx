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

    // -------------------

    const [formData, setFormData] = useState({
        name: '', sku: '', barcode: '', category: '', unitType: 'ITEM', boxSize: '', minStockLevel: '', amount: '', image: null,
        warehouseId: '', initialStock: '', boxQuantity: ''
    });

    useEffect(() => {
        const fetchWarehouses = async () => {
            if (user?.role === 'WAREHOUSE_ADMIN') return;
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://localhost:5000/api/warehouses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (Array.isArray(data)) {
                    setWarehouses(data);
                } else {
                    console.error("Unexpected warehouse data format:", data);
                    setWarehouses([]);
                }
            } catch (error) {
                console.error("Error fetching warehouses", error);
                setWarehouses([]);
            }
        };
        fetchWarehouses();
    }, [user]);

    const fetchProducts = async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://localhost:5000/api/products?page=${page}&search=${search}`, {
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

    // Fetch when search logic (debounced) or page changes
    useEffect(() => {
        fetchProducts();
    }, [page, search]);

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
    if (error) return <div className="text-red-500 p-4 font-bold text-center border border-red-200 bg-red-50 rounded-xl mt-4 animate-fade-in">{error}</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your centralized product catalog.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 transition-all shadow-sm bg-gray-50 focus:bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Add Product button visible to non-WAREHOUSE_ADMIN and non-SUPER_ADMIN users */}
                    {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={20} /> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unit</th>
                                {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {product.image ?
                                            <img
                                                src={`/${product.image}`}
                                                alt={product.name}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-12 w-12 object-cover rounded-lg shadow-sm border border-gray-100"
                                            />
                                            : <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">No Img</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            <Link to={`/products/${product.id}`} className="hover:text-indigo-600 transition-colors">
                                                {product.name}
                                            </Link>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">SKU: {product.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${product.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-100">
                                            {product.unitType}
                                        </span>
                                    </td>
                                    {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {products.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-500">
                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="text-lg font-medium">No products found.</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new product.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
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

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                            <p className="text-gray-500 text-sm mt-1">Enter product details to add to catalog.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Product Image</label>
                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-xs text-center px-2">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                                            onChange={handleFileChange}
                                        />
                                        <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 5MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Product Name</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wireless Mouse" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">SKU</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. WM-001" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Barcode</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan code" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                                <input type="text" required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Electronics" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Price ($)</label>
                                <input type="number" step="0.01" min="0" required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Unit Type</label>
                                <select className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}>
                                    <option value="ITEM">Item</option>
                                    <option value="BOX">Box</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Min. Stock Level</label>
                                <input type="number" className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={formData.minStockLevel} onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })} placeholder="10" />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Units Per Box</label>
                                <input
                                    type="number"
                                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                    value={formData.boxSize}
                                    onChange={(e) => setFormData({ ...formData, boxSize: e.target.value })}
                                    placeholder="e.g. 12 (Used for auto-calculation)"
                                />
                            </div>

                            {/* Initial Inventory Section */}
                            <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                                    Initial Inventory Setup
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Warehouse</label>
                                        <select
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                            value={formData.warehouseId}
                                            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                                            disabled={user?.role === 'WAREHOUSE_ADMIN'}
                                        >
                                            <option value="">Select Warehouse</option>
                                            {warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Initial Items</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                            value={formData.initialStock}
                                            onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Initial Boxes</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                            value={formData.boxQuantity}
                                            onChange={(e) => setFormData({ ...formData, boxQuantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Create Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
