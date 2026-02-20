import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Warehouse, Layers, MapPin, Maximize2, AlertTriangle, Plus, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';

const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm text-slate-900 font-medium transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

const WarehouseDetails = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [warehouse, setWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);
    const [formData, setFormData] = useState({ name: '', location: '', capacity: 0 });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Adjust modal
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adjData, setAdjData] = useState({ type: 'DELETE_SPECIFIC', quantity: '', reason: '' });
    const [adjSaving, setAdjSaving] = useState(false);

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const fetchWarehouse = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://localhost:5000/api/warehouses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouse(data);
            setFormData({ name: data.name, location: data.location, capacity: data.capacity });
        } catch (err) {
            console.error(err);
            navigate('/warehouses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWarehouse(); }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveMsg(null);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`http://localhost:5000/api/warehouses/${id}`, {
                ...formData,
                capacity: parseInt(formData.capacity)
            }, { headers: { Authorization: `Bearer ${token}` } });
            setWarehouse(data);
            setSaveMsg({ type: 'success', text: 'Warehouse updated successfully.' });
        } catch (err) {
            setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Error updating warehouse.' });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3500);
        }
    };

    const handleAdjustment = async (e) => {
        e.preventDefault();
        setAdjSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/inventory/adjust', {
                productId: selectedItem.productId,
                warehouseId: id,
                ...adjData
            }, { headers: { Authorization: `Bearer ${token}` } });
            setShowAdjustModal(false);
            setAdjData({ type: 'DELETE_SPECIFIC', quantity: '', reason: '' });
            await fetchWarehouse();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adjusting inventory');
        } finally {
            setAdjSaving(false);
        }
    };

    if (loading) return <Loader text="Loading Warehouse Details..." />;
    if (!warehouse) return <div className="p-8 text-slate-500">Warehouse not found.</div>;

    const usage = warehouse.usage;
    const usagePct = usage ? Math.min(100, (usage.used / usage.capacity) * 100) : 0;
    const isCritical = usage && usage.available === 0;
    const isWarning = usage && usage.available > 0 && usagePct > 80;

    const inventory = warehouse.inventory || [];
    const totalPages = Math.ceil(inventory.length / itemsPerPage);
    const pageItems = inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const maxAdjQty = selectedItem
        ? selectedItem.itemQuantity + (selectedItem.boxQuantity * (selectedItem.product?.boxSize || 0))
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in">

            {/* ── Page header ── */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/warehouses')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                        <ArrowLeft size={13} /> Warehouses
                    </button>
                    <div className="h-5 w-px bg-indigo-200 shrink-0" />
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                            <Warehouse size={17} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-slate-900 truncate">{warehouse.name}</h1>
                            <p className="text-xs text-indigo-700 font-medium">Edit details · review inventory</p>
                        </div>
                    </div>

                    {/* Quick stat chips */}
                    {usage && (
                        <div className="ml-auto hidden sm:flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                                <Layers size={11} />{usage.used} / {usage.capacity}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : isWarning ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                <Maximize2 size={11} />{Math.round(usagePct)}% full
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">

                {/* ── Edit form card ── */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Warehouse size={15} className="text-indigo-600" />
                                Warehouse Information
                            </h2>
                            <p className="text-xs text-slate-600 mt-0.5">Update warehouse name, location, and capacity.</p>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    <Warehouse size={10} className="inline mr-1" /> Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={set('name')}
                                    className={inputCls}
                                    required
                                    disabled={!isSuperAdmin}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    <MapPin size={10} className="inline mr-1" /> Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={set('location')}
                                    className={inputCls}
                                    required
                                    disabled={!isSuperAdmin}
                                />
                            </div>

                            {/* Capacity + usage bar */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    <Maximize2 size={10} className="inline mr-1" /> Capacity
                                </label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={set('capacity')}
                                    className={`${inputCls} max-w-xs`}
                                    required
                                    disabled={!isSuperAdmin}
                                />
                                {usage && (
                                    <div className="mt-3 max-w-xs">
                                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                                            <span className="text-slate-600">Used: <span className="text-slate-900">{usage.used}</span></span>
                                            <span className={isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}>
                                                Available: {usage.available}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-indigo-500'}`}
                                                style={{ width: `${usagePct}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">{Math.round(usagePct)}% of capacity in use</p>
                                    </div>
                                )}
                            </div>

                            {saveMsg && (
                                <div className={`sm:col-span-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${saveMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${saveMsg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    {saveMsg.text}
                                </div>
                            )}
                        </div>

                        {isSuperAdmin && (
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
                        )}
                    </div>
                </form>

                {/* ── Inventory card ── */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Layers size={15} className="text-indigo-600" />
                                Current Inventory
                            </h2>
                            <p className="text-xs text-slate-600 mt-0.5">Products currently stocked in this warehouse.</p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                            {inventory.length} {inventory.length !== 1 ? 'products' : 'product'}
                        </span>
                    </div>

                    {inventory.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                                <Layers size={22} className="text-indigo-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">No inventory yet</p>
                            <p className="text-xs text-slate-500 mt-1">No products have been stocked in this warehouse.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-xs">
                                    <thead className="bg-slate-50/60">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Boxes</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                                            {isSuperAdmin && (
                                                <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {pageItems.map((item) => {
                                            const total = item.itemQuantity + (item.boxQuantity * (item.product?.boxSize || 0));
                                            return (
                                                <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors align-middle">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="text-xs font-semibold text-slate-900">{item.product?.name || 'Unknown'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-[10px] font-mono text-slate-500">
                                                        {item.product?.sku || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            {item.itemQuantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        {item.boxQuantity > 0
                                                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">{item.boxQuantity}</span>
                                                            : <span className="text-slate-300">—</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        <span className="text-xs font-bold text-slate-900">{total}</span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                                        {new Date(item.updatedAt).toLocaleDateString()}
                                                    </td>
                                                    {isSuperAdmin && (
                                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => { setSelectedItem(item); setShowAdjustModal(true); }}
                                                                className="text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-200 hover:border-indigo-600 transition-all"
                                                            >
                                                                Adjust
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>–<strong>{Math.min(currentPage * itemsPerPage, inventory.length)}</strong> of <strong>{inventory.length}</strong>
                                    </span>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft size={15} className="text-slate-600" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight size={15} className="text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Adjust modal ── */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in border border-slate-200">
                        {/* Modal header */}
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/60 to-orange-50/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-rose-500" />
                                    Adjust Inventory
                                </h2>
                                <p className="text-xs text-slate-600 mt-0.5 truncate max-w-[280px]">{selectedItem?.product?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowAdjustModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustment} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Adjustment Type</label>
                                <select
                                    className="appearance-none w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none text-sm text-slate-900 font-medium transition-all"
                                    value={adjData.type}
                                    onChange={(e) => setAdjData({ ...adjData, type: e.target.value })}
                                >
                                    <option value="DELETE_SPECIFIC">Remove Specific Quantity</option>
                                    <option value="DELETE_ALL">Remove All Stock</option>
                                </select>
                            </div>

                            {adjData.type === 'DELETE_SPECIFIC' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                        Quantity to Remove <span className="normal-case text-slate-400 font-normal">(max: {maxAdjQty})</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={maxAdjQty}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none text-sm text-slate-900 font-medium transition-all"
                                        value={adjData.quantity}
                                        onChange={(e) => setAdjData({ ...adjData, quantity: e.target.value })}
                                        placeholder={`1 – ${maxAdjQty}`}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none text-sm text-slate-900 font-medium transition-all resize-none"
                                    value={adjData.reason}
                                    onChange={(e) => setAdjData({ ...adjData, reason: e.target.value })}
                                    placeholder="e.g. Damaged items, inventory audit…"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjSaving}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/20 disabled:opacity-60"
                                >
                                    {adjSaving
                                        ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Adjusting…</>
                                        : 'Confirm Adjustment'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseDetails;
