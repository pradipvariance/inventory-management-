import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Super Admin Restricted Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route element={<Layout />}>
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/adjustments" element={<Adjustments />} />
                <Route path="/transfers" element={<StockTransfers />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
              </Route>
            </Route>

            {/* Shared Admin Routes (Super Admin, Warehouse Admin, Inventory Manager) */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WAREHOUSE_ADMIN', 'INVENTORY_MANAGER']} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/inventory" element={<Inventory />} />
              </Route>
            </Route>

            {/* Hidden/Restricted Routes */}
            <Route element={<ProtectedRoute allowedRoles={[]} />}>
              <Route element={<Layout />}>
                <Route path="/suppliers" element={<Suppliers />} />
              </Route>
            </Route>

            {/* Customer/Shared Routes (Excluding Warehouse Admin from Shop/Orders as per request) */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN']} />}>
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
    </Router >
  );
}

export default App;
