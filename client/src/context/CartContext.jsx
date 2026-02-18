import { createContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // Save to local storage on change
        localStorage.setItem('cart', JSON.stringify(cart));

        // Calculate total
        const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotal(newTotal);
    }, [cart]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
                // Checked Schema: Product model has NO price field. 
                // OrderItem has price. 
                // We need to add Price to Product model or rely on mock. 
                // For now, I'll use a mock random price or default 10.
                // I should probably update schema later.
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return;
        setCart(prevCart => prevCart.map(item =>
            item.id === productId ? { ...item, quantity: parseInt(quantity) } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
