import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, Truck, Users, Settings, LogOut, ArrowRightLeft, FileText, ShoppingBag, Box } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);

    const allNavigation = [
        { name: 'Dashboard', href: '/', icon: Home, roles: ['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'] },
        { name: 'Warehouses', href: '/warehouses', icon: Truck, roles: ['SUPER_ADMIN'] },
        { name: 'Products', href: '/products', icon: Package, roles: ['SUPER_ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_ADMIN'] },
        { name: 'Inventory', href: '/inventory', icon: Box, roles: ['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'] },
        { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft, roles: ['SUPER_ADMIN'] },
        { name: 'Adjustments', href: '/adjustments', icon: FileText, roles: ['SUPER_ADMIN'] },
        { name: 'Shop', href: '/shop', icon: ShoppingBag, roles: ['CUSTOMER'] },
        { name: 'Cart', href: '/cart', icon: ShoppingCart, roles: ['CUSTOMER'] },
        { name: 'Orders', href: '/orders', icon: FileText, roles: ['CUSTOMER'] },
        { name: 'Suppliers', href: '/suppliers', icon: Users, roles: [] },
        { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText, roles: ['SUPER_ADMIN', 'SUPPLIER'] },
    ];

    const navigation = allNavigation.filter(item => item.roles.includes(user?.role));

    return (
        <div className="flex flex-col w-72 bg-slate-900 text-white transition-all duration-300 border-r border-slate-800">
            {/* Logo Area */}
            <div className="flex items-center justify-center h-16 bg-slate-950 border-b border-slate-800 shadow-md">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <Box size={24} className="text-white" />
                    </div>
                    <h1 className="text-base font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                        IMS
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {user?.role && (
                    <div className="px-4 mb-6">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Menu
                        </p>
                    </div>
                )}

                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon
                                size={20}
                                className={`mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}
                            />
                            <span className="font-medium text-sm">{item.name}</span>
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors duration-200 group"
                >
                    <LogOut size={18} className="mr-3 group-hover:text-red-400 transition-colors" />
                    <span className="text-sm font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
