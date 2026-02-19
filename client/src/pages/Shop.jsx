import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import CartContext from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import toast, { Toaster } from 'react-hot-toast';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);
    const socket = useSocket();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://localhost:5000/api/products', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(data.products);

                // Join product rooms
                if (socket) {
                    data.products.forEach(p => {
                        socket.emit('subscribe_product', p.id);
                    });
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleStockUpdate = (data) => {
            // data = { productId, warehouseId, change, type }
            setProducts(prevProducts => prevProducts.map(p => {
                if (p.id === data.productId) {
                    const newStock = p.totalStock + data.change;
                    return { ...p, totalStock: newStock };
                }
                return p;
            }));

            // Optional: Toast for real-time stock updates if critical
        };

        socket.on('stock_update', handleStockUpdate);

        return () => {
            socket.off('stock_update', handleStockUpdate);
        };
    }, [socket]);

    const handleAddToCart = (product) => {
        addToCart({ ...product, price: parseFloat(product.amount) });
        toast.success((t) => (
            <div className="flex items-center gap-2">
                <span className="font-bold">Added to cart!</span>
                <span className="text-sm text-gray-500">{product.name}</span>
            </div>
        ), {
            icon: '🛒',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in relative">
            <Toaster position="bottom-center" reverseOrder={false} />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-4 text-white shadow-xl mb-10 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">Shop Our Collection</h1>
                    <p className="text-indigo-100 text-lg max-w-xl">Discover premium products curated just for you. Quality guaranteed.</p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-20"></div>
                <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-purple-500/30 rounded-full blur-2xl"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="h-44 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                            {product.image ? (
                                <img
                                    src={`/${product.image}`}
                                    alt={product.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <span className="text-gray-300 text-4xl">No Image</span>
                            )}

                            {/* Stock Badge Overlay */}
                            <div className="absolute top-3 right-3">
                                {product.totalStock > 0 ? (
                                    <span className="bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                        Sold Out
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                            <div className="mb-auto">
                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1 opacity-80">{product.category}</p>
                                <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 hidden">Product description placeholder if available.</p>
                            </div>

                            <div className="flex justify-between items-end mt-6 pt-4 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-medium uppercase">Price</span>
                                    <span className="font-extrabold text-2xl text-gray-900">${parseFloat(product.amount).toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    disabled={product.totalStock <= 0}
                                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${product.totalStock > 0
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    title={product.totalStock > 0 ? "Add to Cart" : "Out of Stock"}
                                >
                                    <ShoppingCart size={22} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No products available</h3>
                    <p className="text-gray-500 mt-1">Check back soon for new arrivals!</p>
                </div>
            )}
        </div>
    );
};

export default Shop;
