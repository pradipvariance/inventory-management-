import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { ArrowRightLeft, Check, X, ChevronDown, ArrowRight, Search } from 'lucide-react';
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

    // Product dropdown state
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const productDropdownRef = useRef(null);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(e.target)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                            <p className="text-xs text-indigo-800 font-medium mt-0.5 ml-11">Initiate and manage stock transfers between warehouses.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
                <div className="flex flex-col gap-5">
                    {/* Transfer Form */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ArrowRightLeft size={18} className="text-indigo-600" strokeWidth={2} />
                                Initiate Stock Transfer
                            </h2>
                            <p className="text-xs text-slate-700 mt-0.5">Request a transfer between warehouses.</p>
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

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                                {/* Product */}
                                <div className="sm:col-span-2 lg:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Product</label>
                                    <div className="relative" ref={productDropdownRef}>
                                        {/* Custom Product Dropdown - always opens downward */}
                                        <div
                                            className={`flex items-center w-full px-3 py-2.5 pr-10 bg-gradient-to-br from-white to-slate-50 border-2 rounded-xl cursor-pointer transition-all duration-200 shadow-sm ${showProductDropdown ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-400'
                                                }`}
                                            onClick={() => setShowProductDropdown(v => !v)}
                                        >
                                            <span className={`text-sm font-medium flex-1 truncate ${product ? 'text-slate-900' : 'text-slate-400'
                                                }`}>
                                                {product ? (products.find(p => p.id === product)?.name + ' (' + products.find(p => p.id === product)?.sku + ')') : 'Select Product...'}
                                            </span>
                                            <ChevronDown size={18} className={`text-indigo-500 transition-transform duration-200 flex-shrink-0 ${showProductDropdown ? 'rotate-180' : ''}`} />
                                        </div>
                                        {/* Dropdown panel - always below */}
                                        {showProductDropdown && (
                                            <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                                <div className="p-2 border-b border-slate-100">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            placeholder="Search product..."
                                                            value={productSearch}
                                                            onChange={e => setProductSearch(e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredProducts.length === 0 ? (
                                                        <div className="px-3 py-3 text-xs text-slate-400 text-center">No products found</div>
                                                    ) : (
                                                        filteredProducts.map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-slate-50 last:border-0 ${product === p.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                                                                    }`}
                                                                onClick={() => {
                                                                    setProduct(p.id);
                                                                    setProductSearch('');
                                                                    setShowProductDropdown(false);
                                                                }}
                                                            >
                                                                <div className="font-medium">{p.name}</div>
                                                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {p.sku}</div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* Hidden input for form validation */}
                                        <input type="text" required value={product} onChange={() => { }} className="sr-only" />
                                    </div>
                                </div>

                                {/* Source Warehouse */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Source Warehouse</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="appearance-none block w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                            value={fromWarehouse}
                                            onChange={e => setFromWarehouse(e.target.value)}
                                        >
                                            <option value="">Select source...</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown size={16} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Destination Warehouse */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Destination Warehouse</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="appearance-none block w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all cursor-pointer"
                                            value={toWarehouse}
                                            onChange={e => setToWarehouse(e.target.value)}
                                        >
                                            <option value="">Select destination...</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown size={16} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Item Qty + Box Qty — aligned with submit */}
                                <div className="sm:col-span-1 lg:col-span-2 flex justify-center gap-8">
                                    <div className="w-36">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Item Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none text-sm text-slate-900 text-center transition-all"
                                            value={itemQuantity}
                                            onChange={e => setItemQuantity(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-36">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Box Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none text-sm text-slate-900 text-center transition-all"
                                            value={boxQuantity}
                                            onChange={e => setBoxQuantity(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Submit — same row as qty fields */}
                                <div className="sm:col-span-1 lg:col-span-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25 text-sm"
                                    >
                                        Request Transfer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Transfer History */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Transfer History</h2>
                                <p className="text-xs text-slate-700 mt-0.5">View all transfer requests and their status.</p>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-lg border border-indigo-100">
                                {transfers.length} {transfers.length !== 1 ? 'requests' : 'request'}
                            </span>
                        </div>

                        <div>
                            {transfers.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                                        <ArrowRightLeft size={24} className="text-indigo-500" />
                                    </div>
                                    <p className="text-slate-900 font-semibold text-sm">No transfers found</p>
                                    <p className="text-xs text-slate-700 mt-1">Initiate a transfer to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                                        <thead className="bg-slate-50/50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">From</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">To</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Boxes</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                {canApprove && (
                                                    <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {transfers.map(t => (
                                                <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors align-middle">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">{t.product.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {t.product.sku}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="text-xs font-medium text-slate-700">{t.fromWarehouse.name}</span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <ArrowRight size={12} className="text-indigo-400 flex-shrink-0" strokeWidth={2.5} />
                                                            <span className="text-xs font-medium text-slate-700">{t.toWarehouse.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        {t.itemQuantity > 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                {t.itemQuantity}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
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
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wide ${t.status === 'COMPLETED'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : t.status === 'REJECTED'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    {canApprove && (
                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                                            {t.status === 'PENDING' && (
                                                                (user.role === 'SUPER_ADMIN' || (user.role === 'WAREHOUSE_ADMIN' && user.warehouseId === t.toWarehouseId)) ? (
                                                                    <div className="flex justify-end gap-1">
                                                                        <button
                                                                            onClick={() => processTransfer(t.id, 'approve')}
                                                                            className="p-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors"
                                                                            title="Approve"
                                                                        >
                                                                            <Check size={14} strokeWidth={2} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => processTransfer(t.id, 'reject')}
                                                                            className="p-1 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 transition-colors"
                                                                            title="Reject"
                                                                        >
                                                                            <X size={14} strokeWidth={2} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 text-[10px] italic">Incoming</span>
                                                                )
                                                            )}
                                                            {t.status !== 'PENDING' && (
                                                                <span className="text-slate-300 text-xs">—</span>
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

                        {/* Selected Product Details */}
                        {selectedProduct && (
                            <div className="px-5 py-3 border-t border-slate-100 bg-gradient-to-r from-indigo-50/40 to-violet-50/30">
                                <div className="flex items-start gap-3">
                                    {selectedProduct.image ? (
                                        <img
                                            src={`/${selectedProduct.image}`}
                                            alt={selectedProduct.name}
                                            className="h-12 w-12 object-cover rounded-lg border border-slate-200"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center border border-indigo-200">
                                            <ArrowRightLeft size={20} className="text-indigo-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 mb-1">Selected Product</h3>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                            <div>
                                                <span className="text-slate-500">Name:</span>
                                                <span className="ml-2 font-semibold text-slate-900">{selectedProduct.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">SKU:</span>
                                                <span className="ml-2 font-mono font-semibold text-slate-900">{selectedProduct.sku}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Category:</span>
                                                <span className="ml-2 font-semibold text-slate-900">{selectedProduct.category || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Price:</span>
                                                <span className="ml-2 font-semibold text-indigo-600">${selectedProduct.amount || '0.00'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Unit Type:</span>
                                                <span className="ml-2 font-semibold text-slate-900">{selectedProduct.unitType || 'ITEM'}</span>
                                            </div>
                                            {selectedProduct.boxSize && (
                                                <div>
                                                    <span className="text-slate-500">Box Size:</span>
                                                    <span className="ml-2 font-semibold text-slate-900">{selectedProduct.boxSize} items/box</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockTransfers;
