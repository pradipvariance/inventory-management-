import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Search, Filter } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Products = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [formData, setFormData] = useState({
        name: '', sku: '', barcode: '', category: '', unitType: 'ITEM', boxSize: '', minStockLevel: '', amount: '', image: null
    });

    const [imagePreview, setImagePreview] = useState(null);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://localhost:5000/api/products?page=${page}&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(data.products);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [page, search]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
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

            await axios.post('http://localhost:5000/api/products', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setFormData({ name: '', sku: '', barcode: '', category: '', unitType: 'ITEM', boxSize: '', minStockLevel: '', amount: '', image: null });
            setImagePreview(null);
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            alert(error.response?.data?.message || 'Error creating product');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(error.response?.data?.message || 'Error deleting product');
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Add Product button visible to non-WAREHOUSE_ADMIN and non-SUPER_ADMIN users */}
                    {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                        >
                            <Plus size={20} /> Add Product
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                            {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.image ?
                                        <img src={`/${product.image}`} alt={product.name} className="h-10 w-10 object-cover rounded" />
                                        : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {product.unitType}
                                    </span>
                                </td>
                                {user?.role !== 'WAREHOUSE_ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Image</label>
                                <input type="file" accept="image/*" className="mt-1 block w-full border p-2 rounded-md" onChange={handleFileChange} />
                                {imagePreview && <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover mt-2 rounded" />}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <input type="number" step="0.01" min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Unit Type</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}>
                                    <option value="ITEM">Item</option>
                                    <option value="BOX">Box</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Box Size (if Box)</label>
                                <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.boxSize} onChange={(e) => setFormData({ ...formData, boxSize: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                                <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.minStockLevel} onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })} />
                            </div>

                            <div className="col-span-2 flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
