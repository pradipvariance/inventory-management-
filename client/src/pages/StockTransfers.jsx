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
        <div className="min-h-screen bg-white animate-fade-in">
            {/* Header */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <ArrowRightLeft size={20} className="text-indigo-600" strokeWidth={2} />
                                </div>
                                Stock Transfers
                            </h1>
                            <p className="text-xs text-indigo-800 font-medium mt-0.5 ml-11">Initiate and review stock movement between warehouses.</p>
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
                                <ArrowRightLeft size={18} className="text-indigo-600" strokeWidth={2} />
                                Initiate Transfer
                            </h2>
                            <p className="text-xs text-slate-700 mt-0.5">Move stock between warehouses.</p>
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

                                {/* Product — spans 2 cols */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Product</label>
                                    <SearchableCombobox
                                        placeholder="Search product..."
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

                                {/* From Warehouse */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">From</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="appearance-none block w-full px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                            value={fromWarehouse}
                                            onChange={e => {
                                                setFromWarehouse(e.target.value);
                                                if (e.target.value === toWarehouse) setToWarehouse('');
                                            }}
                                        >
                                            <option value="">Select source...</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                            <ChevronDown size={15} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* To Warehouse */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">To</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className={`appearance-none block w-full px-3 py-2.5 pr-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer ${!fromWarehouse ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : 'bg-white'}`}
                                            value={toWarehouse}
                                            onChange={e => setToWarehouse(e.target.value)}
                                            disabled={!fromWarehouse}
                                        >
                                            <option value="">Select dest...</option>
                                            {warehouses
                                                .filter(w => w.id !== fromWarehouse)
                                                .map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                                            }
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                            <ChevronDown size={15} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Item Qty + Box Qty */}
                                <div className="sm:col-span-2 lg:col-span-2 flex justify-center gap-8">
                                    <div className="w-28">
                                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Item Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
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

                                {/* Submit — full width on its own row */}
                                <div className="sm:col-span-2 lg:col-span-6">
                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25 text-sm"
                                    >
                                        Send Transfer Request
                                    </button>
                                </div>

                            </form>

                            {/* Product context (shown inline below form when a product is selected) */}
                            {selectedProduct && (
                                <div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/30 flex items-start gap-4">
                                    {selectedProduct.image ? (
                                        <img
                                            src={`/${selectedProduct.image}`}
                                            alt={selectedProduct.name}
                                            className="h-12 w-12 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                                            <ArrowRightLeft size={20} className="text-indigo-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest mb-1">Selected Product</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{selectedProduct.name}</p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {selectedProduct.sku}</p>
                                    </div>
                                    <div className="flex gap-6 shrink-0 text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Box Size</p>
                                            <p className="text-sm font-semibold text-slate-700">{selectedProduct.boxSize ? `${selectedProduct.boxSize}/box` : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Price</p>
                                            <p className="text-sm font-bold text-indigo-600">${selectedProduct.amount || '0.00'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Card */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Transfer History</h2>
                                <p className="text-xs text-slate-700 mt-0.5">All stock movement requests and their statuses.</p>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-lg border border-indigo-100">
                                {transfers.length} {transfers.length !== 1 ? 'records' : 'record'}
                            </span>
                        </div>

                        <div>
                            {transfers.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                                        <ArrowRightLeft size={24} className="text-indigo-500" />
                                    </div>
                                    <p className="text-slate-900 font-semibold text-sm">No transfers yet</p>
                                    <p className="text-xs text-slate-700 mt-1">Initiate a transfer above to see history here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                                        <thead className="bg-slate-50/50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Product</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">From</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">To</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Items</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Boxes</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                                {canApprove && <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {transfers.map(t => (
                                                <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors align-middle">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{t.product.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {t.product.sku}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700">{t.fromWarehouse.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-700">{t.toWarehouse.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            {t.itemQuantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        {t.boxQuantity > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                                                                {t.boxQuantity}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wide ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                t.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    {canApprove && (
                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
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
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
export default StockTransfers;
