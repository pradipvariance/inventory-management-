import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, Truck, Users, LogOut, ArrowRightLeft, FileText, ShoppingBag, Box } from 'lucide-react';
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
        <aside className="flex flex-col w-[280px] min-w-[280px] bg-slate-900 text-white shrink-0 border-r border-slate-700/60 shadow-xl shadow-black/20">
            {/* Logo */}
            <div className="flex items-center gap-3 h-[72px] px-5 border-b border-slate-700/60 bg-slate-900/95">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-900/40 ring-2 ring-white/10">
                    <Box size={22} className="text-white" strokeWidth={2.25} />
                </div>
                <div>
                    <span className="text-lg font-bold tracking-tight text-white">IMS</span>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Inventory</p>
                </div>
            </div>

            {/* Nav */}
            <nav className={`flex-1 py-5 px-3 ${user?.role === 'SUPER_ADMIN' ? 'hide-scrollbar-y' : 'overflow-y-auto'}`}>
                {user?.role && (
                    <p className="px-3 mb-3 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                        Menu
                    </p>
                )}
                <ul className="space-y-0.5">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden
                                        ${isActive
                                            ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                                        }`}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full opacity-90" aria-hidden />
                                    )}
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors
                                        ${isActive ? 'bg-white/20' : 'bg-slate-800/60 group-hover:bg-slate-700/80'}`}>
                                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} strokeWidth={2} />
                                    </span>
                                    <span className="font-medium text-sm">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700/60 bg-slate-950/70">
                {user?.role && (
                    <div className="px-3 py-2 mb-2 rounded-lg bg-slate-800/60">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                        <span className="text-xs font-medium text-slate-300 truncate mr-1 mt-0.5">{user?.name}</span>
                        <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                            {user?.role?.replace(/_/g, ' ')}
                        </span>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors duration-200 group"
                >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/60 group-hover:bg-red-500/20 transition-colors">
                        <LogOut size={18} className="group-hover:text-red-400" />
                    </span>
                    <span className="text-sm font-medium">Sign out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
