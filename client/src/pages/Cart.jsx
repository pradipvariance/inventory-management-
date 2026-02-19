import { useContext, useState } from 'react';
import CartContext from '../context/CartContext';
import { Trash2, ShoppingCart as CartIcon, ArrowRight, Minus, Plus } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Cart = () => {
    const { cart, total, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCheckout = async () => {
        setLoading(true);
        const toastId = toast.loading('Processing order...');
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
            toast.success('Order placed successfully!', { id: toastId });
            navigate('/orders');
        } catch (error) {
            console.error('Checkout failed:', error);
            toast.error(error.response?.data?.message || 'Checkout failed', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="bg-indigo-50 p-8 rounded-full mb-6">
                    <CartIcon size={64} className="text-indigo-200" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Your cart is empty</h2>
                <p className="text-gray-500 mb-8 max-w-md text-center">Looks like you haven't added anything to your cart yet. Browse our products to find something you'll love.</p>
                <button
                    onClick={() => navigate('/shop')}
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-1"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-extrabold mb-8 text-gray-900">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center group transition-all hover:shadow-md"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Product Image */}
                            <div className="h-24 w-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                                {item.image ? (
                                    <img src={`/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <CartIcon size={24} />
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{item.sku}</p>
                                <div className="font-bold text-indigo-600">${item.price}</div>
                            </div>

                            {/* Quantity Controls - Desktop/Tablet */}
                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                        className="p-1 hover:bg-white rounded-md transition-colors text-gray-600"
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="p-1 hover:bg-white rounded-md transition-colors text-gray-600"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                    title="Remove item"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span>$0.00</span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-lg font-bold text-gray-900">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    Checkout <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            Secure checkout powered by Stripe (Mock)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
