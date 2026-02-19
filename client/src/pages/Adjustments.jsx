import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';

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

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const payload = {
                type,
                amount: parseFloat(amount),
                reason,
                productId: product || undefined,
                warehouseId: warehouse || undefined,
                itemQuantity: parseInt(itemQuantity),
                boxQuantity: parseInt(boxQuantity)
            };

            await axios.post('http://localhost:5000/api/adjustments', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
            {/* Form Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <FileText size={20} />
                    </div>
                    Create Adjustment
                </h2>

                {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium mb-3 border border-red-100 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{error}</div>}
                {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium mb-3 border border-green-100 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Type</label>
                            <select className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-900 transition-all" value={type} onChange={e => setType(e.target.value)}>
                                <option value="CREDIT">Credit (In)</option>
                                <option value="DEBIT">Debit (Out)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Amount ($)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">$</span>
                                <input type="number" step="0.01" required className="block w-full pl-6 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 transition-all placeholder-gray-400" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Reason</label>
                        <textarea required rows="2" className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 transition-all placeholder-gray-400 resize-none" placeholder="Brief description..." value={reason} onChange={e => setReason(e.target.value)}></textarea>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <h3 className="text-sm font-bold mb-3 text-indigo-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                            Inventory Impact (Optional)
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Product</label>
                                <select className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 transition-all truncate" value={product} onChange={e => setProduct(e.target.value)}>
                                    <option value="">Select Product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Warehouse</label>
                                <select className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 transition-all truncate" value={warehouse} onChange={e => setWarehouse(e.target.value)}>
                                    <option value="">Select Warehouse...</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Item Qty</label>
                                <input type="number" min="0" className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 transition-all" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Box Qty</label>
                                <input type="number" min="0" className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 transition-all" value={boxQuantity} onChange={e => setBoxQuantity(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-sm mt-2 active:scale-95">
                        Create Adjustment Note
                    </button>
                </form>
            </div>

            {/* History Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit max-h-[600px] overflow-hidden flex flex-col">
                <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center justify-between">
                    Recent History
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">{adjustments.length} Records</span>
                </h2>

                <div className="overflow-y-auto pr-1 custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Type</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Amount</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {adjustments.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-3 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border uppercase tracking-wide ${a.type === 'CREDIT' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {a.type.slice(0, 1) === 'C' ? 'CREDIT' : 'DEBIT'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-sm font-bold text-gray-900 font-mono text-right">
                                        ${a.amount}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-gray-600 truncate max-w-[150px]" title={a.reason}>
                                        {a.reason}
                                    </td>
                                </tr>
                            ))}
                            {adjustments.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-10 text-center text-gray-500 text-sm italic">
                                        No adjustments recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Adjustments;
