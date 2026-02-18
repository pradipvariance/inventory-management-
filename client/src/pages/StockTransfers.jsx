import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const StockTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    // Form state
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [product, setProduct] = useState('');
    const [itemQuantity, setItemQuantity] = useState(0);
    const [boxQuantity, setBoxQuantity] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [wRes, pRes, tRes] = await Promise.all([
                axios.get('http://localhost:5000/api/warehouses', config),
                axios.get('http://localhost:5000/api/products', config),
                axios.get('http://localhost:5000/api/transfers', config)
            ]);

            setWarehouses(wRes.data);
            setProducts(pRes.data.products);
            setTransfers(tRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const processTransfer = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/transfers/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert('Error processing transfer');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/transfers', {
                productId: product,
                fromWarehouseId: fromWarehouse,
                toWarehouseId: toWarehouse,
                itemQuantity: parseInt(itemQuantity),
                boxQuantity: parseInt(boxQuantity)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Transfer initiated successfully!');
            setFromWarehouse('');
            setToWarehouse('');
            setProduct('');
            setItemQuantity(0);
            setBoxQuantity(0);
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Transfer failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    const canApprove = user?.role === 'WAREHOUSE_ADMIN';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transfer Form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ArrowRightLeft /> Initiate Stock Transfer
                </h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select required className="mt-1 block w-full border p-2 rounded-md" value={product} onChange={e => setProduct(e.target.value)}>
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">From Warehouse</label>
                            <select required className="mt-1 block w-full border p-2 rounded-md" value={fromWarehouse} onChange={e => setFromWarehouse(e.target.value)}>
                                <option value="">Select Source</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">To Warehouse</label>
                            <select required className="mt-1 block w-full border p-2 rounded-md" value={toWarehouse} onChange={e => setToWarehouse(e.target.value)}>
                                <option value="">Select Destination</option>
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

                    <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 mt-4">
                        Request Transfer
                    </button>
                </form>
            </div>

            {/* Transfer History */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Transfer History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">From &rarr; To</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                {canApprove && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transfers.map(t => (
                                <tr key={t.id}>
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{t.product.name}</td>
                                    <td className="px-3 py-2 text-sm text-gray-500">{t.fromWarehouse.name} &rarr; {t.toWarehouse.name}</td>
                                    <td className="px-3 py-2 text-sm text-gray-900">
                                        {t.itemQuantity > 0 && `${t.itemQuantity} Items `}
                                        {t.boxQuantity > 0 && `${t.boxQuantity} Boxes`}
                                    </td>
                                    <td className="px-3 py-2 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            t.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    {canApprove && (
                                        <td className="px-3 py-2 text-sm">
                                            {t.status === 'PENDING' && (
                                                (user.role === 'SUPER_ADMIN' || (user.role === 'WAREHOUSE_ADMIN' && user.warehouseId === t.toWarehouseId)) ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => processTransfer(t.id, 'approve')} className="text-green-600 hover:text-green-800" title="Approve"><Check size={18} /></button>
                                                        <button onClick={() => processTransfer(t.id, 'reject')} className="text-red-600 hover:text-red-800" title="Reject"><X size={18} /></button>
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs italic">Incoming only</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockTransfers;
