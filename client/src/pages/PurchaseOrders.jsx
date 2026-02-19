import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, FileText, CheckCircle, Truck, XCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const PurchaseOrders = () => {
    const [pos, setPOs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { user } = useContext(AuthContext);

    // Form State
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
                // Only fetch suppliers/warehouses if needed for creation (Admin/Manager)
                // But for simplicity, we fetch mostly everything. 
                axios.get('http://localhost:5000/api/suppliers', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:5000/api/warehouses', config).catch(() => ({ data: [] })),
                axios.get('http://localhost:5000/api/products', config).catch(() => ({ data: { products: [] } }))
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

    if (loading) return <div>Loading...</div>;

    const canCreate = ['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'].includes(user?.role);
    const isSupplier = user?.role === 'SUPPLIER';

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

            {/* Purchase Orders Table - Compact View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-4 overflow-hidden animate-fade-in-up">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            <th className="px-4 py-3">Order ID</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Supplier</th>
                            <th className="px-4 py-3">Warehouse</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3">Items</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {pos.map((po, index) => (
                            <tr key={po.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                                    #{po.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                    {new Date(po.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-gray-900 font-medium truncate max-w-[140px]" title={po.supplier?.name}>
                                    {po.supplier?.name || 'Unknown'}
                                </td>
                                <td className="px-4 py-2 text-gray-900 truncate max-w-[140px]" title={po.warehouse?.name}>
                                    {po.warehouse?.name || 'N/A'}
                                </td>
                                <td className={`px-4 py-2 font-medium whitespace-nowrap ${new Date(po.deliveryDate) < new Date() && po.status !== 'RECEIVED' ? 'text-red-500' : 'text-gray-700'}`}>
                                    {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${po.status === 'RECEIVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            po.status === 'DELIVERED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                po.status === 'CONFIRMED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    po.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="text-xs text-gray-500 font-medium">
                                        {po.items.length} Item{po.items.length !== 1 ? 's' : ''}
                                        <span className="text-gray-400 font-normal ml-1">({po.items.reduce((acc, item) => acc + item.quantity, 0)} qty)</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right font-bold text-gray-900 font-mono whitespace-nowrap">
                                    ${po.totalAmount}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center gap-1">
                                        {/* Supplier Actions */}
                                        {isSupplier && po.status === 'PENDING' && (
                                            <button onClick={() => updateStatus(po.id, 'CONFIRMED')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Confirm Order">
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        {isSupplier && po.status === 'CONFIRMED' && (
                                            <button onClick={() => updateStatus(po.id, 'DELIVERED')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Mark Delivered">
                                                <Truck size={16} />
                                            </button>
                                        )}

                                        {/* Admin Actions */}
                                        {canCreate && po.status === 'DELIVERED' && (
                                            <button onClick={() => updateStatus(po.id, 'RECEIVED')} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Receive Stock">
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        {canCreate && (po.status === 'PENDING' || po.status === 'CONFIRMED') && (
                                            <button onClick={() => updateStatus(po.id, 'CANCELLED')} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Cancel Order">
                                                <XCircle size={16} />
                                            </button>
                                        )}

                                        {/* View Only / No Actions */}
                                        {((isSupplier && po.status !== 'PENDING' && po.status !== 'CONFIRMED') ||
                                            (canCreate && po.status !== 'DELIVERED' && po.status !== 'PENDING' && po.status !== 'CONFIRMED') ||
                                            (!isSupplier && !canCreate)) && (
                                                <span className="text-xs text-gray-300">-</span>
                                            )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pos.length === 0 && !loading && (
                    <div className="py-12 text-center">
                        <p className="text-gray-500 text-sm">No purchase orders found.</p>
                        {canCreate && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-3 text-indigo-600 text-sm font-bold hover:underline"
                            >
                                + Create New Order
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Create Purchase Order</h2>
                            <p className="text-gray-500 text-sm mt-1">Order products from suppliers to restock inventory.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Supplier</label>
                                    <select required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Destination Warehouse</label>
                                    <select required className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Delivery Due Date</label>
                                <input type="date" className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900">Order Items</h3>
                                    <button type="button" onClick={handleAddItem} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <Plus size={16} /> Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {poItems.map((item, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 items-start sm:items-center">
                                            <div className="flex-1 w-full">
                                                <select required className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)}>
                                                    <option value="">Select Product...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                <div className="w-24">
                                                    <input type="number" min="1" placeholder="Qty" className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                                </div>
                                                <div className="w-28 relative">
                                                    <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                                    <input type="number" min="0" step="0.01" placeholder="Cost" className="block w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Create Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrders;
