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
            toast.success('Order placed successfully.', { id: toastId });
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 animate-fade-in bg-gradient-to-b from-indigo-50/30 to-white">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                    <CartIcon size={40} className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                <p className="text-slate-500 text-sm text-center max-w-sm mb-8">
                    Add items from the shop to see them here and proceed to checkout.
                </p>
                <button
                    onClick={() => navigate('/shop')}
                    className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25"
                >
                    Go to Shop
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in bg-white">
            <div className="mb-8 pb-4 border-b border-indigo-100">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shopping cart</h1>
                <p className="text-sm text-indigo-600 mt-0.5">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-center hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all"
                        >
                            <div className="h-20 w-20 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0">
                                {item.image ? (
                                    <img src={`/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-indigo-300">
                                        <CartIcon size={24} strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                                {item.sku && <p className="text-xs text-slate-500 mt-0.5">{item.sku}</p>}
                                <p className="text-sm font-semibold text-indigo-600 mt-1">${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</p>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1 bg-indigo-50 rounded-lg p-1 border border-indigo-100">
                                    <button
                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                        className="p-1.5 rounded-md hover:bg-indigo-100 text-indigo-700 transition-colors disabled:opacity-50"
                                        disabled={item.quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={16} strokeWidth={2} />
                                    </button>
                                    <span className="text-sm font-semibold text-slate-900 w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="p-1.5 rounded-md hover:bg-indigo-100 text-indigo-700 transition-colors"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={16} strokeWidth={2} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Remove item"
                                    aria-label="Remove item"
                                >
                                    <Trash2 size={18} strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-indigo-100 p-6 sticky top-24 shadow-lg shadow-indigo-500/5">
                        <h2 className="text-lg font-bold text-slate-900 mb-5">Order summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-slate-900">${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Shipping</span>
                                <span className="text-slate-500">Calculated at checkout</span>
                            </div>
                            <div className="border-t border-indigo-100 pt-4 flex justify-between items-center">
                                <span className="font-semibold text-slate-900">Total</span>
                                <span className="text-lg font-bold text-indigo-600">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-500/25"
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    Checkout
                                    <ArrowRight size={18} strokeWidth={2} />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-slate-400 text-center mt-4">
                            Secure checkout
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
