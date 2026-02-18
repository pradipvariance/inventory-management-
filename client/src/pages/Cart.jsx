import { useContext, useState } from 'react';
import CartContext from '../context/CartContext';
import { Trash2, ShoppingCart as CartIcon } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
    const { cart, total, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Mock loading for initial cart load if needed, but Context handles it. 
    // If we want a cart page loader, we can use a local state or check context loading.
    // For now, let's keep it simple as Cart Context loads fast from localStorage.
    // However, the checkout process has a loading state.

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const items = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            await axios.post('http://localhost:5000/api/orders', {
                items,
                totalAmount: total
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            clearCart();
            alert('Order placed successfully!');
            navigate('/orders');
        } catch (error) {
            console.error('Checkout failed:', error);
            alert(error.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <CartIcon size={48} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <button
                    onClick={() => navigate('/shop')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Shopping Cart</h1>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cart.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    <div className="text-sm text-gray-500">{item.sku}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-16 border rounded p-1"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price * item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                    <div className="text-xl font-bold text-gray-800">Total: ${total}</div>
                    <button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Checkout'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
