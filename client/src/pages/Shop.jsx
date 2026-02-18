import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import CartContext from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

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
        };

        socket.on('stock_update', handleStockUpdate);

        return () => {
            socket.off('stock_update', handleStockUpdate);
        };
    }, [socket]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Shop Products</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                            {product.image ? (
                                <img src={`/${product.image}`} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-4xl">No Image</span>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                            <p className={`text-sm mb-2 font-medium ${product.totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {product.totalStock > 0 ? `${product.totalStock} in stock` : 'Out of Stock'}
                            </p>
                            <div className="flex justify-between items-center mt-4">
                                <span className="font-bold text-indigo-600">${parseFloat(product.amount).toFixed(2)}</span>
                                <button
                                    onClick={() => addToCart({ ...product, price: parseFloat(product.amount) })}
                                    disabled={product.totalStock <= 0}
                                    className={`p-2 rounded-full text-white ${product.totalStock > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                >
                                    <ShoppingCart size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Shop;
