
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Search, MapPin, Package } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';

const Warehouses = () => {
    const { user } = useContext(AuthContext);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', location: '', capacity: 1000 });

    // UI States
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 8;

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/warehouses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWarehouses(data);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    // Client-side filtering and pagination
    const filteredWarehouses = warehouses.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.location.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
    const displayedWarehouses = filteredWarehouses.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // Smooth scroll to top when page changes
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/warehouses', {
                ...formData,
                capacity: parseInt(formData.capacity)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({ name: '', location: '', capacity: 1000 });
            setShowModal(false);
            fetchWarehouses();
        } catch (error) {
            console.error('Error creating warehouse:', error);
            alert(error.response?.data?.message || 'Error creating warehouse');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this warehouse?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/warehouses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchWarehouses();
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            alert(error.response?.data?.message || 'Error deleting warehouse');
        }
    }

    if (loading) return <Loader text="Loading Warehouses..." />;

    return (
        <div className="min-h-screen bg-white animate-fade-in">
            {/* Header */}
            <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouses</h1>
                            <p className="text-sm text-indigo-600 mt-0.5">Manage your storage locations.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Search warehouse..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm bg-white border border-indigo-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-indigo-500/25"
                            >
                                <Plus size={20} strokeWidth={2} /> Add warehouse
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="hide-scrollbar-x">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity (Avail/Total)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {displayedWarehouses.map((warehouse) => (
                                    <tr key={warehouse.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <Link to={`/warehouses/${warehouse.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                                                {warehouse.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <MapPin size={14} className="text-indigo-400" />
                                                <span className="text-sm">{warehouse.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-indigo-600 font-semibold">{warehouse.usage?.available} avail</span>
                                                    <span className="text-slate-400">/ {warehouse.usage?.capacity}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${(warehouse.usage?.used / warehouse.usage?.capacity) > 0.9 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                                                            (warehouse.usage?.used / warehouse.usage?.capacity) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (warehouse.usage?.used / warehouse.usage?.capacity) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(warehouse.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleDelete(warehouse.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete warehouse"
                                            >
                                                <Trash2 size={18} strokeWidth={2} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {displayedWarehouses.length === 0 && !loading && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                <Search size={28} className="text-indigo-500" />
                            </div>
                            <p className="text-slate-900 font-semibold">No warehouses found</p>
                            <p className="text-sm text-slate-500 mt-1">Try a different search term or add a new warehouse.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-600">
                            Page <span className="font-semibold text-indigo-600">{page}</span> of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Add Warehouse Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in border border-slate-200 overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                                    <MapPin size={18} strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Add New Warehouse</h2>
                                    <p className="text-indigo-200 text-xs mt-0.5">Enter details to create a new storage location.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors" aria-label="Close">
                                <Plus size={18} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col">

                            {/* Fields */}
                            <div className="p-6">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warehouse Details</p>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Warehouse Name <span className="text-rose-400">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-500"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Central Hub"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Location <span className="text-rose-400">*</span></label>
                                        <div className="relative">
                                            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                required
                                                className="block w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-500"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g. New York, NY"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Capacity <span className="text-rose-400">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm text-slate-900 transition-all placeholder-slate-500"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            placeholder="1000"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1.5">Total storage units this warehouse can hold.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                                    <Plus size={15} strokeWidth={2.5} />
                                    Create Warehouse
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Warehouses;
