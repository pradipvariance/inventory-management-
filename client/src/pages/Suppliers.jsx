import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Phone, User } from 'lucide-react';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', contactInfo: '' });

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/suppliers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/suppliers', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({ name: '', contactInfo: '' });
            setShowModal(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Error creating supplier:', error);
            alert(error.response?.data?.message || 'Error creating supplier');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                    <Plus size={20} /> Add Supplier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
                                <p className="text-sm text-gray-500">Added: {new Date(supplier.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={18} />
                            <span>{supplier.contactInfo}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                                <textarea
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.contactInfo}
                                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
