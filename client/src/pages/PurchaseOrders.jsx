import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, CheckCircle, Truck, XCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';

const PurchaseOrders = () => {
    const [pos, setPOs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { user } = useContext(AuthContext);

    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [poItems, setPoItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [poRes, sRes, wRes, pRes] = await Promise.all([
                axios.get('http://localhost:5000/api/purchase-orders', config),
                axios.get('http://localhost:5000/api/suppliers', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:5000/api/warehouses', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:5000/api/products?limit=0', config).catch(() => ({ data: { products: [] } }))
            ]);

            setPOs(Array.isArray(poRes.data) ? poRes.data : []);
            setSuppliers(Array.isArray(sRes.data) ? sRes.data : []);
            setWarehouses(Array.isArray(wRes.data) ? wRes.data : []);
            setProducts(pRes.data?.products || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/purchase-orders/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleAddItem = () => {
        setPoItems([...poItems, { productId: '', quantity: 1, unitCost: 0 }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...poItems];
        newItems[index][field] = value;
        setPoItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/purchase-orders', {
                supplierId: selectedSupplier,
                warehouseId: selectedWarehouse,
                deliveryDate,
                items: poItems.map(item => ({
                    ...item,
                    quantity: parseInt(item.quantity),
                    unitCost: parseFloat(item.unitCost)
                }))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setPoItems([{ productId: '', quantity: 1, unitCost: 0 }]);
            setSelectedSupplier('');
            setSelectedWarehouse('');
            setDeliveryDate('');
            fetchData();
        } catch (error) {
            console.error('Error creating PO:', error);
            alert(error.response?.data?.message || 'Error creating PO');
        }
    };

    if (loading) return <Loader text="Loading purchase orders..." />;

    const canCreate = ['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'].includes(user?.role);
    const isSupplier = user?.role === 'SUPPLIER';

    const getStatusClass = (status) => {
        switch (status) {
            case 'RECEIVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'DELIVERED': return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'CONFIRMED': return 'bg-violet-50 text-violet-700 border-violet-200';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Purchase Orders</h1>
                    <p className="text-gray-500 mt-1">Manage and track your purchase orders.</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={20} /> Create Order
                    </button>
                )}
            </div>


            {/* Content - same layout as Inventory / Products */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="hide-scrollbar-x">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {pos.map((po) => (
                                    <tr key={po.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className="text-xs font-mono font-semibold text-slate-900">#{po.id.slice(0, 6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                                            {new Date(po.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-slate-900 truncate max-w-[100px]" title={po.supplier?.name}>
                                            {po.supplier?.name || '—'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600 truncate max-w-[100px]" title={po.warehouse?.name}>
                                            {user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_ADMIN' ? (
                                                <Link to={`/warehouses/${po.warehouse?.id}`} className="hover:text-indigo-600 transition-colors">
                                                    {po.warehouse?.name || '—'}
                                                </Link>
                                            ) : (
                                                <span>{po.warehouse?.name || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                                            <span className={new Date(po.deliveryDate) < new Date() && po.status !== 'RECEIVED' ? 'text-rose-600' : 'text-slate-700'}>
                                                {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${getStatusClass(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                                            <span className="font-medium">{po.items?.length || 0}</span>
                                            <span className="text-slate-400 ml-1">({po.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0})</span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-indigo-600 text-right">
                                            ${po.totalAmount}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center w-20">
                                            <div className="flex justify-center gap-0.5">
                                                {isSupplier && po.status === 'PENDING' && (
                                                    <button onClick={() => updateStatus(po.id, 'CONFIRMED')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Confirm order">
                                                        <CheckCircle size={16} strokeWidth={2} />
                                                    </button>
                                                )}
                                                {isSupplier && po.status === 'CONFIRMED' && (
                                                    <button onClick={() => updateStatus(po.id, 'DELIVERED')} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Mark delivered">
                                                        <Truck size={16} strokeWidth={2} />
                                                    </button>
                                                )}
                                                {canCreate && po.status === 'DELIVERED' && (
                                                    <button onClick={() => updateStatus(po.id, 'RECEIVED')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Receive stock">
                                                        <CheckCircle size={16} strokeWidth={2} />
                                                    </button>
                                                )}
                                                {canCreate && (po.status === 'PENDING' || po.status === 'CONFIRMED') && (
                                                    <button onClick={() => updateStatus(po.id, 'CANCELLED')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Cancel order">
                                                        <XCircle size={16} strokeWidth={2} />
                                                    </button>
                                                )}
                                                {((isSupplier && !['PENDING', 'CONFIRMED'].includes(po.status)) ||
                                                    (canCreate && !['DELIVERED', 'PENDING', 'CONFIRMED'].includes(po.status)) ||
                                                    (!isSupplier && !canCreate)) && (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pos.length === 0 && !loading && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <FileText size={28} className="text-indigo-500" />
                            </div>
                            <p className="text-slate-900 font-semibold">No purchase orders found</p>
                            <p className="text-sm text-slate-500 mt-1">Create an order to get started.</p>
                            {canCreate && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    Create order
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create order modal - same style as Products modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-slate-200 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            aria-label="Close"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Create purchase order</h2>
                            <p className="text-slate-500 text-sm mt-0.5">Order products from suppliers to restock inventory.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Supplier</label>
                                    <select
                                        required
                                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900 transition-all"
                                        value={selectedSupplier}
                                        onChange={e => setSelectedSupplier(e.target.value)}
                                    >
                                        <option value="">Select supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse</label>
                                    <select
                                        required
                                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900 transition-all"
                                        value={selectedWarehouse}
                                        onChange={e => setSelectedWarehouse(e.target.value)}
                                    >
                                        <option value="">Select warehouse</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Delivery due date</label>
                                <input
                                    type="date"
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900 transition-all"
                                    value={deliveryDate}
                                    onChange={e => setDeliveryDate(e.target.value)}
                                />
                            </div>

                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-slate-900">Order items</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={16} strokeWidth={2} /> Add item
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {poItems.map((item, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 items-start sm:items-center">
                                            <div className="flex-1 w-full">
                                                <select
                                                    required
                                                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-900"
                                                    value={item.productId}
                                                    onChange={e => handleItemChange(index, 'productId', e.target.value)}
                                                >
                                                    <option value="">Select product</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                <div className="w-24">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Qty"
                                                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-900"
                                                        value={item.quantity}
                                                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-28 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Cost"
                                                        className="block w-full pl-6 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-900"
                                                        value={item.unitCost}
                                                        onChange={e => handleItemChange(index, 'unitCost', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25"
                                >
                                    Create order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrders;
