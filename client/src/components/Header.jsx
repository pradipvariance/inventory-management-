import { useState, useEffect } from 'react';
import { Bell, User, LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (user?.role === 'WAREHOUSE_ADMIN') {
                const { data } = await axios.get('http://localhost:5000/api/transfers/pending-count', config);
                setNotifications(data.transfers.map(t => ({ ...t, type: 'TRANSFER' })));
            } else if (user?.role === 'INVENTORY_MANAGER') {
                const { data } = await axios.get('http://localhost:5000/api/orders/pending-count', config);
                setNotifications(data.orders.map(o => ({ ...o, type: 'ORDER' })));
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (socket && (user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'INVENTORY_MANAGER')) {
            fetchNotifications();

            socket.on('new_order', () => {
                if (user?.role === 'INVENTORY_MANAGER') fetchNotifications();
            });

            socket.on('order_updated', () => {
                if (user?.role === 'INVENTORY_MANAGER') fetchNotifications();
            });

            socket.on('transfer_updated', () => {
                if (user?.role === 'INVENTORY_MANAGER' || user?.role === 'WAREHOUSE_ADMIN') fetchNotifications();
            });

            socket.on('new_transfer', () => {
                if (user?.role === 'WAREHOUSE_ADMIN') fetchNotifications();
            });

            const interval = setInterval(fetchNotifications, 60000);

            return () => {
                socket.off('new_order');
                socket.off('order_updated');
                socket.off('new_transfer');
                socket.off('transfer_updated');
                clearInterval(interval);
            };
        }
    }, [user, socket]);

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

    const handleProcessOrder = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: 'PROCESSING' }, config);
            fetchNotifications();
            setShowNotifications(false);
        } catch (error) {
            console.error('Error processing order:', error);
        }
    };

    return (
        <header className="h-[72px] flex items-center justify-between px-6 lg:px-8 bg-slate-900 border-b border-slate-700/60 shrink-0 z-20 sticky top-0">
            {/* Left: title / warehouse */}
            <div className="flex items-center gap-3 min-w-0">
                {user?.warehouse?.name ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" aria-hidden />
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Warehouse</span>
                        <h2 className="text-sm font-bold text-white truncate">{user.warehouse.name}</h2>
                    </div>
                ) : (
                    <h2 className="text-base font-bold text-white tracking-tight">Overview</h2>
                )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
                {(user?.role === 'WAREHOUSE_ADMIN' || user?.role === 'INVENTORY_MANAGER') && (
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
                            aria-label="Notifications"
                        >
                            <Bell size={20} strokeWidth={2} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-slate-900 ring-1 ring-rose-400/50" />
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in origin-top-right">
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                                    {notifications.length > 0 && (
                                        <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full">
                                            {notifications.length}
                                        </span>
                                    )}
                                </div>
                                <div className="max-h-[20rem] overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="py-12 px-4 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <Bell size={22} className="text-slate-300" />
                                            </div>
                                            <p>No new notifications</p>
                                        </div>
                                    ) : (
                                        <div className="p-2">
                                            {notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className="p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                                                >
                                                    <button
                                                        type="button"
                                                        className="w-full text-left block"
                                                        onClick={() => {
                                                            setShowNotifications(false);
                                                            if (notif.type === 'ORDER') {
                                                                navigate('/', { state: { tab: 'orders' } });
                                                            } else {
                                                                navigate('/', { state: { tab: 'transfers' } });
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`h-2 w-2 rounded-full shrink-0 ${notif.type === 'ORDER' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {notif.type === 'ORDER' ? 'Customer order' : 'Stock transfer'}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">New</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                                            {notif.type === 'ORDER' ? (
                                                                <>
                                                                    <span className="font-medium text-slate-800">{notif.customer?.name}</span> placed an order for{' '}
                                                                    <span className="font-semibold text-amber-600">{notif.orderItems?.length || 0}</span> products.
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="font-medium text-slate-800">{notif.fromWarehouse?.name}</span> requesting{' '}
                                                                    <span className="font-semibold text-indigo-600">{notif.itemQuantity}</span> units of {notif.product?.name}.
                                                                </>
                                                            )}
                                                        </p>
                                                        <p className="text-xs font-medium text-indigo-600 mb-2">
                                                            {notif.type === 'ORDER' ? 'View orders →' : 'View transfer requests →'}
                                                        </p>
                                                    </button>
                                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                        {notif.type === 'ORDER' ? (
                                                            <button
                                                                onClick={() => handleProcessOrder(notif.id)}
                                                                className="flex-1 px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                                                            >
                                                                Process order
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(notif.id)}
                                                                    className="flex-1 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(notif.id)}
                                                                    className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="h-8 w-px bg-slate-700" aria-hidden />

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 py-1.5 pl-1.5 pr-3 rounded-xl hover:bg-slate-800 transition-all duration-200"
                    >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/30 ring-2 ring-white/10 shrink-0">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden sm:flex flex-col items-start text-left">
                            <span className="text-sm font-semibold text-white leading-tight truncate max-w-[120px]">{user?.name}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                                {user?.role?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-scale-in origin-top-right">
                            <div className="p-2">
                                <button className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-2.5 font-medium">
                                    <User size={17} className="text-slate-400" />
                                    Profile
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2.5 font-semibold"
                                >
                                    <LogOut size={17} />
                                    Sign out
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
