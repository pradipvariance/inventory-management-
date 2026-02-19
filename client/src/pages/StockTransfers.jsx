import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';

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

    if (loading) return <Loader text="Loading Transfers..." />;

    const canApprove = user?.role === 'WAREHOUSE_ADMIN';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
            {/* Transfer Form */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <ArrowRightLeft size={20} />
                    </div>
                    Initiate Stock Transfer
                </h2>

                {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium mb-3 border border-red-100 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{error}</div>}
                {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium mb-3 border border-green-100 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Product</label>
                        <select required className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-900 transition-all" value={product} onChange={e => setProduct(e.target.value)}>
                            <option value="">Select Product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">From Warehouse</label>
                            <select required className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-900 transition-all" value={fromWarehouse} onChange={e => setFromWarehouse(e.target.value)}>
                                <option value="">Select Source...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">To Warehouse</label>
                            <select required className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-900 transition-all" value={toWarehouse} onChange={e => setToWarehouse(e.target.value)}>
                                <option value="">Select Destination...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Item Quantity</label>
                            <input type="number" min="0" className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 transition-all" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Box Quantity</label>
                            <input type="number" min="0" className="block w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 transition-all" value={boxQuantity} onChange={e => setBoxQuantity(e.target.value)} />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-sm mt-2 active:scale-95">
                        Request Transfer
                    </button>
                </form>
            </div>

            {/* Transfer History */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit max-h-[600px] overflow-hidden flex flex-col">
                <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center justify-between">
                    Transfer History
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">{transfers.length} request{transfers.length !== 1 ? 's' : ''}</span>
                </h2>

                <div className="overflow-y-auto pr-1 custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Product</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Route</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                                <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Status</th>
                                {canApprove && <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transfers.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                        {t.product.name}
                                        <span className="block text-xs text-gray-400 font-normal">{t.product.sku}</span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-700">{t.fromWarehouse.name}</span>
                                            <span className="text-gray-400 rotate-90 w-fit ml-1">↓</span>
                                            <span className="font-medium text-gray-700">{t.toWarehouse.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-gray-900 font-medium">
                                        {t.itemQuantity > 0 && <span className="block">{t.itemQuantity} Items</span>}
                                        {t.boxQuantity > 0 && <span className="block text-xs text-gray-500">{t.boxQuantity} Boxes</span>}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border uppercase tracking-wide ${t.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                t.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    {canApprove && (
                                        <td className="px-3 py-3 text-center">
                                            {t.status === 'PENDING' && (
                                                (user.role === 'SUPER_ADMIN' || (user.role === 'WAREHOUSE_ADMIN' && user.warehouseId === t.toWarehouseId)) ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => processTransfer(t.id, 'approve')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Approve">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => processTransfer(t.id, 'reject')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Reject">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : <span className="text-gray-400 text-[10px] italic">Incoming only</span>
                                            )}
                                            {t.status !== 'PENDING' && <span className="text-gray-300">-</span>}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {transfers.length === 0 && (
                                <tr>
                                    <td colSpan={canApprove ? 5 : 4} className="py-10 text-center text-gray-500 text-sm italic">
                                        No stock transfers found.
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

export default StockTransfers;
