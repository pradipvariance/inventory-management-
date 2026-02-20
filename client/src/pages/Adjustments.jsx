import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, ChevronDown } from 'lucide-react';

const Adjustments = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [type, setType] = useState('CREDIT');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [product, setProduct] = useState('');
    const [warehouse, setWarehouse] = useState('');
    const [itemQuantity, setItemQuantity] = useState(0);
    const [boxQuantity, setBoxQuantity] = useState(0);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [aRes, pRes, wRes] = await Promise.all([
                axios.get('http://localhost:5000/api/adjustments', config),
                axios.get('http://localhost:5000/api/products', config),
                axios.get('http://localhost:5000/api/warehouses', config),
            ]);
            setAdjustments(aRes.data);
            setProducts(pRes.data.products);
            setWarehouses(wRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/adjustments', {
                type,
                amount: parseFloat(amount),
                reason,
                productId: product || undefined,
                warehouseId: warehouse || undefined,
                itemQuantity: parseInt(itemQuantity),
                boxQuantity: parseInt(boxQuantity),
            }, { headers: { Authorization: `Bearer ${token}` } });

            setSuccess('Adjustment recorded successfully!');
            setAmount('');
            setReason('');
            setProduct('');
            setWarehouse('');
            setItemQuantity(0);
            setBoxQuantity(0);
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Adjustment failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-white animate-fade-in">
            {/* Header */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <FileText size={20} className="text-indigo-600" strokeWidth={2} />
                                </div>
                                Adjustments
                            </h1>
                            <p className="text-xs text-indigo-800 font-medium mt-0.5 ml-11">Create and review stock adjustment records.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
                <div className="flex flex-col gap-5">

                    {/* Form Card */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText size={18} className="text-indigo-600" strokeWidth={2} />
                                Create Adjustment
                            </h2>
                            <p className="text-xs text-slate-700 mt-0.5">Record a credit or debit adjustment.</p>
                        </div>

                        <div className="p-4">
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs font-medium mb-3 flex items-center gap-2 animate-fade-in">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs font-medium mb-3 flex items-center gap-2 animate-fade-in">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">

                                {/* Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Type</label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none block w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                            value={type}
                                            onChange={e => setType(e.target.value)}
                                        >
                                            <option value="CREDIT">Credit (In)</option>
                                            <option value="DEBIT">Debit (Out)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                            <ChevronDown size={15} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Amount ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold pointer-events-none">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            className="block w-full pl-6 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none text-sm text-slate-900 transition-all"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Product */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Product</label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none block w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                            value={product}
                                            onChange={e => setProduct(e.target.value)}
                                        >
                                            <option value="">Select product...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                            <ChevronDown size={15} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Warehouse</label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none block w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                            value={warehouse}
                                            onChange={e => setWarehouse(e.target.value)}
                                        >
                                            <option value="">Select warehouse...</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                            <ChevronDown size={15} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Item Qty + Box Qty centered */}
                                <div className="sm:col-span-2 lg:col-span-2 flex justify-center gap-8">
                                    <div className="w-28">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Item Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none text-sm text-slate-900 text-center transition-all"
                                            value={itemQuantity}
                                            onChange={e => setItemQuantity(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Box Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none text-sm text-slate-900 text-center transition-all"
                                            value={boxQuantity}
                                            onChange={e => setBoxQuantity(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Reason — full width */}
                                <div className="sm:col-span-2 lg:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Reason</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Brief description of the adjustment..."
                                        className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none text-sm text-slate-900 transition-all"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                    />
                                </div>

                                {/* Submit */}
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25 text-sm"
                                    >
                                        Create Adjustment
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                    {/* History Card */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Adjustment History</h2>
                                <p className="text-xs text-slate-700 mt-0.5">All recorded adjustments and their details.</p>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-lg border border-indigo-100">
                                {adjustments.length} {adjustments.length !== 1 ? 'records' : 'record'}
                            </span>
                        </div>

                        <div>
                            {adjustments.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                                        <FileText size={24} className="text-indigo-500" />
                                    </div>
                                    <p className="text-slate-900 font-semibold text-sm">No adjustments yet</p>
                                    <p className="text-xs text-slate-700 mt-1">Create an adjustment to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                                        <thead className="bg-slate-50/50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Product</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Warehouse</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Items</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Boxes</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {adjustments.map(a => (
                                                <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors align-middle">
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700">
                                                        {new Date(a.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wide ${a.type === 'CREDIT'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                            {a.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-900 font-mono">
                                                        ${a.amount}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {a.product ? (
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{a.product.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {a.product.sku}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700">
                                                        {a.warehouse?.name || <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        {a.itemQuantity > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                {a.itemQuantity}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        {a.boxQuantity > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                                                {a.boxQuantity}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-700 truncate max-w-[180px]" title={a.reason}>
                                                        {a.reason}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Adjustments;
