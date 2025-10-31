// src/app/utils/auth.ts

import { User } from "@/app/types";
import {
  getUsers,
  saveUser,
  getCurrentUser,
  setCurrentUser,
} from "@/app/utils/storage/localStorage";

export const hashPassword = (password: string): string => {
  // Simple hash for demo purposes (in production, use proper bcrypt)
  return btoa(password);
};

export const verifyPassword = (
  password: string,
  hashedPassword: string
): boolean => {
  return btoa(password) === hashedPassword;
};

export const authenticateUser = (
  email: string,
  password: string
): User | null => {
  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (user && verifyPassword(password, user.password)) {
    return user;
  }

  return null;
};

export const registerUser = (
  userData: Omit<User, "id" | "createdAt">
): User | null => {
  const users = getUsers();

  // Check if email already exists
  if (users.some((u) => u.email === userData.email)) {
    return null;
  }

  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    password: hashPassword(userData.password),
    createdAt: new Date().toISOString(),
  };

  saveUser(newUser);
  return newUser;
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

export const logout = (): void => {
  setCurrentUser(null);
};
