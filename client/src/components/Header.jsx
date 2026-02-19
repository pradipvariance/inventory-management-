import { useState, useEffect, useContext } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
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
        if (user?.role === 'WAREHOUSE_ADMIN') {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user]);

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
        <header className="bg-white shadow-sm h-20 flex items-center justify-between px-8 z-20 sticky top-0 border-b border-gray-100">
            {/* Left Side - Welcome Message */}
            {/* Left Side - Warehouse Context */}
            <div className="flex flex-col">
                {user?.warehouse?.name ? (
                    <>
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Current Warehouse</span>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">{user.warehouse.name}</h2>
                    </>
                ) : (
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Inventory Management System</h2>
                )}
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-6">

                {/* Notification Bell - Restricted to Warehouse Admin */}
                {user?.role === 'WAREHOUSE_ADMIN' && (
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 relative group"
                        >
                            <Bell size={22} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-fade-in">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                    <span className="font-semibold text-gray-800">Notifications</span>
                                    {notifications.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{notifications.length} New</span>}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                                            <Bell size={32} className="mb-2 opacity-20" />
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-sm font-medium text-gray-900">Transfer Request</p>
                                                    <span className="text-xs text-gray-400">Just now</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                                    <span className="font-semibold text-gray-700">{notif.fromWarehouse.name}</span> requests
                                                    <span className="font-bold text-gray-800"> {notif.itemQuantity} </span>
                                                    units of <span className="font-medium text-indigo-600">{notif.product.name}</span>.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(notif.id)}
                                                        className="flex-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(notif.id)}
                                                        className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
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
                )}

                {/* Vertical Divider */}
                <div className="h-8 w-px bg-gray-200"></div>

                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 hover:bg-gray-50 py-1.5 px-2 rounded-xl transition-all duration-200"
                    >
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-bold text-gray-800 leading-none">{user?.name}</span>
                            <span className="text-xs text-gray-500 font-medium mt-1">
                                {user?.warehouse?.name ? user.warehouse.name : user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-fade-in">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <div className="p-2">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Account
                                </div>
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                                    <User size={16} className="text-gray-400" /> Profile
                                </button>
                                <div className="my-1 border-t border-gray-100"></div>
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
