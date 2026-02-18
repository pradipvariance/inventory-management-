import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, FileText, CheckCircle, Truck } from 'lucide-react';
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

            setPOs(poRes.data);
            setSuppliers(sRes.data);
            setWarehouses(wRes.data);
            setProducts(pRes.data.products || []);
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={20} /> Create PO
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {pos.map(po => (
                    <div key={po.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText size={18} /> PO #{po.id.slice(0, 8)}
                                </h3>
                                <p className="text-gray-600">Supplier: {po.supplier.name}</p>
                                <p className="text-gray-600">Warehouse: {po.warehouse?.name || 'N/A'}</p>
                                <p className="text-gray-500 text-sm">Created: {new Date(po.createdAt).toLocaleDateString()}</p>
                                {po.deliveryDate && <p className="text-gray-500 text-sm">Delivery Due: {new Date(po.deliveryDate).toLocaleDateString()}</p>}
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-indigo-600">${po.totalAmount}</div>
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                        po.status === 'DELIVERED' ? 'bg-blue-100 text-blue-800' :
                                            po.status === 'CONFIRMED' ? 'bg-purple-100 text-purple-800' :
                                                po.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {po.status}
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Items</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                {po.items.map(item => (
                                    <li key={item.id} className="flex justify-between">
                                        <span>{item.product.name} (x{item.quantity})</span>
                                        <span>${item.unitCost} / unit</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="border-t pt-4 mt-4 flex justify-end gap-2">
                            {/* Supplier Actions */}
                            {isSupplier && po.status === 'PENDING' && (
                                <button onClick={() => updateStatus(po.id, 'CONFIRMED')} className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200 border rounded hover:bg-indigo-100 text-sm">Confirm Order</button>
                            )}
                            {isSupplier && po.status === 'CONFIRMED' && (
                                <button onClick={() => updateStatus(po.id, 'DELIVERED')} className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 border rounded hover:bg-blue-100 text-sm flex items-center gap-1"><Truck size={14} /> Mark Delivered</button>
                            )}

                            {/* Admin Actions */}
                            {canCreate && po.status === 'DELIVERED' && (
                                <button onClick={() => updateStatus(po.id, 'RECEIVED')} className="px-3 py-1 bg-green-50 text-green-700 border-green-200 border rounded hover:bg-green-100 text-sm">Receive Stock</button>
                            )}
                            {canCreate && (po.status === 'PENDING' || po.status === 'CONFIRMED') && (
                                <button onClick={() => updateStatus(po.id, 'CANCELLED')} className="px-3 py-1 border text-red-600 hover:bg-red-50 text-sm">Cancel</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                                    <select required className="mt-1 block w-full border p-2 rounded-md" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Destination Warehouse</label>
                                    <select required className="mt-1 block w-full border p-2 rounded-md" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                                <input type="date" className="mt-1 block w-full border p-2 rounded-md" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Items</h3>
                                {poItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <select required className="flex-1 border p-2 rounded-md" value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)}>
                                            <option value="">Product</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input type="number" min="1" placeholder="Qty" className="w-20 border p-2 rounded-md" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                        <input type="number" min="0" step="0.01" placeholder="Cost" className="w-24 border p-2 rounded-md" value={item.unitCost} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} />
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddItem} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Item</button>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrders;
