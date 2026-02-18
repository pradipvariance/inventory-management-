import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, Truck, Users, Settings, LogOut, ArrowRightLeft, FileText, ShoppingBag } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);

    const allNavigation = [
        { name: 'Dashboard', href: '/', icon: Home, roles: ['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'] },
        { name: 'Warehouses', href: '/warehouses', icon: Truck, roles: ['SUPER_ADMIN'] },
        { name: 'Products', href: '/products', icon: Package, roles: ['SUPER_ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_ADMIN'] },
        { name: 'Inventory', href: '/inventory', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER'] },
        { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft, roles: ['SUPER_ADMIN'] },
        { name: 'Adjustments', href: '/adjustments', icon: FileText, roles: ['SUPER_ADMIN'] },
        { name: 'Shop', href: '/shop', icon: ShoppingBag, roles: ['CUSTOMER', 'SUPER_ADMIN'] },
        { name: 'Cart', href: '/cart', icon: ShoppingCart, roles: ['CUSTOMER'] },
        { name: 'Orders', href: '/orders', icon: FileText, roles: ['CUSTOMER', 'SUPER_ADMIN'] },
        { name: 'Suppliers', href: '/suppliers', icon: Users, roles: ['SUPER_ADMIN'] },
        { name: 'Purchase Orders', href: '/purchase-orders', icon: FileText, roles: ['SUPPLIER', 'SUPER_ADMIN'] },
    ];

    const navigation = allNavigation.filter(item => item.roles.includes(user?.role));

    return (
        <div className="flex flex-col w-64 bg-gray-800 text-white">
            <div className="flex items-center justify-center h-20 shadow-md">
                <h1 className="text-3xl font-bold"></h1>
            </div>
            <ul className="flex-col py-4">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                        <li key={item.name}>
                            <Link
                                to={item.href}
                                className={`flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-400 hover:text-gray-100 ${location.pathname === item.href ? 'text-gray-100 bg-gray-700' : ''
                                    }`}
                            >
                                <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                                    <Icon size={20} />
                                </span>
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        </li>
                    );
                })}
                <li>
                    <button
                        onClick={logout}
                        className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-gray-400 hover:text-red-400 w-full text-left"
                    >
                        <span className="inline-flex items-center justify-center h-12 w-12 text-lg text-gray-400">
                            <LogOut size={20} />
                        </span>
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
