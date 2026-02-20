import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const WarehouseDetails = () => {
    const { user } = useContext(AuthContext);
    const socket = useSocket();
    const { id } = useParams();
    const navigate = useNavigate();
    const [warehouse, setWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 0
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Adjustment Modal State
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adjData, setAdjData] = useState({ type: 'DELETE_SPECIFIC', quantity: '', reason: '' });

    const fetchWarehouse = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://localhost:5000/api/warehouses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouse(data);
            setFormData({
                name: data.name,
                location: data.location,
                capacity: data.capacity
            });
        } catch (error) {
            console.error('Error fetching warehouse details:', error);
            if (!warehouse) { // Only navigate away if it's the initial load
                alert('Failed to fetch warehouse details');
                navigate('/warehouses');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouse();
    }, [id, navigate]);

    useEffect(() => {
        if (!socket) return;

        socket.on('warehouse_updated', (updatedWarehouse) => {
            if (updatedWarehouse.id === id) {
                // If the update came from another user, we refresh our state
                setWarehouse(updatedWarehouse);
            }
        });

        socket.on('warehouse_deleted', (deletedId) => {
            if (deletedId === id) {
                alert('This warehouse has been deleted');
                navigate('/warehouses');
            }
        });

        return () => {
            socket.off('warehouse_updated');
            socket.off('warehouse_deleted');
        };
    }, [socket, id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`http://localhost:5000/api/warehouses/${id}`, {
                ...formData,
                capacity: parseInt(formData.capacity)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouse(data);
            alert('Warehouse updated successfully');
        } catch (error) {
            console.error('Error updating warehouse:', error);
            alert(error.response?.data?.message || 'Error updating warehouse');
        }
    };

    const handleAdjustment = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/inventory/adjust', {
                productId: selectedItem.productId,
                warehouseId: id,
                ...adjData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAdjustModal(false);
            setAdjData({ type: 'DELETE_SPECIFIC', quantity: '', reason: '' });
            // Refresh warehouse data
            const { data } = await axios.get(`http://localhost:5000/api/warehouses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouse(data);
            alert('Inventory adjusted successfully');
        } catch (error) {
            console.error('Error adjusting inventory:', error);
            alert(error.response?.data?.message || 'Error adjusting inventory');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!warehouse) return <div>Warehouse not found</div>;

    return (
        <div className="p-6">
            <button
                onClick={() => navigate('/warehouses')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="mr-2" size={20} />
                Back to Warehouses
            </button>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold mb-6">Warehouse Details</h1>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                                required
                                disabled={user?.role === 'WAREHOUSE_ADMIN'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                                required
                                disabled={user?.role === 'WAREHOUSE_ADMIN'}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                        <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                            required
                            disabled={user?.role === 'WAREHOUSE_ADMIN'}
                        />
                        {warehouse.usage && (
                            <div className="mt-2 text-sm">
                                <div className="flex justify-between text-gray-600 mb-1">
                                    <span>Used: <strong>{warehouse.usage.used}</strong></span>
                                    <span>Available: <strong className="text-green-600">{warehouse.usage.available}</strong></span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full ${warehouse.usage.available === 0 ? 'bg-red-600' : 'bg-indigo-600'}`}
                                        style={{ width: `${Math.min(100, (warehouse.usage.used / warehouse.usage.capacity) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {user?.role !== 'WAREHOUSE_ADMIN' && (
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                            >
                                <Save size={20} /> Update Warehouse
                            </button>
                        </div>
                    )}
                </form>
            </div >

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Current Inventory</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                {user?.role === 'SUPER_ADMIN' && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {warehouse.inventory && warehouse.inventory.length > 0 ? (
                                warehouse.inventory
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.product?.name || 'Unknown Product'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.product?.sku || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.itemQuantity + (item.boxQuantity * (item.product?.boxSize || 0))}
                                                {item.boxQuantity > 0 && (
                                                    <span className="ml-2 text-xs text-slate-400 font-normal">
                                                        ({item.itemQuantity} L, {item.boxQuantity} B)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(item.updatedAt).toLocaleDateString()}
                                            </td>
                                            {user?.role === 'SUPER_ADMIN' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setShowAdjustModal(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Adjust
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No inventory found for this warehouse.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {warehouse.inventory && warehouse.inventory.length > itemsPerPage && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, warehouse.inventory.length)}</span> of <span className="font-medium">{warehouse.inventory.length}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(warehouse.inventory.length / itemsPerPage)))}
                                disabled={currentPage === Math.ceil(warehouse.inventory.length / itemsPerPage)}
                                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Adjustment Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md animate-scale-in border border-slate-200 relative">
                        <button onClick={() => setShowAdjustModal(false)} className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                            <Plus size={24} className="rotate-45" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Adjust Inventory</h2>
                            <p className="text-slate-500 text-sm mt-0.5">{selectedItem?.product?.name}</p>
                        </div>

                        <form onSubmit={handleAdjustment} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Adjustment Type</label>
                                <select
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900"
                                    value={adjData.type}
                                    onChange={(e) => setAdjData({ ...adjData, type: e.target.value })}
                                >
                                    <option value="DELETE_SPECIFIC">Remove Specific Quantity</option>
                                    <option value="DELETE_ALL">Remove All Stock</option>
                                </select>
                            </div>

                            {adjData.type === 'DELETE_SPECIFIC' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity to Remove</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={selectedItem?.itemQuantity + (selectedItem?.boxQuantity * (selectedItem?.product?.boxSize || 0))}
                                        className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900"
                                        value={adjData.quantity}
                                        onChange={(e) => setAdjData({ ...adjData, quantity: e.target.value })}
                                        placeholder={`Max: ${selectedItem?.itemQuantity + (selectedItem?.boxQuantity * (selectedItem?.product?.boxSize || 0))}`}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea
                                    required
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900"
                                    value={adjData.reason}
                                    onChange={(e) => setAdjData({ ...adjData, reason: e.target.value })}
                                    placeholder="e.g. Damaged items, Inventory audit"
                                    rows="3"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/25"
                                >
                                    Confirm Adjustment
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
