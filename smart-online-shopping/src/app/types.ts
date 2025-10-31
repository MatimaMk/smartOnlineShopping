// src/app/types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  address?: string;
  preferences: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  size: string[];
  color: string[];
  price: number;
  stockLevel: number;
  imageURL: string;
  description: string;
  brand: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  color: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "completed";
  date: string;
  paymentMethod: string;
  shippingAddress: string;
}
