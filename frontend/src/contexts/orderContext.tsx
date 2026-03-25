import React, { createContext, useContext, useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  customerName: string;
  table?: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  submitOrder: (customerName: string, table?: number) => Promise<void>;
  updateOrderStatus: (orderId: number, status: string) => Promise<void>;
  getOrderById: (orderId: number) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);
let socket: Socket;

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);

  useEffect(() => {
    socket = io('http://localhost:5000');

    socket.on('order-received', (order) => {
      setOrders((prev) => [...prev, order]);
    });

    socket.on('order-status-changed', (data) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addToCart = (item: OrderItem) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setCart((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const submitOrder = async (customerName: string, table?: number) => {
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        totalPrice,
        customerName,
        table,
      }),
    });

    const order = await response.json();
    socket.emit('new-order', order);
    setCurrentOrder(order);
    clearCart();
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const order = await response.json();
    socket.emit('order-status-update', { orderId, status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
  };

  const getOrderById = async (orderId: number) => {
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}`);
    const order = await response.json();
    setCurrentOrder(order);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        submitOrder,
        updateOrderStatus,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};