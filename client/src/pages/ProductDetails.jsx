import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import Loader from '../components/Loader';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        unitType: 'ITEM',
        boxSize: '',
        minStockLevel: '',
        amount: '',
        image: null
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`http://localhost:5000/api/products/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProduct(data);
                setFormData({
                    name: data.name,
                    sku: data.sku,
                    barcode: data.barcode,
                    category: data.category,
                    unitType: data.unitType,
                    boxSize: data.boxSize || '',
                    minStockLevel: data.minStockLevel,
                    amount: data.amount,
                    image: null // We don't set the file object here, only if user changes it
                });
                if (data.image) {
                    setImagePreview(`/${data.image}`);
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
                alert('Failed to fetch product details');
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, navigate]);

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

            const response = await axios.put(`http://localhost:5000/api/products/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProduct(response.data);
            alert('Product updated successfully');
        } catch (error) {
            console.error('Error updating product:', error);
            alert(error.response?.data?.message || 'Error updating product');
        }
    };

    if (loading) return <Loader text="Loading Product Details..." />;
    if (!product) return <div>Product not found</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in">
            <button
                onClick={() => navigate('/products')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="mr-2" size={20} />
                Back to Products
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
                    <p className="text-gray-500 text-sm mt-1">Update product information and settings.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Upload Section */}
                        <div className="col-span-1 md:col-span-2 flex justify-center">
                            <div className="relative group cursor-pointer w-40 h-40">
                                <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center relative">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm font-medium">No Image</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="text-white" size={24} />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="text-center mt-2">
                                    <p className="text-sm font-medium text-indigo-600">Change Image</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Barcode</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Unit Type</label>
                                <select
                                    value={formData.unitType}
                                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                >
                                    <option value="ITEM">Item</option>
                                    <option value="BOX">Box</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Units Per Box</label>
                                <input
                                    type="number"
                                    value={formData.boxSize}
                                    onChange={(e) => setFormData({ ...formData, boxSize: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    placeholder="e.g. 12"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Min. Stock Level</label>
                                <input
                                    type="number"
                                    value={formData.minStockLevel}
                                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold active:scale-95"
                        >
                            <Save size={20} /> Update Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductDetails;
