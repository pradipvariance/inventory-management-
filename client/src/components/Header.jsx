import { useState, useEffect, useContext } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/transfers/pending-count', config);
            setNotifications(data.transfers);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/transfers/${id}/approve`, {}, config);
            fetchNotifications();
            setShowNotifications(false);
        } catch (error) {
            console.error('Error approving transfer:', error);
            alert(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/transfers/${id}/reject`, {}, config);
            fetchNotifications();
            setShowNotifications(false);
        } catch (error) {
            console.error('Error rejecting transfer:', error);
        }
    };

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10 relative">
            <h2 className="text-xl font-semibold text-gray-800">
                Welcome, {user?.name}
                <span className="text-sm font-normal text-gray-500 ml-2">({user?.role?.replace('_', ' ')})</span>
                {user?.warehouse && <span className="text-sm font-normal text-gray-500 ml-2">- {user.warehouse.name}</span>}
            </h2>

            <div className="flex items-center space-x-6">
                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-full hover:bg-gray-100 relative"
                    >
                        <Bell size={20} className="text-gray-600" />
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
                            <div className="p-3 border-b border-gray-100 font-semibold text-gray-700">
                                Notifications
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                                            <p className="text-xs text-gray-500 mb-1">
                                                Request from <span className="font-medium text-gray-700">{notif.fromWarehouse.name}</span>
                                            </p>
                                            <p className="text-sm text-gray-800 mb-2">
                                                Incoming: <span className="font-bold">{notif.itemQuantity}</span> {notif.product.name}
                                            </p>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleApprove(notif.id)}
                                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(notif.id)}
                                                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
