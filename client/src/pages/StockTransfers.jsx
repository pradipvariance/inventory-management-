import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { ArrowRightLeft, Check, X, ChevronDown, ArrowRight, Search } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';
import SearchableCombobox from '../components/SearchableCombobox';

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
    const [unitsPerBox, setUnitsPerBox] = useState('');
    const [itemQuantity, setItemQuantity] = useState(0);
    const [boxQuantity, setBoxQuantity] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Update unitsPerBox when product changes
    useEffect(() => {
        if (product) {
            const selectedProduct = products.find(p => p.id === product);
            if (selectedProduct) {
                setUnitsPerBox(selectedProduct.boxSize || '');
            }
        }
    }, [product, products]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [wRes, pRes, tRes] = await Promise.all([
                axios.get('http://localhost:5000/api/warehouses', config),
                axios.get('http://localhost:5000/api/products?limit=0', config),
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

    // Auto-calculate Box Quantity based on Item Quantity and Units Per Box
    useEffect(() => {
        const units = parseInt(unitsPerBox);
        if (itemQuantity && units > 0) {
            const calculatedBoxes = Math.floor(parseInt(itemQuantity) / units);
            setBoxQuantity(calculatedBoxes);
        }
    }, [itemQuantity, unitsPerBox]);

    const processTransfer = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/transfers/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
            setSuccess(`Transfer ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error processing transfer');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!product) { setError('Please select a product'); return; }
        if (!fromWarehouse) { setError('Please select source warehouse'); return; }
        if (!toWarehouse) { setError('Please select destination warehouse'); return; }
        if (parseInt(itemQuantity) <= 0) { setError('Please enter a valid quantity'); return; }

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
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Transfer failed');
        }
    };

    if (loading) return <Loader text="Loading Transfers..." />;

    const canApprove = user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'SUPER_ADMIN';
    const selectedProduct = products.find(p => p.id === product);

    return (
        <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stock Transfers</h1>
                    <p className="text-gray-500 mt-1">Manage and track inventory movement between warehouses.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Initiation Form */}
                <div className="space-y-6 flex flex-col h-full">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <ArrowRightLeft size={20} strokeWidth={2.5} />
                            </div>
                            Initiate Transfer
                        </h2>

                        {error && (
                            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-medium mb-6 border border-rose-100 flex items-center gap-3 animate-shake">
                                <X size={18} className="text-rose-500" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-medium mb-6 border border-emerald-100 flex items-center gap-3 animate-fade-in">
                                <Check size={18} className="text-emerald-500" />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Product</label>
                                    <SearchableCombobox
                                        placeholder="Search for a product..."
                                        options={products.map(p => ({
                                            value: p.id,
                                            label: p.name,
                                            subLabel: `SKU: ${p.sku}`
                                        }))}
                                        value={product}
                                        onChange={(val) => setProduct(val)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From Warehouse</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                                value={fromWarehouse}
                                                onChange={e => {
                                                    setFromWarehouse(e.target.value);
                                                    if (e.target.value === toWarehouse) setToWarehouse('');
                                                }}
                                            >
                                                <option value="">Select source...</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                                <ChevronDown size={16} className="text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">To Warehouse</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className={`appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer ${!fromWarehouse ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : 'bg-slate-50'
                                                    }`}
                                                value={toWarehouse}
                                                onChange={e => setToWarehouse(e.target.value)}
                                                disabled={!fromWarehouse}
                                            >
                                                <option value="">Select destination...</option>
                                                {warehouses
                                                    .filter(w => w.id !== fromWarehouse)
                                                    .map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                                                }
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                                <ChevronDown size={16} className="text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Item Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 font-semibold transition-all"
                                            value={itemQuantity}
                                            onChange={e => setItemQuantity(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Box Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 font-semibold transition-all"
                                            value={boxQuantity}
                                            onChange={e => setBoxQuantity(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] mt-4"
                            >
                                Send Transfer Request
                            </button>
                        </form>
                    </div>

                    {/* Selected Product Details */}
                    {selectedProduct && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Product Context</h3>
                            <div className="flex items-start gap-4">
                                {selectedProduct.image ? (
                                    <img
                                        src={`/${selectedProduct.image}`}
                                        alt={selectedProduct.name}
                                        className="h-16 w-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                        <ArrowRightLeft size={24} className="text-indigo-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 truncate">{selectedProduct.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {selectedProduct.sku}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Box Size</p>
                                            <p className="text-sm font-semibold text-slate-700">{selectedProduct.boxSize ? `${selectedProduct.boxSize} per box` : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Price</p>
                                            <p className="text-sm font-bold text-indigo-600">${selectedProduct.amount || '0.00'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Transfer History */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Transfer History</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Recent stock movement requests.</p>
                        </div>
                        <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">{transfers.length} Total</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {transfers.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <ArrowRightLeft size={28} className="text-slate-300" />
                                </div>
                                <p className="text-slate-900 font-bold">No transfers found</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Initiate a transfer request from the form to see history here.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Route</th>
                                        <th className="px-5 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        {canApprove && <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {transfers.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{t.product.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-0.5">SKU: {t.product.sku}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-semibold text-slate-700">{t.fromWarehouse.name}</span>
                                                    <div className="flex items-center gap-1.5 py-0.5">
                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                        <ArrowRight size={10} className="text-indigo-400" />
                                                        <div className="h-px bg-slate-200 flex-1"></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700">{t.toWarehouse.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-bold text-slate-900">{t.itemQuantity} items</span>
                                                    {t.boxQuantity > 0 && <span className="text-[10px] text-slate-400">{t.boxQuantity} boxes</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        t.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            {canApprove && (
                                                <td className="px-5 py-4 whitespace-nowrap text-right">
                                                    {t.status === 'PENDING' && (
                                                        (user.role === 'SUPER_ADMIN' || (user.role === 'WAREHOUSE_ADMIN' && user.warehouseId === t.toWarehouseId)) ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => processTransfer(t.id, 'approve')}
                                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                    title="Approve"
                                                                >
                                                                    <Check size={16} strokeWidth={2.5} />
                                                                </button>
                                                                <button
                                                                    onClick={() => processTransfer(t.id, 'reject')}
                                                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                                    title="Reject"
                                                                >
                                                                    <X size={16} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end opacity-40">
                                                                <span className="text-[10px] font-bold text-slate-400 italic">Incoming</span>
                                                                <span className="text-[9px] text-slate-300">Wait for {t.toWarehouse.name}</span>
                                                            </div>
                                                        )
                                                    )}
                                                    {t.status !== 'PENDING' && (
                                                        <span className="text-slate-300 italic text-[10px]">Processed</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockTransfers;
