import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Warehouses from './pages/Warehouses';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import StockTransfers from './pages/StockTransfers';
import Adjustments from './pages/Adjustments';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import Unauthorized from './pages/Unauthorized';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Routes */}
            {/* Super Admin & Inventory Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'INVENTORY_MANAGER']} />}>
              <Route element={<Layout />}>
                <Route path="/products" element={<Products />} />
                <Route path="/adjustments" element={<Adjustments />} />
                <Route path="/suppliers" element={<Suppliers />} />
              </Route>
            </Route>

            {/* Super Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route element={<Layout />}>
                <Route path="/warehouses" element={<Warehouses />} />
              </Route>
            </Route>

            {/* Shared Admin Routes (Inc. Warehouse Admin) */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER']} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<div className="font-bold text-2xl">Dashboard Home</div>} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/transfers" element={<StockTransfers />} />
              </Route>
            </Route>

            {/* Supplier Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPPLIER', 'SUPER_ADMIN', 'INVENTORY_MANAGER']} />}>
              <Route element={<Layout />}>
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
              </Route>
            </Route>

            {/* Customer/Shared Routes (Excluding Warehouse Admin from Shop/Orders as per request) */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN', 'INVENTORY_MANAGER']} />}>
              <Route element={<Layout />}>
                <Route path="/shop" element={<Shop />} />
                <Route path="/orders" element={<Orders />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route element={<Layout />}>
                <Route path="/cart" element={<Cart />} />
              </Route>
            </Route>

          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
