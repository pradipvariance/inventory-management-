import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Upload, Package, Tag, Hash, Layers, DollarSign, Box, AlertTriangle } from 'lucide-react';
import Loader from '../components/Loader';

const Field = ({ label, icon: Icon, children }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            {Icon && <Icon size={10} className="inline mr-1 text-slate-400" />}
            {label}
        </label>
        {children}
    </div>
);

const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 font-medium transition-all";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '', sku: '', barcode: '', category: '',
        unitType: 'ITEM', boxSize: '', minStockLevel: '', amount: '', image: null
    });

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

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
                    minStockLevel: data.minStockLevel ?? '',
                    amount: data.amount,
                    image: null
                });
                if (data.image) setImagePreview(`/${data.image}`);
            } catch (err) {
                console.error(err);
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveMsg(null);
        try {
            const token = localStorage.getItem('token');
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('sku', formData.sku);
            fd.append('barcode', formData.barcode);
            fd.append('category', formData.category);
            fd.append('unitType', formData.unitType);
            if (formData.boxSize) fd.append('boxSize', formData.boxSize);
            if (formData.minStockLevel !== '') fd.append('minStockLevel', formData.minStockLevel);
            if (formData.amount !== '') fd.append('amount', formData.amount);
            if (formData.image) fd.append('image', formData.image);

            const res = await axios.put(`http://localhost:5000/api/products/${id}`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setProduct(res.data);
            setSaveMsg({ type: 'success', text: 'Product updated successfully.' });
        } catch (err) {
            setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Error updating product.' });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3500);
        }
    };

    if (loading) return <Loader text="Loading Product Details..." />;
    if (!product) return <div className="p-8 text-slate-500">Product not found.</div>;

    const totalStock = product.inventory?.reduce(
        (sum, inv) => sum + inv.itemQuantity + (inv.boxQuantity * (product.boxSize || 0)), 0
    ) ?? 0;

    const isLowOverall = product.minStockLevel && totalStock <= product.minStockLevel;

    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in">

            {/* ── Page header ── */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/products')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                        <ArrowLeft size={13} /> Products
                    </button>
                    <div className="h-5 w-px bg-indigo-200 shrink-0" />
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                            <Package size={17} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-slate-900 truncate">{product.name}</h1>
                            <p className="text-xs text-indigo-700 font-medium">Edit details · review warehouse stock</p>
                        </div>
                    </div>
                    {/* Quick stat chips */}
                    <div className="ml-auto hidden sm:flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                            <DollarSign size={11} />${product.amount}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${isLowOverall ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            <Layers size={11} />{totalStock} units
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">

                {/* ── Edit form card ── */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                        {/* Card header */}
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Package size={15} className="text-indigo-600" />
                                Product Information
                            </h2>
                            <p className="text-xs text-slate-600 mt-0.5">Update core product details below.</p>
                        </div>

                        <div className="p-5">
                            <div className="flex flex-col lg:flex-row gap-6">

                                {/* ── Image panel ── */}
                                <div className="flex flex-col items-center gap-3 shrink-0">
                                    <div className="relative group cursor-pointer w-40 h-40 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm bg-indigo-50/40 flex items-center justify-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-indigo-400 px-4 text-center">
                                                <Package size={32} strokeWidth={1.5} />
                                                <span className="text-xs font-medium">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                                            <Upload className="text-white" size={20} />
                                            <span className="text-white text-xs font-semibold">Change</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-xs text-indigo-600 font-semibold">Click to upload</p>

                                    {/* Stat pills under image */}
                                    <div className="w-40 space-y-1.5">
                                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">SKU</p>
                                            <p className="text-xs font-bold text-slate-800 font-mono">{product.sku}</p>
                                        </div>
                                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Category</p>
                                            <p className="text-xs font-semibold text-slate-700">{product.category}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Form fields ── */}
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Product Name" icon={Package}>
                                        <input type="text" className={`${inputCls} sm:col-span-2`} value={formData.name} onChange={set('name')} required />
                                    </Field>

                                    <Field label="Category">
                                        <input type="text" className={inputCls} value={formData.category} onChange={set('category')} required />
                                    </Field>

                                    <Field label="SKU" icon={Tag}>
                                        <input type="text" className={`${inputCls} font-mono`} value={formData.sku} onChange={set('sku')} required />
                                    </Field>

                                    <Field label="Barcode" icon={Hash}>
                                        <input type="text" className={`${inputCls} font-mono`} value={formData.barcode} onChange={set('barcode')} required />
                                    </Field>

                                    <Field label="Price ($)" icon={DollarSign}>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm pointer-events-none">$</span>
                                            <input type="number" step="0.01" min="0" className={`${inputCls} pl-6`} value={formData.amount} onChange={set('amount')} required />
                                        </div>
                                    </Field>

                                    <Field label="Unit Type" icon={Box}>
                                        <select className={inputCls} value={formData.unitType} onChange={set('unitType')}>
                                            <option value="ITEM">Item</option>
                                            <option value="BOX">Box</option>
                                        </select>
                                    </Field>

                                    <Field label="Units per Box">
                                        <input type="number" className={inputCls} value={formData.boxSize} onChange={set('boxSize')} placeholder="e.g. 12" />
                                    </Field>

                                    <Field label="Min. Stock Level" icon={AlertTriangle}>
                                        <input type="number" className={inputCls} value={formData.minStockLevel} onChange={set('minStockLevel')} />
                                    </Field>
                                </div>
                            </div>

                            {saveMsg && (
                                <div className={`mt-4 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${saveMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${saveMsg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    {saveMsg.text}
                                </div>
                            )}
                        </div>

                        {/* Card footer */}
                        <div className="px-5 py-3 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-60"
                            >
                                {saving
                                    ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Saving…</>
                                    : <><Save size={14} /> Save Changes</>
                                }
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── Warehouse stock card ── */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Layers size={15} className="text-indigo-600" />
                                Warehouse Stock
                            </h2>
                            <p className="text-xs text-slate-600 mt-0.5">Current inventory across all warehouses.</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${isLowOverall ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                            {totalStock} total units
                        </span>
                    </div>

                    {(!product.inventory || product.inventory.length === 0) ? (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                                <Layers size={22} className="text-indigo-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">No warehouse stock found</p>
                            <p className="text-xs text-slate-500 mt-1">This product hasn't been stocked in any warehouse yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 text-xs">
                                <thead className="bg-slate-50/60">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Boxes</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Units</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-semibond text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {product.inventory.map((inv) => {
                                        const units = inv.itemQuantity + (inv.boxQuantity * (product.boxSize || 0));
                                        const low = product.minStockLevel && units <= product.minStockLevel;
                                        return (
                                            <tr key={inv.id} className="hover:bg-indigo-50/20 transition-colors align-middle">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs font-semibold text-slate-900">
                                                        {inv.warehouse?.name ?? <span className="text-slate-400 italic">Unknown</span>}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                                    {inv.warehouse?.location ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {inv.itemQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    {inv.boxQuantity > 0
                                                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">{inv.boxQuantity}</span>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span className="text-xs font-bold text-slate-900">{units}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                                    {new Date(inv.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wide ${low ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {low ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProductDetails;
