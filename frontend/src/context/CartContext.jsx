import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CartContext = createContext();

/* eslint-disable react-refresh/only-export-components */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product) => {
    let stockExceeded = false;
    
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);
      
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          stockExceeded = true;
          return prevItems;
        }
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      if (product.stock <= 0) {
        stockExceeded = true;
        return prevItems;
      }
      
      return [...prevItems, { ...product, quantity: 1 }];
    });

    if (stockExceeded) {
      showNotification(t('cart.out_of_stock_msg', { count: product.stock }), 'error');
    } else {
      showNotification(`${product.name} added to cart!`, 'success');
    }
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId, amount) => {
    let stockExceeded = false;
    let maxStock = 0;

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id === productId) {
          const newQuantity = item.quantity + amount;
          if (newQuantity > item.stock) {
            stockExceeded = true;
            maxStock = item.stock;
            return item;
          }
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );

    if (stockExceeded) {
      showNotification(t('cart.max_stock_msg', { count: maxStock }), 'error');
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const getItemQuantity = (productId) => {
    const item = cartItems.find((i) => i._id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
        cartTotal,
        cartCount,
        notification,
      }}
    >
      {children}
      {notification && (
        <div className={`fixed bottom-10 right-10 z-[100] ${
          notification.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
        } text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-white/10`}>
          <div className={`${notification.type === 'error' ? 'bg-white/20' : 'bg-primary'} p-1.5 rounded-full`}>
            {notification.type === 'error' ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
          <p className="font-bold text-sm tracking-tight">{notification.message}</p>
        </div>
      )}
    </CartContext.Provider>
  );
};
