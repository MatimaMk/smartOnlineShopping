// src/app/utils/storage/localStorage.ts

import { User, Product, Order, CartItem } from "@/app/types";

const STORAGE_KEYS = {
  USERS: "fashion_app_users",
  PRODUCTS: "fashion_app_products",
  ORDERS: "fashion_app_orders",
  CURRENT_USER: "fashion_app_current_user",
  CART: "fashion_app_cart",
};

// Generic storage functions
export const getFromStorage = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from storage: ${key}`, error);
    return null;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to storage: ${key}`, error);
  }
};

export const removeFromStorage = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from storage: ${key}`, error);
  }
};

// User Management
export const getUsers = (): User[] => {
  return getFromStorage<User[]>(STORAGE_KEYS.USERS) || [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex((u) => u.id === user.id);

  if (existingIndex !== -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  saveToStorage(STORAGE_KEYS.USERS, users);
};

export const getCurrentUser = (): User | null => {
  return getFromStorage<User>(STORAGE_KEYS.CURRENT_USER);
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  } else {
    removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  }
};

// Product Management
export const getProducts = (): Product[] => {
  return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const existingIndex = products.findIndex((p) => p.id === product.id);

  if (existingIndex !== -1) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }

  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
};

export const initializeProducts = (products: Product[]): void => {
  const existing = getProducts();
  if (existing.length === 0) {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  }
};

// Cart Management
export const getCart = (): CartItem[] => {
  return getFromStorage<CartItem[]>(STORAGE_KEYS.CART) || [];
};

export const saveCart = (cart: CartItem[]): void => {
  saveToStorage(STORAGE_KEYS.CART, cart);
};

export const clearCart = (): void => {
  saveToStorage(STORAGE_KEYS.CART, []);
};

// Order Management
export const getOrders = (): Order[] => {
  return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS) || [];
};

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  orders.push(order);
  saveToStorage(STORAGE_KEYS.ORDERS, orders);
};

export const getUserOrders = (userId: string): Order[] => {
  const orders = getOrders();
  return orders.filter((order) => order.userId === userId);
};

export const updateOrderStatus = (
  orderId: string,
  status: Order["status"]
): void => {
  const orders = getOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  }
};

// Product stock management
export const updateProductStock = (productId: string, quantity: number): boolean => {
  const products = getProducts();
  const productIndex = products.findIndex((p) => p.id === productId);

  if (productIndex !== -1) {
    const product = products[productIndex];
    const newStock = product.stockLevel - quantity;

    // Check if enough stock available
    if (newStock < 0) {
      return false;
    }

    products[productIndex].stockLevel = newStock;
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return true;
  }

  return false;
};

// Create order and update stock
export const createOrderWithStockUpdate = (
  userId: string,
  items: CartItem[],
  totalAmount: number,
  paymentMethod: string,
  shippingAddress: string
): { success: boolean; message: string; order?: Order } => {
  // First, check if all items have sufficient stock
  const products = getProducts();

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return {
        success: false,
        message: `Product ${item.productId} not found`,
      };
    }

    if (product.stockLevel < item.quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${product.name}. Only ${product.stockLevel} available.`,
      };
    }
  }

  // If all stock checks pass, update stock levels
  for (const item of items) {
    const success = updateProductStock(item.productId, item.quantity);
    if (!success) {
      return {
        success: false,
        message: "Failed to update stock. Please try again.",
      };
    }
  }

  // Create the order
  const order: Order = {
    id: Date.now().toString(),
    userId,
    items,
    totalAmount,
    status: "completed",
    date: new Date().toISOString(),
    paymentMethod,
    shippingAddress,
  };

  saveOrder(order);

  return {
    success: true,
    message: "Order placed successfully!",
    order,
  };
};

// Delete product
export const deleteProduct = (productId: string): void => {
  const products = getProducts();
  const filteredProducts = products.filter((p) => p.id !== productId);
  saveToStorage(STORAGE_KEYS.PRODUCTS, filteredProducts);
};

// Initialize demo data
export const initializeDemoData = (): void => {
  const products = getProducts();
  if (products.length === 0) {
    const demoProducts: Product[] = [
      {
        id: "1",
        name: "Classic Cotton T-Shirt",
        category: "Tops",
        size: ["S", "M", "L", "XL"],
        color: ["White", "Black", "Navy", "Gray"],
        price: 549.99,
        stockLevel: 150,
        imageURL:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        description: "Comfortable cotton t-shirt perfect for everyday wear",
        brand: "StyleCo",
      },
      {
        id: "2",
        name: "Slim Fit Jeans",
        category: "Bottoms",
        size: ["28", "30", "32", "34", "36"],
        color: ["Blue", "Black", "Dark Gray"],
        price: 1299.99,
        stockLevel: 100,
        imageURL:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        description: "Modern slim fit jeans with stretch fabric",
        brand: "DenimPro",
      },
      {
        id: "3",
        name: "Leather Jacket",
        category: "Outerwear",
        size: ["S", "M", "L", "XL"],
        color: ["Black", "Brown"],
        price: 3599.99,
        stockLevel: 50,
        imageURL:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
        description: "Premium leather jacket with modern design",
        brand: "LeatherLux",
      },
      {
        id: "4",
        name: "Summer Dress",
        category: "Dresses",
        size: ["XS", "S", "M", "L"],
        color: ["Floral", "Red", "Blue", "Yellow"],
        price: 899.99,
        stockLevel: 80,
        imageURL:
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
        description: "Light and breezy summer dress",
        brand: "SummerStyle",
      },
      {
        id: "5",
        name: "Sneakers",
        category: "Footwear",
        size: ["7", "8", "9", "10", "11"],
        color: ["White", "Black", "Red"],
        price: 1499.99,
        stockLevel: 120,
        imageURL:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
        description: "Comfortable athletic sneakers",
        brand: "SportFit",
      },
      {
        id: "6",
        name: "Wool Sweater",
        category: "Tops",
        size: ["S", "M", "L", "XL"],
        color: ["Beige", "Navy", "Gray", "Burgundy"],
        price: 1199.99,
        stockLevel: 90,
        imageURL:
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",
        description: "Warm wool sweater for cold weather",
        brand: "WinterWear",
      },
    ];
    saveToStorage(STORAGE_KEYS.PRODUCTS, demoProducts);
  }
};
