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
        <header className="bg-white h-16 flex items-center justify-between px-8 z-20 sticky top-0 border-b border-gray-200 shadow-sm">
            {/* Left Side - Welcome Message */}
            <div className="flex flex-col">
                {user?.warehouse?.name ? (
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Warehouse:</span>
                        <h2 className="text-base font-bold text-gray-800 tracking-tight">{user.warehouse.name}</h2>
                    </div>
                ) : (
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Overview</h2>
                )}
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-6">

                {/* Notification Bell - Restricted to Warehouse Admin */}
                {user?.role === 'WAREHOUSE_ADMIN' && (
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 relative group text-gray-400 hover:text-indigo-600"
                        >
                            <Bell size={20} className="transition-colors" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-fade-in origin-top-right">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/80 backdrop-blur-sm flex justify-between items-center">
                                    <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                                    {notifications.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>}
                                </div>
                                <div className="max-h-[20rem] overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                                            <Bell size={24} className="mb-2 opacity-20" />
                                            <p>No new notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                                        <p className="text-sm font-semibold text-gray-900">Stock Transfer</p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">NEW</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                                                    <span className="font-semibold text-gray-800">{notif.fromWarehouse.name}</span> requesting
                                                    <span className="font-bold text-indigo-600"> {notif.itemQuantity} </span>
                                                    units of {notif.product.name}.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(notif.id)}
                                                        className="flex-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(notif.id)}
                                                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
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
                <div className="h-6 w-px bg-gray-200"></div>

                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 hover:bg-gray-50 py-1 pl-1 pr-3 rounded-full transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start hidden sm:flex">
                            <span className="text-xs font-bold text-gray-700 leading-none">{user?.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-scale-in origin-top-right">
                            <div className="p-1">
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2 group">
                                    <User size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    Profile
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
