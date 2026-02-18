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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText /> Create Financial Adjustment
                </h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select className="mt-1 block w-full border p-2 rounded-md" value={type} onChange={e => setType(e.target.value)}>
                            <option value="CREDIT">Credit Note (Return/In)</option>
                            <option value="DEBIT">Debit Note (Charge/Out)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                        <input type="number" step="0.01" required className="mt-1 block w-full border p-2 rounded-md" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <textarea required className="mt-1 block w-full border p-2 rounded-md" value={reason} onChange={e => setReason(e.target.value)}></textarea>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-semibold mb-2 text-gray-600">Inventory Adjustment (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product</label>
                                <select className="mt-1 block w-full border p-2 rounded-md" value={product} onChange={e => setProduct(e.target.value)}>
                                    <option value="">None</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                                <select className="mt-1 block w-full border p-2 rounded-md" value={warehouse} onChange={e => setWarehouse(e.target.value)}>
                                    <option value="">None</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Item Quantity</label>
                                <input type="number" min="0" className="mt-1 block w-full border p-2 rounded-md" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Box Quantity</label>
                                <input type="number" min="0" className="mt-1 block w-full border p-2 rounded-md" value={boxQuantity} onChange={e => setBoxQuantity(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 mt-4">
                        Create Note
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {adjustments.map(a => (
                                <tr key={a.id}>
                                    <td className="px-3 py-2 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                                    <td className="px-3 py-2 text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${a.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {a.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">${a.amount}</td>
                                    <td className="px-3 py-2 text-sm text-gray-500">{a.reason}</td>
                                </tr>
                            ))}
                            {adjustments.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-gray-500">No adjustments recorded.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Adjustments;
